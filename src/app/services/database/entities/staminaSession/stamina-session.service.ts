import {inject, Injectable, signal, WritableSignal} from '@angular/core';
import {Sport} from "../../../../models/Sport";
import {SportType} from "../../../../models/SportType";
import {
  StaminaSession,
  StaminaSessionForm,
  StaminaSessionRow,
  StaminaSessionRows,
  StaminaSessions
} from "../../../../models/StaminaSession";
import {SQLParameters, SQLParameterValue} from "../../../../models/sql/SQLParameters";
import {SQLResult} from "../../../../models/sql/SQLResult";
import {generatePlaceholders} from "../../../../utils/database/generatePlaceholders";
import {ToastService} from "../../../components/toast.service";
import {DatabaseAppService} from "../../database-app.service";
import {ProgramService} from "../program/program.service";
import {SportTypeService} from "../sportTypes/sport-types-services";
import {SportService} from "../sports/sport.service";
import {StaminaTrainingService} from "../staminaTraining/stamina-training.service";

@Injectable({
  providedIn: 'root'
})
export class StaminaSessionService {
  private databaseApp: DatabaseAppService = inject(DatabaseAppService);
  private staminaTrainingService: StaminaTrainingService = inject(StaminaTrainingService);
  private programService: ProgramService = inject(ProgramService);
  private sportService: SportService = inject(SportService);
  private sportTypeService: SportTypeService = inject(SportTypeService);
  private toastService: ToastService = inject(ToastService);

  public staminaSessions: WritableSignal<StaminaSessions> = signal([]);
  public staminaSession: WritableSignal<StaminaSession | null> = signal(null);

  public async fetchStaminaSessions(
    sport: Sport | null = null,
    firstDate: string | null = null,
    lastDate: string | null = null
  ): Promise<StaminaSessions> {
    const staminaSessions: StaminaSession[] = await this.fetchStaminaSessionsChunk(sport, firstDate, lastDate);
    this.staminaSessions.set(staminaSessions);
    return staminaSessions;
  }

  public async fetchStaminaSessionsChunk(
    sport: Sport | null = null,
    firstDate: string | null = null,
    lastDate: string | null = null
  ): Promise<StaminaSessions> {
    if (!this.databaseApp.database) {
      return this.staminaSessions();
    }

    let query: string = `SELECT ss.id, ss.label, ss.createdAt, ss.realTime, ss.realDifficulty, ss.realKilometers, ss.predictedTime,
      ss.predictedDifficulty, ss.predictedKilometers, ss.predictedWarmupTime, ss.predictedWarmupKilometers,
      ss.realWarmupTime, ss.realWarmupKilometers, ss.date, ss.weatherCondition,
      ss.staminaTrainingId, ss.programId, ss.sportId, ss.sportTypeId, ss.realised
      FROM StaminaSession ss`;
    const {query: queryWithParams, parameters: params} = this.addParameters(query, sport, firstDate, lastDate);
    const orderedQuery = `${queryWithParams} ORDER BY ss.date ASC, ss.id ASC`;

    const result: SQLResult<StaminaSessionRow> = (await this.databaseApp.database
      .query(orderedQuery, params)).values as SQLResult<StaminaSessionRow>;

    return this.mapRowsToSessions(result ?? []);
  }

  public async fetchStaminaSessionById(id: number): Promise<StaminaSession | null> {
    if (!this.databaseApp.database) {
      return this.staminaSession();
    }

    const result: SQLResult<StaminaSessionRow> = (await this.databaseApp.database.query(
      `SELECT id, label, createdAt, realTime, realDifficulty, realKilometers, predictedTime, predictedDifficulty,
       predictedKilometers, predictedWarmupTime, predictedWarmupKilometers, realWarmupTime, realWarmupKilometers, date, weatherCondition, staminaTrainingId, programId, sportId,
       sportTypeId, realised FROM StaminaSession WHERE id = ?;`,
      [id]
    )).values as SQLResult<StaminaSessionRow>;

    const row: StaminaSessionRow | undefined = result?.[0];
    if (!row) {
      this.staminaSession.set(null);
      return null;
    }

    const session: StaminaSession = await this.staminaSessionRowToModel(row);
    this.staminaSession.set(session);
    return session;
  }

