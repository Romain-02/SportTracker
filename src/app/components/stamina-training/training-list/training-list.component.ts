import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {TrainingCardComponent} from "../training-card/training-card.component";
import {IonicModule} from "@ionic/angular";
import {StaminaTraining, StaminaTrainings} from "../../../models/StaminaTraining";
import {StaminaTrainingService} from "../../../services/database/entities/staminaTraining/stamina-training.service";

@Component({
  selector: 'app-training-list',
  templateUrl: './training-list.component.html',
  styleUrls: ['./training-list.component.scss'],
  imports: [
    TrainingCardComponent,
    IonicModule
  ],
  standalone: true
})
export class TrainingListComponent {

  private readonly staminaTrainingService: StaminaTrainingService = inject(StaminaTrainingService);

  @Input()
  public trainings!: StaminaTrainings;

  @Output()
  public editTraining: EventEmitter<number> = new EventEmitter<number>();

  protected trainingSummary(training: StaminaTraining): string {
    return this.staminaTrainingService.getRecurrenceSummary(training);
  }

}
