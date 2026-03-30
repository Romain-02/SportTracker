import {Component, inject, OnInit, WritableSignal} from '@angular/core';
import {IonicModule, ModalController} from "@ionic/angular";
import {addIcons} from "ionicons";
import {addOutline} from "ionicons/icons";
import {Program, Programs} from "../../models/Program";
import {StaminaTrainings} from "../../models/StaminaTraining";
import {ProgramService} from "../../services/database/entities/program/program.service";
import {StaminaTrainingService} from "../../services/database/entities/staminaTraining/stamina-training.service";
import {ProgramFiltersToolbarComponent} from "../../components/program/program-filters-toolbar/program-filters-toolbar.component";
import {ProgramCardComponent} from "../../components/program/program-card/program-card.component";
import {ProgramModalComponent} from "../../components/modals/program/program-modal.component";

@Component({
  selector: 'app-programs',
  templateUrl: './programs.component.html',
  styleUrls: ['./programs.component.scss'],
  imports: [
    IonicModule,
    ProgramFiltersToolbarComponent,
    ProgramCardComponent
  ],
  standalone: true
})
export class ProgramsComponent implements OnInit {
  private programService: ProgramService = inject(ProgramService);
  private trainingService: StaminaTrainingService = inject(StaminaTrainingService);
  private modalController: ModalController = inject(ModalController);

  protected programs: WritableSignal<Programs> = this.programService.programs;
  protected trainings: WritableSignal<StaminaTrainings> = this.trainingService.staminaTrainings;
  protected showArchived = false;
  private selectedFirstDate: string | null = null;
  private selectedSecondDate: string | null = null;

  constructor() {
    addIcons({addOutline});
  }

  ngOnInit(): void {
    this.refreshPrograms();
    this.trainingService.fetchStaminaTrainings();
  }

  protected filteredPrograms(): Programs {
    return this.programs().filter((program) => {
      const archiveMatch: boolean = this.showArchived || !program.isArchived;
      const startMatch: boolean = !this.selectedFirstDate || !program.startDate || program.startDate >= this.selectedFirstDate;
      const endMatch: boolean = !this.selectedSecondDate || !program.endDate || program.endDate <= this.selectedSecondDate;
      return archiveMatch && startMatch && endMatch;
    });
  }

  protected trainingsForProgram(program: Program): StaminaTrainings {
    return this.trainings().filter((training) => training.program?.id === program.id);
  }

  protected setFirstDate(newDate: string): void {
    this.selectedFirstDate = newDate ? newDate.split('T')[0] : null;
  }

  protected setSecondDate(newDate: string): void {
    this.selectedSecondDate = newDate ? newDate.split('T')[0] : null;
  }

  protected resetFilters(): void {
    this.showArchived = false;
    this.selectedFirstDate = null;
    this.selectedSecondDate = null;
  }

  protected async createProgram(): Promise<void> {
    const modal = await this.modalController.create({
      component: ProgramModalComponent
    });

    await modal.present();
    const {role} = await modal.onWillDismiss();

    if (role === 'confirm') {
      this.refreshPrograms();
      this.trainingService.fetchStaminaTrainings();
    }
  }

  protected async editProgram(programId: number): Promise<void> {
    const modal = await this.modalController.create({
      component: ProgramModalComponent,
      componentProps: {
        programId
      }
    });

    await modal.present();
    const {role} = await modal.onWillDismiss();

    if (role === 'confirm') {
      this.refreshPrograms();
      this.trainingService.fetchStaminaTrainings();
    }
  }

  private refreshPrograms(): void {
    this.programService.fetchPrograms(true);
  }
}
