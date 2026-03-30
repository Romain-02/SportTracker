import {Component, EventEmitter, Input, Output} from '@angular/core';
import {IonicModule} from "@ionic/angular";
import {addIcons} from "ionicons";
import {barbellOutline, calendarOutline, flashOutline} from "ionicons/icons";
import {StaminaTraining} from "../../../models/StaminaTraining";
import {SportPipe} from "../../../pipes/sport.pipe";

@Component({
  selector: 'app-training-card',
  templateUrl: './training-card.component.html',
  styleUrls: ['./training-card.component.scss'],
    imports: [
        IonicModule,
        SportPipe
    ],
  standalone: true
})
export class TrainingCardComponent {
  @Input({required: true})
  public training!: StaminaTraining;

  @Input({required: true})
  public summary: string = '';

  @Output()
  public editTraining = new EventEmitter<number>();

  constructor() {
    addIcons({barbellOutline, flashOutline, calendarOutline});
  }
}
