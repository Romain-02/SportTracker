import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {CustomHeaderComponent} from '../components/header/custom-header.component';
import {IonApp, IonContent} from "@ionic/angular/standalone";

@Component({
  selector: 'app-layout-component',
  templateUrl: './layout-component.component.html',
  styleUrls: ['./layout-component.component.scss'],
  imports: [CustomHeaderComponent, RouterOutlet, IonContent, IonApp],
  standalone: true
})
export class LayoutComponentComponent {
}
