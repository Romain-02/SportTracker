import {Component, inject, OnInit} from '@angular/core';
import {IonApp, IonRouterOutlet} from '@ionic/angular/standalone';
import {registerLocaleData} from "@angular/common";
import localeFr from '@angular/common/locales/fr';
import {Capacitor} from "@capacitor/core";
import {UpdateService} from "./services/versions/update-version.service";
import {StatusBar} from "@capacitor/status-bar";
import {ThemeService} from "./services/theme.service";
import {CapacitorUpdater} from "@capgo/capacitor-updater";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
  standalone: true
})
export class AppComponent implements OnInit{

  private readonly updateService: UpdateService = inject(UpdateService);
  private readonly themeService: ThemeService = inject(ThemeService);

  constructor() {
    registerLocaleData(localeFr, 'fr');
  }

  ngOnInit() {
    if (Capacitor.getPlatform() !== 'web') {
      void StatusBar.show();
      void this.themeService.syncSystemBars();
      void CapacitorUpdater.notifyAppReady();
    }
    void this.updateService.checkForUpdates();
  }
}
