import {inject, Injectable, signal, WritableSignal} from '@angular/core';
import {Changes} from "@capacitor-community/sqlite";
import {
  StaminaTraining,
  StaminaTrainingForm,
  StaminaTrainingRow,
  StaminaTrainingRows,
  StaminaTrainings
} from "../../../../models/StaminaTraining";
import {SQLParameterValue} from "../../../../models/sql/SQLParameters";
import {SQLResult} from "../../../../models/sql/SQLResult";
import {TrainingRecurrenceFrequency} from "../../../../models/enums/TrainingRecurrenceFrequency";
import {generatePlaceholders} from "../../../../utils/database/generatePlaceholders";
import {ToastService} from "../../../components/toast.service";
import {DatabaseAppService} from "../../database-app.service";
import {ProgramService} from "../program/program.service";
import {SportTypeService} from "../sportTypes/sport-types-services";
import {SportService} from "../sports/sport.service";

@Injectable({
  providedIn: 'root'
})
export class StaminaTrainingService {
  private databaseApp: DatabaseAppService = inject(DatabaseAppService);
  private sportService: SportService = inject(SportService);
  private sportTypeService: SportTypeService = inject(SportTypeService);
  private programService: ProgramService = inject(ProgramService);
  private toastService: ToastService = inject(ToastService);

  public staminaTrainings: WritableSignal<StaminaTrainings> = signal([]);
  public staminaTraining: WritableSignal<StaminaTraining | null> = signal(null);

  private hasFetchedList: boolean = false;

  public async fetchStaminaTrainings(sportTypeId?: number, sportId?: number): Promise<StaminaTrainings> {
    const filters: string[] = [];
    const parameters: SQLParameterValue[] = [];

    if (sportTypeId) {
      filters.push('st.sportTypeId = ?');
      parameters.push(sportTypeId);
    }

    if (sportId) {
      filters.push('st.sportId = ?');
      parameters.push(sportId);
    }

    const query: string = `SELECT st.id,
                                  st.name,
                                  st.predictedTime,
                                  st.predictedDifficulty,
                                  st.predictedKilometers,
                                  st.predictedWarmupTime,
                                  st.predictedWarmupKilometers,
                                  st.isActive,
                                  st.sportTypeId,
                                  st.sportId,
                                  st.programId,
                                  st.recurrenceDays,
                                  st.recurrenceFrequency,
                                  count(ss.id) as nbStaminaSessions
                           FROM StaminaTraining st
                                  LEFT JOIN StaminaSession ss ON st.id = ss.staminaTrainingId
                             ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
                           GROUP BY st.id
                           ORDER BY st.name ASC, st.id DESC;`;

    if (!this.hasFetchedList) {
      const result: SQLResult<StaminaTrainingRow> = (await this.databaseApp.database.query(query)).values as SQLResult<StaminaTrainingRow>;
      const staminaTrainings: StaminaTrainings = await this.mapRowsToTrainings(result ?? []);
      this.staminaTrainings.set(staminaTrainings);
      this.hasFetchedList = true;
      return staminaTrainings;
    }

    return this.staminaTrainings();
  }

  public async fetchStaminaTrainingById(id: number): Promise<StaminaTraining | null> {
    const result: SQLResult<StaminaTrainingRow> = (await this.databaseApp.database.query(
      `SELECT id,
              name,
              predictedTime,
              predictedDifficulty,
              predictedKilometers,
              predictedWarmupTime,
              predictedWarmupKilometers,
              isActive,
              sportTypeId,
              sportId,
              programId,
              recurrenceDays,
              recurrenceFrequency
       FROM StaminaTraining
       WHERE id = ?;`,
      [id]
    )).values as SQLResult<StaminaTrainingRow>;

    const row = result?.[0];
    if (!row) {
      this.staminaTraining.set(null);
      return null;
    }

    const training = await this.staminaTrainingRowToModel(row);
    this.staminaTraining.set(training);
    return training;
  }