  public async insertStaminaSession(staminaSessionForm: StaminaSessionForm): Promise<number | null> {
    const isConsistent: boolean = await this.validateSession(staminaSessionForm);
    if (!isConsistent) {
      return null;
    }

    const sql: string = `INSERT INTO StaminaSession(label, realTime, realDifficulty, realKilometers, predictedTime,
      predictedDifficulty, predictedKilometers, predictedWarmupTime, predictedWarmupKilometers, realWarmupTime, realWarmupKilometers, date, weatherCondition, staminaTrainingId,
      programId, sportId, sportTypeId, realised) values (${generatePlaceholders(18)});`;

    try {
      const newStaminaSessionId: number | undefined = (await this.databaseApp.database
        .run(sql, this.mapFormToParameters(staminaSessionForm)))?.changes?.lastId;

      return newStaminaSessionId ?? -1;
    } catch (_) {
      this.toastService.showError("Il y a eu une erreur lors de la creation de la seance");
      return null;
    }
  }

  public async updateStaminaSession(id: number, staminaSessionForm: StaminaSessionForm): Promise<boolean> {
    const isConsistent: boolean = await this.validateSession(staminaSessionForm);
    if (!isConsistent) {
      await this.toastService.showError("Il y a eu une erreur lors de la modification de la seance");
      return false;
    }

    const sql: string = `UPDATE StaminaSession
      SET label = ?, realTime = ?, realDifficulty = ?, realKilometers = ?, predictedTime = ?,
          predictedDifficulty = ?, predictedKilometers = ?, predictedWarmupTime = ?, predictedWarmupKilometers = ?, realWarmupTime = ?, realWarmupKilometers = ?, date = ?, weatherCondition = ?,
          staminaTrainingId = ?, programId = ?, sportId = ?, sportTypeId = ?, realised = ?
      WHERE id = ?;`;

    try {
      await this.databaseApp.database.run(sql, [
        ...this.mapFormToParameters(staminaSessionForm),
        id
      ]);
      return true;
    } catch (_) {
      this.toastService.showError("Il y a eu une erreur lors de la modification de la seance");
      return false;
    }
  }

  public async deleteUnfinishedSessionsByTrainingId(trainingId: number): Promise<void> {
    await this.databaseApp.database.run(
      'DELETE FROM StaminaSession WHERE staminaTrainingId = ? AND realised = 0;',
      [trainingId]
    );
  }

  public async fetchSessionDatesByTrainingId(trainingId: number): Promise<string[]> {
    const result = (await this.databaseApp.database.query(
      'SELECT date FROM StaminaSession WHERE staminaTrainingId = ?;',
      [trainingId]
    )).values as Array<{date: string}> | undefined;

    return (result ?? []).map((row) => row.date);
  }

  private addParameters(
    query: string,
    sport: Sport | null = null,
    firstDate: string | null = null,
    lastDate: string | null = null
  ): SQLParameters {
    const conditions: string[] = [];
    const parameters: SQLParameterValue[] = [];

    if (sport) {
      conditions.push('ss.sportId = ?');
      parameters.push(sport.id);
    }

    if (firstDate) {
      conditions.push('ss.date >= ?');
      parameters.push(firstDate);
    }

    if (lastDate) {
      conditions.push('ss.date <= ?');
      parameters.push(lastDate);
    }

    if (conditions.length > 0) {
      return {
        parameters,
        query: `${query} WHERE ${conditions.join(' AND ')}`
      };
    }

    return {parameters, query};
  }

  private async staminaSessionRowToModel(staminaSessionRow: StaminaSessionRow): Promise<StaminaSession> {
    return {
      ...staminaSessionRow,
      realised: Boolean(staminaSessionRow.realised),
      sport: staminaSessionRow.sportId ? await this.sportService.getSportById(staminaSessionRow.sportId) ?? null : null,
      sportType: staminaSessionRow.sportTypeId ? await this.sportTypeService.getSportTypeById(staminaSessionRow.sportTypeId) ?? null : null,
      staminaTraining: staminaSessionRow.staminaTrainingId ? await this.staminaTrainingService.fetchStaminaTrainingById(staminaSessionRow.staminaTrainingId) : null,
      program: staminaSessionRow.programId ? await this.programService.getProgramById(staminaSessionRow.programId) ?? null : null
    };
  }

