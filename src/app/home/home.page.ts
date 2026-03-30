import {Component} from '@angular/core';
import {
  IonTabs, IonTabButton, IonIcon, IonTabBar
} from '@ionic/angular/standalone';
import {FormsModule} from "@angular/forms";
import {addIcons} from "ionicons";
import {calendarOutline, podiumOutline, walkOutline} from "ionicons/icons";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [FormsModule, IonTabs, IonTabButton, IonIcon, IonTabBar],
  standalone: true
})
export class HomePage{
  constructor() {
    addIcons({podiumOutline, calendarOutline, walkOutline})
  }
}
