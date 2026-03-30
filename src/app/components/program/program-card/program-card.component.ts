import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Program} from "../../../models/Program";
import {StaminaTrainings} from "../../../models/StaminaTraining";
import {SportPipe} from "../../../pipes/sport.pipe";
import {DatePipe} from "@angular/common";
import {IonicModule} from "@ionic/angular";
import {calendarNumberOutline} from "ionicons/icons";
import {addIcons} from "ionicons";

@Component({
  selector: 'app-program-card',
  templateUrl: './program-card.component.html',
  styleUrls: ['./program-card.component.scss'],
  standalone: true,
  imports: [
    SportPipe,
    DatePipe,
    IonicModule
  ],
})
export class ProgramCardComponent {
  @Input({required: true})
  public program!: Program;

  @Input()
  public linkedTrainings: StaminaTrainings = [];

  @Output()
  public editProgram: EventEmitter<number> = new EventEmitter<number>();

  protected get uniqueSports(): string[] {
    return [...new Set(this.linkedTrainings.map((training) => training.sport.name).filter(Boolean))];
  }

  constructor() {
    addIcons({calendarNumberOutline});
  }
}
