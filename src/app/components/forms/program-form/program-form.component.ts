import {Component, inject, Input, OnInit, WritableSignal} from '@angular/core';
import {FormGroup, ReactiveFormsModule} from "@angular/forms";
import {IonicModule} from "@ionic/angular";
import {StaminaTrainings} from "../../../models/StaminaTraining";
import {StaminaTrainingService} from "../../../services/database/entities/staminaTraining/stamina-training.service";

@Component({
  selector: 'app-program-form',
  templateUrl: './program-form.component.html',
  styleUrls: ['./program-form.component.scss'],
  imports: [
    IonicModule,
    ReactiveFormsModule
  ],
  standalone: true
})
export class ProgramFormComponent implements OnInit {
  private trainingService = inject(StaminaTrainingService);

  @Input({required: true})
  public programForm!: FormGroup;

  protected trainings: WritableSignal<StaminaTrainings> = this.trainingService.staminaTrainings;

  ngOnInit(): void {
    this.trainingService.fetchStaminaTrainings();
  }
}
