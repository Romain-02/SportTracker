import {inject, Injectable, signal, WritableSignal} from '@angular/core';
import {DatabaseAppService} from "../../database-app.service";
import {Sport, Sports} from "../../../../models/Sport";
import {SQLResult} from "../../../../models/sql/SQLResult";

@Injectable({
  providedIn: 'root'
})
export class SportService {
  private databaseApp: DatabaseAppService = inject(DatabaseAppService);

  public sports: WritableSignal<Sports> = signal([]);
  public sport: WritableSignal<Sport | null> = signal(null);

  private hasFetchedList = false;

  public async fetchSports(): Promise<Sports> {
    if (!this.hasFetchedList) {
      console.log(`RÃ©cupÃ©ration des sports`);
      const result: SQLResult<Sport> = (await this.databaseApp.database
        .query('SELECT id, name, logo FROM Sport;')).values as SQLResult<Sport>;

      this.sports.set(result ?? []);
      this.hasFetchedList = true;
    }

    return this.sports();
  }

  public async fetchSportById(id: number): Promise<Sport | undefined> {
    const sport = await this.getSportById(id);

    if (sport) {
      this.sport.set(sport);
    }

    return sport;
  }

  public async getSportById(id: number): Promise<Sport | undefined> {
    console.log(`RÃ©cupÃ©ration du sport`);
    const result: SQLResult<Sport> = (await this.databaseApp.database
      .query('SELECT id, name, logo FROM Sport WHERE id = ?;', [id])).values as SQLResult<Sport>;

    return result?.[0];
  }
}
