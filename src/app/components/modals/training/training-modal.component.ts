import {Component, inject, Input, OnInit} from '@angular/core';
import {FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {ModalController} from "@ionic/angular";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonTitle,
  IonToolbar
} from "@ionic/angular/standalone";
import {StaminaTraining, StaminaTrainingForm} from "../../../models/StaminaTraining";
import {ToastService} from "../../../services/components/toast.service";
import {StaminaTrainingService} from "../../../services/database/entities/staminaTraining/stamina-training.service";
import {StaminaTrainingFormService} from "../../../services/form/staminaTraining/stamina-training-form.service";
import {StaminaTrainingFormComponent} from "../../forms/stamina-training-form/stamina-training-form.component";

@Component({
  selector: 'app-training-modal',
  templateUrl: './training-modal.component.html',
  styleUrls: ['./training-modal.component.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    ReactiveFormsModule,
    StaminaTrainingFormComponent,
    IonItem,
    IonInput,
    FormsModule
  ],
  standalone: true
})
export class TrainingModalComponent implements OnInit {
  @Input()
  public trainingId?: number;

  private modalCtrl: ModalController = inject(ModalController);
  private staminaTrainingFormService: StaminaTrainingFormService = inject(StaminaTrainingFormService);
  private staminaTrainingService: StaminaTrainingService = inject(StaminaTrainingService);
  private toastService: ToastService = inject(ToastService);

  public trainingForm: FormGroup = this.staminaTrainingFormService.createForm();
  public generationUntil: string = '';

  get isEditMode(): boolean {
    return !!this.trainingId;
  }

  async ngOnInit(): Promise<void> {
    if (!this.trainingId) {
      return;
    }

    const training: StaminaTraining | null = await this.staminaTrainingService.fetchStaminaTrainingById(this.trainingId);
    if (!training) {
      return;
    }

    this.trainingForm.patchValue({
      name: training.name ?? '',
      predictedTime: training.predictedTime ?? 0,
      predictedDifficulty: training.predictedDifficulty ?? 0,
      predictedKilometers: training.predictedKilometers ?? 0,
      predictedWarmupTime: training.predictedWarmupTime ?? 0,
      predictedWarmupKilometers: training.predictedWarmupKilometers ?? 0,
      isActive: training.isActive,
      sport: training.sport.id,
      sportType: training.sportType?.id ?? null,
      program: training.program?.id ?? null,
      recurrenceDays: training.recurrenceDays,
      recurrenceFrequency: training.recurrenceFrequency ?? null
    });
  }

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  async confirm(generateSessions: boolean = false): Promise<void> {
    if (this.trainingForm.invalid) {
      this.trainingForm.markAllAsTouched();

      const firstErrorKey: string = Object.keys(this.trainingForm.errors ?? {})[0];
      const firstError = this.trainingForm.errors ? this.trainingForm.errors[firstErrorKey] : null;
      const errorMessage: string = firstError || 'Formulaire invalide';
      await this.toastService.showError(errorMessage)
      return;
    }

    const trainingBody: StaminaTrainingForm = {
      ...this.trainingForm.value
    };

    const trainingId = this.trainingId
      ? await this.saveExistingTraining(trainingBody)
      : await this.staminaTrainingService.insertStaminaTraining(trainingBody);

    if (!trainingId) {
      return;
    }

    if (generateSessions) {
      const createdCount: number = await this.staminaTrainingService.generateSessionsFromTraining(trainingId, this.generationUntil || null);
      if (createdCount > 0) {
        this.toastService.showSuccess(`${createdCount} seances generees`);
      }
    }

    await this.modalCtrl.dismiss(trainingId, 'confirm');
  }

  private async saveExistingTraining(trainingBody: StaminaTrainingForm): Promise<number | null> {
    if (!this.trainingId) {
      return null;
    }

    const updated: boolean = await this.staminaTrainingService.updateStaminaTraining(this.trainingId, trainingBody);
    return updated ? this.trainingId : null;
  }
}