  public async insertStaminaTraining(staminaTrainingForm: StaminaTrainingForm): Promise<number | undefined> {
    const sql = `INSERT INTO StaminaTraining(predictedTime, predictedDifficulty, predictedKilometers,
                                             predictedWarmupTime, predictedWarmupKilometers,
                                             name, isActive, sportTypeId, sportId, programId, recurrenceDays,
                                             recurrenceFrequency)
                 VALUES (${generatePlaceholders(12)});`;

    try {
      const result: Changes | undefined = (await this.databaseApp.database
        .run(sql, this.mapFormToParameters(staminaTrainingForm))).changes;
      this.hasFetchedList = false;
      return result?.lastId ?? -1;
    } catch (_) {
      this.toastService.showError("Il y a eu une erreur lors de la creation de l'entrainement");
      return undefined;
    }
  }

  public async updateStaminaTraining(id: number, staminaTrainingForm: StaminaTrainingForm): Promise<boolean> {
    const existingTraining: StaminaTraining | null = await this.fetchStaminaTrainingById(id);
    const sql: string = `UPDATE StaminaTraining
                         SET predictedTime             = ?,
                             predictedDifficulty       = ?,
                             predictedKilometers       = ?,
                             predictedWarmupTime       = ?,
                             predictedWarmupKilometers = ?,
                             name                      = ?,
                             isActive                  = ?,
                             sportTypeId               = ?,
                             sportId                   = ?,
                             programId                 = ?,
                             recurrenceDays            = ?,
                             recurrenceFrequency       = ?
                         WHERE id = ?;`;

    try {
      await this.databaseApp.database.run(sql, [
        ...this.mapFormToParameters(staminaTrainingForm),
        id
      ]);

      if (existingTraining?.isActive && staminaTrainingForm.isActive === false) {
        await this.databaseApp.database.run(
          'DELETE FROM StaminaSession WHERE staminaTrainingId = ? AND realised = 0;',
          [id]
        );
      }

      this.hasFetchedList = false;
      return true;
    } catch (_) {
      this.toastService.showError("Il y a eu une erreur lors de la modification de l'entrainement");
      return false;
    }
  }

