import {inject, Injectable, signal, WritableSignal} from '@angular/core';
import {Changes} from "@capacitor-community/sqlite";
import {Program, ProgramForm, ProgramRow, Programs} from "../../../../models/Program";
import {SQLParameterValue} from "../../../../models/sql/SQLParameters";
import {SQLResult} from "../../../../models/sql/SQLResult";
import {generatePlaceholders} from "../../../../utils/database/generatePlaceholders";
import {DatabaseAppService} from "../../database-app.service";
import {ToastService} from "../../../components/toast.service";

@Injectable({
  providedIn: 'root'
})
export class ProgramService {
  private databaseApp: DatabaseAppService = inject(DatabaseAppService);
  private hasFetchedList: boolean = false;
  private toastService: ToastService = inject(ToastService);

  public programs: WritableSignal<Programs> = signal([]);

  public async fetchPrograms(includeArchived = true): Promise<Programs> {
    if (!this.hasFetchedList || includeArchived) {
      this.programs.set(await this.getPrograms(includeArchived));
      if (includeArchived) {
        this.hasFetchedList = true;
      }
    }

    return this.programs();
  }

  public async getPrograms(includeArchived = true): Promise<Programs> {
    const query: string = includeArchived
      ? 'SELECT id, name, description, startDate, endDate, isArchived FROM Program ORDER BY isArchived ASC, startDate DESC, id DESC;'
      : 'SELECT id, name, description, startDate, endDate, isArchived FROM Program WHERE isArchived = 0 ORDER BY startDate DESC, id DESC;';

    const result: SQLResult<ProgramRow> = (await this.databaseApp.database.query(query)).values as SQLResult<ProgramRow>;
    return (result ?? []).map((program) => this.mapRowToProgram(program));
  }

  public async getProgramById(id: number | null | undefined): Promise<Program | undefined> {
    if (!id) {
      return undefined;
    }

    const result: SQLResult<ProgramRow> = (await this.databaseApp.database.query(
      'SELECT id, name, description, startDate, endDate, isArchived FROM Program WHERE id = ?;',
      [id]
    )).values as SQLResult<ProgramRow>;

    const row: ProgramRow | undefined = result?.[0];
    return row ? this.mapRowToProgram(row) : undefined;
  }

  public async insertProgram(programForm: ProgramForm): Promise<number | undefined> {
    const sql: string = `INSERT INTO Program(name, description, startDate, endDate, isArchived)
      VALUES (${generatePlaceholders(5)});`;

    const result: Changes | undefined = (await this.databaseApp.database
      .run(sql, this.mapFormToParameters(programForm))).changes;

    const programId: number | undefined = result?.lastId;
    if (programId) {
      await this.saveProgramTrainings(programId, programForm.trainingIds ?? []);
    }

    this.hasFetchedList = false;
    return programId;
  }

  public async updateProgram(id: number, programForm: ProgramForm): Promise<boolean> {
    const sql: string = `UPDATE Program
      SET name = ?, description = ?, startDate = ?, endDate = ?, isArchived = ?
      WHERE id = ?;`;

    try{
      await this.databaseApp.database.run(sql, [
        ...this.mapFormToParameters(programForm),
        id
      ]);
    }catch (_){
      this.toastService.showError("Une erreur est survenue lors de la mise à jour du programme.");
      return false;
    }

    try{
      await this.saveProgramTrainings(id, programForm.trainingIds ?? []);
    }catch (_){
      this.toastService.showError("Une erreur est survenue lors de l'association des entraînements au programme.");
      return false;
    }

    this.hasFetchedList = false;
    return true;
  }

  private mapRowToProgram(row: ProgramRow): Program {
    return {
      ...row,
      isArchived: Boolean(row.isArchived)
    };
  }

  private mapFormToParameters(programForm: ProgramForm): SQLParameterValue[] {
    return [
      programForm.name.trim(),
      programForm.description?.trim() || null,
      programForm.startDate ?? null,
      programForm.endDate ?? null,
      programForm.isArchived ? 1 : 0
    ];
  }

  private async saveProgramTrainings(programId: number, trainingIds: number[]): Promise<void> {
    await this.databaseApp.database.run('UPDATE StaminaTraining SET programId = NULL WHERE programId = ?;', [programId]);

    if (!trainingIds.length) {
      return;
    }

    await this.databaseApp.database.run(
      `UPDATE StaminaTraining SET programId = ? WHERE id IN (${generatePlaceholders(trainingIds.length)});`,
      [programId, ...trainingIds]
    );
  }
}
