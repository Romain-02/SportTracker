import {Component, inject, Input, OnInit} from '@angular/core';
import {FormGroup, ReactiveFormsModule} from "@angular/forms";
import {ModalController} from "@ionic/angular";
import {IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar} from "@ionic/angular/standalone";
import {StaminaSessionForm} from "../../../models/StaminaSession";
import {StaminaSessionService} from "../../../services/database/entities/staminaSession/stamina-session.service";
import {StaminaSessionFormService} from "../../../services/form/staminaSession/stamina-session-form-service";
import {StaminaSessionFormComponent} from "../../forms/stamina-session-form/stamina-session-form.component";
import {ToastService} from "../../../services/components/toast.service";

@Component({
  selector: 'app-training-modal',
  templateUrl: './session-modal.component.html',
  styleUrls: ['./session-modal.component.scss'],
  imports: [
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonHeader,
    IonContent,
    ReactiveFormsModule,
    StaminaSessionFormComponent
  ],
  standalone: true
})
export class SessionModalComponent implements OnInit {
  @Input()
  public sessionId?: number;

  private modalCtrl: ModalController = inject(ModalController);
  private staminaSessionFormService: StaminaSessionFormService = inject(StaminaSessionFormService);
  private staminaSessionService: StaminaSessionService = inject(StaminaSessionService);
  private toastService: ToastService = inject(ToastService);

  public staminaSessionForm: FormGroup = this.staminaSessionFormService.createForm();

  get isEditMode(): boolean {
    return !!this.sessionId;
  }

  async ngOnInit(): Promise<void> {
    if (!this.sessionId) {
      return;
    }

    const session = await this.staminaSessionService.fetchStaminaSessionById(this.sessionId);
    if (!session) {
      return;
    }

    this.staminaSessionForm.patchValue({
      label: session.label ?? '',
      realTime: session.realised ? session.realTime : (session.predictedTime ?? 0),
      realDifficulty: session.realised ? session.realDifficulty : (session.predictedDifficulty ?? 0),
      realKilometers: session.realised ? session.realKilometers : (session.predictedKilometers ?? 0),
      predictedTime: session.predictedTime ?? 0,
      predictedDifficulty: session.predictedDifficulty ?? 0,
      predictedKilometers: session.predictedKilometers ?? 0,
      predictedWarmupTime: session.predictedWarmupTime,
      predictedWarmupKilometers: session.predictedWarmupKilometers,
      realWarmupTime: session.realised ? session.realWarmupTime : session.predictedWarmupTime,
      realWarmupKilometers: session.realised ? session.realWarmupKilometers : session.predictedWarmupKilometers,
      date: session.date,
      weatherCondition: session.weatherCondition ?? null,
      realised: session.realised,
      program: session.program?.id ?? null,
      staminaTraining: session.staminaTraining?.id ?? null,
      sport: session.sport?.id ?? null,
      sportType: session.sportType?.id ?? null
    });
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  async confirm() {
    if (this.staminaSessionForm.invalid) {
      this.staminaSessionForm.markAllAsTouched();

      const firstErrorKey: string = Object.keys(this.staminaSessionForm.errors ?? {})[0];
      const firstError = this.staminaSessionForm.errors ? this.staminaSessionForm.errors[firstErrorKey] : null;
      const errorMessage: string = firstError || 'Formulaire invalide';
      await this.toastService.showError(errorMessage);
      return;
    }

    const rawDate = this.staminaSessionForm.value.date;
    const staminaSessionBody: StaminaSessionForm = {
      ...this.staminaSessionForm.value,
      date: typeof rawDate === 'string' ? rawDate.split('T')[0] : rawDate
    };

    const result = this.sessionId
      ? await this.staminaSessionService.updateStaminaSession(this.sessionId, staminaSessionBody)
      : await this.staminaSessionService.insertStaminaSession(staminaSessionBody);

    if (!result) {
      return;
    }

    return this.modalCtrl.dismiss(result, 'confirm');
  }
}