  public async generateSessionsFromTraining(trainingId: number, endDate?: string | null): Promise<number> {
    const training = await this.fetchStaminaTrainingById(trainingId);
    if (!training) {
      this.toastService.showError("Entrainement introuvable");
      return 0;
    }

    if (!training.isActive) {
      this.toastService.showError("Impossible de generer des seances pour un entrainement inactif");
      return 0;
    }

    if (!training.recurrenceDays.length || !training.recurrenceFrequency) {
      this.toastService.showError("Renseigne un rythme et des jours avant de generer les seances");
      return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = endDate ? new Date(endDate) : new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    lastDate.setHours(0, 0, 0, 0);

    if (lastDate < today) {
      this.toastService.showError("La date de fin doit etre posterieure a aujourd'hui");
      return 0;
    }

    const existingDates = new Set(await this.fetchSessionDatesByTrainingId(trainingId));
    let created = 0;

    for (const sessionDate of this.buildPlannedDates(today, lastDate, training.recurrenceDays, training.recurrenceFrequency)) {
      if (existingDates.has(sessionDate)) {
        continue;
      }

      const result = await this.databaseApp.database.run(
        `INSERT INTO StaminaSession(label, realTime, realDifficulty, realKilometers, predictedTime, predictedDifficulty,
                                    predictedKilometers, predictedWarmupTime, predictedWarmupKilometers, realWarmupTime,
                                    realWarmupKilometers, date, weatherCondition, staminaTrainingId, programId,
                                    sportId, sportTypeId, realised)
         VALUES (${generatePlaceholders(18)});`,
        [
          training.name ?? null,
          0,
          0,
          0,
          training.predictedTime ?? null,
          training.predictedDifficulty ?? null,
          training.predictedKilometers ?? null,
          training.predictedWarmupTime ?? 0,
          training.predictedWarmupKilometers ?? 0,
          0,
          0,
          sessionDate,
          null,
          training.id,
          training.program?.id ?? null,
          training.sport.id,
          training.sportType?.id ?? null,
          0
        ]
      );

      if (result?.changes?.lastId) {
        created++;
      }
    }

    this.hasFetchedList = false;
    if (created === 0) {
      this.toastService.showError("Aucune nouvelle seance a generer sur cette periode");
    }

    return created;
  }

  public getRecurrenceSummary(training: StaminaTraining): string {
    if (!training.recurrenceDays.length || !training.recurrenceFrequency) {
      return 'Ponctuel';
    }

    return `${training.recurrenceDays.join(', ')} • ${training.recurrenceFrequency}`;
  }

  private async staminaTrainingRowToModel(staminaTrainingRow: StaminaTrainingRow): Promise<StaminaTraining> {
    return {
      ...staminaTrainingRow,
      isActive: Boolean(staminaTrainingRow.isActive),
      sport: (await this.sportService.getSportById(staminaTrainingRow.sportId))!,
      sportType: staminaTrainingRow.sportTypeId ? await this.sportTypeService.getSportTypeById(staminaTrainingRow.sportTypeId) ?? null : null,
      program: staminaTrainingRow.programId ? await this.programService.getProgramById(staminaTrainingRow.programId) ?? null : null,
      recurrenceDays: staminaTrainingRow.recurrenceDays ? staminaTrainingRow.recurrenceDays.split('|').filter(Boolean) : [],
      recurrenceFrequency: staminaTrainingRow.recurrenceFrequency ?? null,
      nbStaminaSessions: staminaTrainingRow.nbStaminaSessions ?? 0
    };
  }

  private async mapRowsToTrainings(staminaTrainingRows: StaminaTrainingRows): Promise<StaminaTrainings> {
    return Promise.all(staminaTrainingRows.map((staminaTrainingRow) => this.staminaTrainingRowToModel(staminaTrainingRow)));
  }

  private mapFormToParameters(staminaTrainingForm: StaminaTrainingForm): SQLParameterValue[] {
    return [
      staminaTrainingForm.predictedTime ?? null,
      staminaTrainingForm.predictedDifficulty ?? null,
      staminaTrainingForm.predictedKilometers ?? null,
      staminaTrainingForm.predictedWarmupTime ?? 0,
      staminaTrainingForm.predictedWarmupKilometers ?? 0,
      staminaTrainingForm.name?.trim() || null,
      staminaTrainingForm.isActive === false ? 0 : 1,
      staminaTrainingForm.sportType ?? null,
      staminaTrainingForm.sport ?? null,
      staminaTrainingForm.program ?? null,
      staminaTrainingForm.recurrenceDays?.length ? staminaTrainingForm.recurrenceDays.join('|') : null,
      staminaTrainingForm.recurrenceFrequency ?? null
    ];
  }

  private buildPlannedDates(
    startDate: Date,
    endDate: Date,
    recurrenceDays: string[],
    recurrenceFrequency: TrainingRecurrenceFrequency
  ): string[] {
    const dates: string[] = [];
    const dayMap = new Map<string, number>([
      ['Dimanche', 0],
      ['Lundi', 1],
      ['Mardi', 2],
      ['Mercredi', 3],
      ['Jeudi', 4],
      ['Vendredi', 5],
      ['Samedi', 6]
    ]);
    const selectedDays = recurrenceDays.map((day) => dayMap.get(day)).filter((day): day is number => day !== undefined);
    const intervalWeeks = recurrenceFrequency === TrainingRecurrenceFrequency.Weekly
      ? 1
      : recurrenceFrequency === TrainingRecurrenceFrequency.BiWeekly
        ? 2
        : 4;

    const baseline = new Date(startDate);
    baseline.setDate(startDate.getDate() - startDate.getDay() + 1);

    for (const cursor = new Date(startDate); cursor <= endDate; cursor.setDate(cursor.getDate() + 1)) {
      if (!selectedDays.includes(cursor.getDay())) {
        continue;
      }

      const cursorWeekStart = new Date(cursor);
      cursorWeekStart.setDate(cursor.getDate() - cursor.getDay() + 1);
      const diffWeeks = Math.floor((cursorWeekStart.getTime() - baseline.getTime()) / (7 * 24 * 60 * 60 * 1000));

      if (diffWeeks % intervalWeeks !== 0) {
        continue;
      }

      dates.push(this.toIsoDate(cursor));
    }

    return dates;
  }

  private toIsoDate(date: Date): string {
    const year: number = date.getFullYear();
    const month: string = `${date.getMonth() + 1}`.padStart(2, '0');
    const day: string = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private async fetchSessionDatesByTrainingId(trainingId: number): Promise<string[]> {
    const result = (await this.databaseApp.database.query(
      'SELECT date FROM StaminaSession WHERE staminaTrainingId = ?;',
      [trainingId]
    )).values as Array<{ date: string }> | undefined;

    return (result ?? []).map((row) => row.date);
  }

  public setHasFetchedList(value: boolean): void {
    this.hasFetchedList = value;
  }
}
