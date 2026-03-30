import {Component, inject, WritableSignal} from '@angular/core';
import {IonicModule} from '@ionic/angular';
import {addIcons} from "ionicons";
import {cloudDownloadOutline, personCircleOutline, syncOutline} from "ionicons/icons";
import {StravaSyncService} from "../../services/integrations/strava/strava-sync.service";

@Component({
  selector: 'app-custom-header',
  templateUrl: './custom-header.component.html',
  styleUrls: ['./custom-header.component.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class CustomHeaderComponent {
  private readonly stravaSyncService: StravaSyncService = inject(StravaSyncService);

  protected isProfileMenuOpen: boolean = false;
  protected readonly isSyncing: WritableSignal<boolean> = this.stravaSyncService.isSyncing;

  constructor() {
    addIcons({personCircleOutline, cloudDownloadOutline, syncOutline});
  }

  protected toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  protected closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }

  protected async syncStrava(): Promise<void> {
    this.closeProfileMenu();
    await this.stravaSyncService.syncActivities();
  }
}
