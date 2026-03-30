import {Component, inject, Input, OnInit, WritableSignal} from '@angular/core';
import {IonicModule} from "@ionic/angular";
import {FormGroup, ReactiveFormsModule} from "@angular/forms";
import {WeatherCondition} from "../../../models/enums/WeatherCondition";
import {ProgramService} from "../../../services/database/entities/program/program.service";
import {Programs} from "../../../models/Program";
import {StaminaTrainingService} from "../../../services/database/entities/staminaTraining/stamina-training.service";
import {StaminaTraining, StaminaTrainings} from "../../../models/StaminaTraining";
import {SportSelectsComponent} from "../sport-selects/sport-selects.component";

@Component({
  selector: 'app-stamina-session-form',
  templateUrl: './stamina-session-form.component.html',
  styleUrls: ['./stamina-session-form.component.scss'],
  imports: [
    IonicModule,
    ReactiveFormsModule,
    SportSelectsComponent
  ],
  standalone: true
})
export class StaminaSessionFormComponent implements OnInit{
  private programService: ProgramService = inject(ProgramService);
  private staminaTrainingService: StaminaTrainingService = inject(StaminaTrainingService);

  protected programs: WritableSignal<Programs> = this.programService.programs;
  protected savedTrainings: WritableSignal<StaminaTrainings> = this.staminaTrainingService.staminaTrainings;

  @Input({required: true})
  public staminaSessionForm!: FormGroup;

  protected readonly Object: ObjectConstructor = Object;
  protected readonly WeatherCondition = WeatherCondition;

  protected get selectedDate(): string {
    return this.staminaSessionForm.get('date')?.value ?? '';
  }

  ngOnInit(): void {
    this.programService.fetchPrograms();
    this.staminaTrainingService.fetchStaminaTrainings().then((trainings) => {
      this.savedTrainings.set(trainings);
    });
  }

  protected async onTrainingSelected(trainingId: number | null): Promise<void> {
    if (!trainingId) {
      return;
    }

    const training: StaminaTraining | null = await this.staminaTrainingService.fetchStaminaTrainingById(trainingId);
    if (!training) {
      return;
    }

    this.staminaSessionForm.patchValue({
      staminaTraining: training.id,
      realTime: training.predictedTime ?? 0,
      realDifficulty: training.predictedDifficulty ?? 0,
      realKilometers: training.predictedKilometers ?? 0,
      predictedTime: training.predictedTime,
      predictedDifficulty: training.predictedDifficulty,
      predictedKilometers: training.predictedKilometers,
      realWarmupTime: training.predictedWarmupTime ?? 0,
      realWarmupKilometers: training.predictedWarmupKilometers ?? 0,
      predictedWarmupTime: training.predictedWarmupTime ?? 0,
      predictedWarmupKilometers: training.predictedWarmupKilometers ?? 0,
      sport: training.sport.id,
      sportType: training.sportType?.id ?? null,
      program: training.program?.id ?? null
    });
  }

  protected onSessionDateChange(value: string[] | string | null | undefined): void {
    if (!value || typeof value === 'object' || value.split('T').length === 0) {
      return;
    }

    this.staminaSessionForm.patchValue({
      date: value.split('T')[0]
    });
    this.staminaSessionForm.get('date')?.markAsDirty();
    this.staminaSessionForm.get('date')?.updateValueAndValidity();
  }
}
