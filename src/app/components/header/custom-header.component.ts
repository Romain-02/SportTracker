import {Component, inject, WritableSignal} from '@angular/core';
import {IonicModule} from '@ionic/angular';
import {addIcons} from "ionicons";
import {cloudDownloadOutline, moonOutline, personCircleOutline, sunnyOutline, syncOutline} from "ionicons/icons";
import {StravaSyncService} from "../../services/integrations/strava/strava-sync.service";
import {ThemeService} from "../../services/theme.service";

@Component({
  selector: 'app-custom-header',
  templateUrl: './custom-header.component.html',
  styleUrls: ['./custom-header.component.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class CustomHeaderComponent {
  private readonly stravaSyncService: StravaSyncService = inject(StravaSyncService);
  private readonly themeService: ThemeService = inject(ThemeService);

  protected isProfileMenuOpen: boolean = false;
  protected readonly isSyncing: WritableSignal<boolean> = this.stravaSyncService.isSyncing;
  protected readonly isDark = this.themeService.isDark;

  constructor() {
    addIcons({personCircleOutline, cloudDownloadOutline, syncOutline, moonOutline, sunnyOutline});
  }

  protected toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  protected closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  protected get themeIcon(): string {
    return this.isDark() ? 'sunny-outline' : 'moon-outline';
  }

  protected get themeLabel(): string {
    return this.isDark() ? 'Passer en mode clair' : 'Passer en mode sombre';
  }

  protected async syncStrava(): Promise<void> {
    this.closeProfileMenu();
    await this.stravaSyncService.syncActivities();
  }
}
