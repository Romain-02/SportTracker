import {inject, Injectable} from '@angular/core';
import {SqliteService} from "./sqlite.service";
import {UpgradeStatements} from "../../utils/database/creationStatements";
import {SQLiteDBConnection} from "@capacitor-community/sqlite";

@Injectable({
  providedIn: 'root'
})
export class DatabaseAppService {
  private sqliteService: SqliteService = inject(SqliteService)

  private databaseName: string = "";
  private upgradeStmts: UpgradeStatements = new UpgradeStatements();
  private readonly versionUpgrades;
  private readonly loadToVersion;
  public database!: SQLiteDBConnection;

  platform!: string;

  constructor() {
    this.versionUpgrades = this.upgradeStmts.upgrades;
    this.loadToVersion = this.versionUpgrades[this.versionUpgrades.length - 1].toVersion;
  }


  async initializeDatabase(dbName: string) {
    this.databaseName = dbName;

    await this.sqliteService.addUpgradeStatement({
      database: this.databaseName,
      upgrade: this.versionUpgrades
    });

    this.database = await this.sqliteService.openDatabase(
      this.databaseName,
      false,
      'no-encryption',
      this.loadToVersion,
      false
    );
    console.log(await this.database.getVersion(), "hey", this.loadToVersion);
    await this.afficheTables();
  }

  async afficheTables() {
    try {
      const res = await this.database.query("SELECT name FROM sqlite_schema WHERE type ='table'");
      console.log("Tables trouvées :", res);
    } catch (err) {
      console.error("Erreur lors de la récupération des tables :", err);
    }
  }

}
