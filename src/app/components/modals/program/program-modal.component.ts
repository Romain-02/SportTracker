import {Component, inject, Input, OnInit} from '@angular/core';
import {FormGroup, ReactiveFormsModule} from "@angular/forms";
import {ModalController} from "@ionic/angular";
import {IonButton, IonButtons, IonContent, IonFooter, IonHeader, IonTitle, IonToolbar} from "@ionic/angular/standalone";
import {Program, ProgramForm} from "../../../models/Program";
import {ProgramService} from "../../../services/database/entities/program/program.service";
import {ProgramFormService} from "../../../services/form/program/program-form.service";
import {StaminaTrainingService} from "../../../services/database/entities/staminaTraining/stamina-training.service";
import {ProgramFormComponent} from "../../forms/program-form/program-form.component";

@Component({
  selector: 'app-program-modal',
  templateUrl: './program-modal.component.html',
  styleUrls: ['./program-modal.component.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonFooter,
    ReactiveFormsModule,
    ProgramFormComponent
  ],
  standalone: true
})
export class ProgramModalComponent implements OnInit {
  @Input()
  public programId?: number;

  private programService: ProgramService = inject(ProgramService);
  private programFormService: ProgramFormService = inject(ProgramFormService);
  private trainingService: StaminaTrainingService = inject(StaminaTrainingService);
  private modalCtrl: ModalController = inject(ModalController);

  public programForm: FormGroup = this.programFormService.createForm();

  get isEditMode(): boolean {
    return !!this.programId;
  }

  async ngOnInit(): Promise<void> {
    await this.trainingService.fetchStaminaTrainings();

    if (!this.programId) {
      return;
    }

    const program: Program | undefined = await this.programService.getProgramById(this.programId);
    if (!program) {
      return;
    }

    const trainingIds: number[] = this.trainingService.staminaTrainings()
      .filter((training) => training.program?.id === program.id)
      .map((training) => training.id);

    this.programForm.patchValue({
      name: program.name,
      description: program.description ?? '',
      startDate: program.startDate ?? null,
      endDate: program.endDate ?? null,
      isArchived: program.isArchived,
      trainingIds
    });
  }

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  async confirm(): Promise<void> {
    if (this.programForm.invalid) {
      this.programForm.markAllAsTouched();
      return;
    }

    const body: ProgramForm = this.programForm.value;

    const result = this.programId
      ? await this.programService.updateProgram(this.programId, body)
      : await this.programService.insertProgram(body);

    if (!result) {
      return;
    }

    await this.modalCtrl.dismiss(result, 'confirm');
  }
}