  private async mapRowsToSessions(staminaSessionRows: StaminaSessionRows): Promise<StaminaSessions> {
    return Promise.all(staminaSessionRows.map((staminaSessionRow) => this.staminaSessionRowToModel(staminaSessionRow)));
  }

  private mapFormToParameters(staminaSessionForm: StaminaSessionForm): SQLParameterValue[] {
    const realised = Boolean(staminaSessionForm.realised);
    const normalizedRealTime = realised ? (staminaSessionForm.realTime ?? 0) : 0;
    const normalizedRealDifficulty = realised ? (staminaSessionForm.realDifficulty ?? 0) : 0;
    const normalizedRealKilometers = realised ? (staminaSessionForm.realKilometers ?? 0) : 0;
    const normalizedPredictedTime = realised
      ? (staminaSessionForm.predictedTime ?? null)
      : (staminaSessionForm.realTime ?? null);
    const normalizedPredictedDifficulty = realised
      ? (staminaSessionForm.predictedDifficulty ?? null)
      : (staminaSessionForm.realDifficulty ?? null);
    const normalizedPredictedKilometers = realised
      ? (staminaSessionForm.predictedKilometers ?? null)
      : (staminaSessionForm.realKilometers ?? null);
    const normalizedPredictedWarmupTime = realised
      ? (staminaSessionForm.predictedWarmupTime ?? 0)
      : (staminaSessionForm.realWarmupTime ?? 0);
    const normalizedPredictedWarmupKilometers = realised
      ? (staminaSessionForm.predictedWarmupKilometers ?? 0)
      : (staminaSessionForm.realWarmupKilometers ?? 0);
    const normalizedRealWarmupTime = realised ? (staminaSessionForm.realWarmupTime ?? 0) : 0;
    const normalizedRealWarmupKilometers = realised ? (staminaSessionForm.realWarmupKilometers ?? 0) : 0;

    return [
      staminaSessionForm.label?.trim() || null,
      normalizedRealTime,
      normalizedRealDifficulty,
      normalizedRealKilometers,
      normalizedPredictedTime,
      normalizedPredictedDifficulty,
      normalizedPredictedKilometers,
      normalizedPredictedWarmupTime,
      normalizedPredictedWarmupKilometers,
      normalizedRealWarmupTime,
      normalizedRealWarmupKilometers,
      staminaSessionForm.date,
      staminaSessionForm.weatherCondition ?? null,
      staminaSessionForm.staminaTraining ?? null,
      staminaSessionForm.program ?? null,
      staminaSessionForm.sport ?? null,
      staminaSessionForm.sportType ?? null,
      realised ? 1 : 0
    ];
  }

  private async validateSession(staminaSessionForm: StaminaSessionForm): Promise<boolean> {
    if (!staminaSessionForm.sport) {
      this.toastService.showError("Le sport de la seance est obligatoire");
      return false;
    }

    if (!staminaSessionForm.sportType) {
      this.toastService.showError("Le type de sport de la seance est obligatoire");
      return false;
    }

    const sessionDate = staminaSessionForm.date.split('T')[0];
    const now = new Date();
    const today = `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, '0')}-${`${now.getDate()}`.padStart(2, '0')}`;
    if (staminaSessionForm.realised && sessionDate > today) {
      this.toastService.showError("Une seance future ne peut pas etre terminee");
      return false;
    }

    const sportType: SportType | undefined = await this.sportTypeService.getSportTypeById(staminaSessionForm.sportType);
    if (!sportType || sportType.sport.id !== staminaSessionForm.sport) {
      this.toastService.showError("Le type de sport ne correspond pas au sport selectionne");
      return false;
    }

    if (!staminaSessionForm.staminaTraining) {
      return true;
    }

    const training = await this.staminaTrainingService.fetchStaminaTrainingById(staminaSessionForm.staminaTraining);
    if (!training) {
      this.toastService.showError("L'entrainement selectionne est introuvable");
      return false;
    }

    if (training.sport.id !== staminaSessionForm.sport) {
      this.toastService.showError("Le sport de la seance doit correspondre a celui de l'entrainement");
      return false;
    }

    if ((training.sportType?.id ?? null) !== (staminaSessionForm.sportType ?? null)) {
      this.toastService.showError("Le type de sport de la seance doit correspondre a celui de l'entrainement");
      return false;
    }

    return true;
  }
}
