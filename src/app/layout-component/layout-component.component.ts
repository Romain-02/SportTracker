import { Component, OnInit } from '@angular/core';
import {IonApp, IonContent, IonHeader} from '@ionic/angular/standalone';
import {CustomHeaderComponent} from "../components/header/custom-header.component";
import {RouterOutlet} from "@angular/router";

@Component({
  selector: 'app-layout-component',
  templateUrl: './layout-component.component.html',
  styleUrls: ['./layout-component.component.scss'],
  imports: [
    IonContent,
    CustomHeaderComponent,
    IonHeader,
    RouterOutlet,
    IonApp
  ],
  standalone: true
})
export class LayoutComponentComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
