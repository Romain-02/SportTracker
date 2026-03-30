import {inject, Injectable} from '@angular/core';
import {SqliteService} from "./sqlite.service";
import {ToastController} from "@ionic/angular";
import {DatabaseAppService} from "./database-app.service";

const DB_NAME: string = 'sport-tracker-db';

@Injectable({
  providedIn: 'root'
})
export class InitializeAppService {
  private sqliteService: SqliteService = inject(SqliteService)
  private toastCtrl: ToastController = inject(ToastController)
  private databaseAppService: DatabaseAppService = inject(DatabaseAppService)

  isAppInit: boolean = false;
  platform!: string;

  constructor() { }


  async initializeApp() {
    this.sqliteService.initializePlugin();
    this.platform = this.sqliteService.platform;

    try {
      if( this.sqliteService.platform === 'web') {
        await this.sqliteService.initWebStore();
      }
      await this.databaseAppService.initializeDatabase(DB_NAME);
      if( this.sqliteService.platform === 'web') {
        await this.sqliteService.saveToStore(DB_NAME);
      }

      this.isAppInit = true;
      console.log(`initializeApp: ${this.platform} is initialized with ${DB_NAME} database`);
    } catch(error) {
      console.log(`initializeAppError: ${error}`)
      const toast = await this.toastCtrl.create({
        message: `initializeAppError: ${error}`,
        duration: 10000
      });
      await toast.present();
    }
  }
}
