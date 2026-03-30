import {Component, OnInit} from '@angular/core';
import {IonApp, IonRouterOutlet} from '@ionic/angular/standalone';
import {registerLocaleData} from "@angular/common";
import localeFr from '@angular/common/locales/fr';
import {UpdateService} from "./services/versions/update-version.service";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
  standalone: true
})
export class AppComponent implements OnInit{

  constructor(private updateService: UpdateService) {
    registerLocaleData(localeFr, 'fr');
  }

  async ngOnInit() {
    await this.updateService.checkForUpdates();
  }
}
