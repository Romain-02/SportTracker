import {inject, Injectable, signal, WritableSignal} from '@angular/core';
import {DatabaseAppService} from "../../database-app.service";
import {DEFAULT_SPORT} from "../../../../models/Sport";
import {SportType, SportTypes, SportTypeWithId} from "../../../../models/SportType";
import {SQLResult} from "../../../../models/sql/SQLResult";
import {SportService} from "../sports/sport.service";

@Injectable({
  providedIn: 'root'
})
export class SportTypeService {
  private databaseApp: DatabaseAppService = inject(DatabaseAppService);
  private sportService: SportService = inject(SportService);

  public sportTypes: WritableSignal<SportTypes> = signal([]);
  public filteredSportTypes: WritableSignal<SportTypes> = signal([]);

  private hasFetchedList = false;

  public async fetchSportTypes(): Promise<SportTypes> {
    if (!this.hasFetchedList) {
      console.log(`RÃ©cupÃ©ration des types de sports`);
      const result: SQLResult<SportTypeWithId> = (await this.databaseApp.database
        .query('SELECT id, name, sportId FROM SportType;')).values as SQLResult<SportTypeWithId>;

      const sportTypes = await this.mapRowsToSportTypes(result ?? []);
      this.sportTypes.set(sportTypes);
      this.hasFetchedList = true;
    }

    return this.sportTypes();
  }

  public async fetchFilteredSportTypes(sportId: number | undefined): Promise<SportTypes> {
    if (!sportId) {
      const sportTypes = await this.fetchSportTypes();
      this.filteredSportTypes.set(sportTypes);
      return sportTypes;
    }

    console.log(`RÃ©cupÃ©ration des types d'un sport`);
    const result: SQLResult<SportTypeWithId> = (await this.databaseApp.database
      .query('SELECT id, name, sportId FROM SportType WHERE sportId = ?;', [sportId])).values as SQLResult<SportTypeWithId>;

    const sportTypes = await this.mapRowsToSportTypes(result ?? []);
    this.filteredSportTypes.set(sportTypes);
    return sportTypes;
  }

  public async getSportTypeById(id: number): Promise<SportType | undefined> {
    console.log(`RÃ©cupÃ©ration du type d'un sport`);
    const result: SQLResult<SportTypeWithId> = (await this.databaseApp.database
      .query('SELECT id, name, sportId FROM SportType WHERE id = ?;', [id])).values as SQLResult<SportTypeWithId>;

    const row = result?.[0];
    if (!row) {
      return undefined;
    }

    return this.sportTypeWithIdToSportType(row);
  }

  public async sportTypeWithIdToSportType(sportTypeWithId: SportTypeWithId): Promise<SportType> {
    return {
      ...sportTypeWithId,
      sport: await this.sportService.getSportById(sportTypeWithId.sportId) ?? DEFAULT_SPORT
    };
  }

  private async mapRowsToSportTypes(rows: SportTypeWithId[]): Promise<SportTypes> {
    return Promise.all(rows.map((row) => this.sportTypeWithIdToSportType(row)));
  }
}
