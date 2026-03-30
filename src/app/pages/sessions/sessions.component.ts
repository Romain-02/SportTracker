import {DatePipe} from "@angular/common";
import {Component, inject, OnInit, WritableSignal} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {IonicModule, ModalController} from "@ionic/angular";
import {addIcons} from "ionicons";
import {addOutline, barbellOutline, flashOutline} from "ionicons/icons";
import {ActivitiesToolbarComponent} from "../../components/activities/activities-toolbar/activities-toolbar.component";
import {SessionDetailModalComponent} from "../../components/modals/session-detail/session-detail-modal.component";
import {SessionModalComponent} from "../../components/modals/session/session-modal.component";
import {TrainingModalComponent} from "../../components/modals/training/training-modal.component";
import {SessionListsComponent} from "../../components/session/session-lists/session-lists.component";
import {TrainingCardComponent} from "../../components/stamina-training/training-card/training-card.component";
import {TrainingListComponent} from "../../components/stamina-training/training-list/training-list.component";
import {Sport, Sports} from "../../models/Sport";
import {SportTypes} from "../../models/SportType";
import {StaminaSession, StaminaSessions} from "../../models/StaminaSession";
import {StaminaTraining, StaminaTrainings} from "../../models/StaminaTraining";
import {StaminaSessionService} from "../../services/database/entities/staminaSession/stamina-session.service";
import {StaminaTrainingService} from "../../services/database/entities/staminaTraining/stamina-training.service";
import {SportTypeService} from "../../services/database/entities/sportTypes/sport-types-services";
import {SportService} from "../../services/database/entities/sports/sport.service";

type ActivityTab = 'sessions' | 'trainings';
type SessionViewMode = 'list' | 'week';
type SessionStatusFilter = 'all' | 'done' | 'pending';

@Component({
  selector: 'app-sessions',
  templateUrl: './sessions.component.html',
  styleUrls: ['./sessions.component.scss'],
  imports: [
    IonicModule,
    SessionListsComponent,
    ActivitiesToolbarComponent,
    TrainingCardComponent,
    FormsModule,
    DatePipe,
    TrainingListComponent
  ],
  standalone: true
})
export class SessionsComponent implements OnInit {
  private readonly sportService: SportService = inject(SportService);
  private readonly sportTypeService: SportTypeService = inject(SportTypeService);
  private readonly staminaSessionService: StaminaSessionService = inject(StaminaSessionService);
  private readonly staminaTrainingService: StaminaTrainingService = inject(StaminaTrainingService);
  private readonly modalController: ModalController = inject(ModalController);

  protected sports: WritableSignal<Sports> = this.sportService.sports;
  protected sportTypes: WritableSignal<SportTypes> = this.sportTypeService.sportTypes;
  protected staminaTrainings: WritableSignal<StaminaTrainings> = this.staminaTrainingService.staminaTrainings;

  protected displayedSessions: StaminaSessions = [];
  protected selectedSport: Sport | null = null;
  protected selectedSportTypeId: number | null = null;
  protected selectedTrainingId: number | null = null;
  protected selectedSessionStatus: SessionStatusFilter = 'all';
  protected activityTab: ActivityTab = 'sessions';
  protected sessionViewMode: SessionViewMode = 'list';
  protected anchorSessionId: number | null = null;
  protected hasPreviousSessions = false;
  protected hasNextSessions = false;
  protected isLoadingPrevious = false;
  protected isLoadingNext = false;

  private selectedFirstDate: string | null = null;
  private selectedSecondDate: string | null = null;
  private loadedStartDate: string | null = null;
  private loadedEndDate: string | null = null;
  private readonly sessionWindowDays = 90;

  constructor() {
    addIcons({addOutline, flashOutline, barbellOutline});
  }

  public ngOnInit(): void {
    this.sportService.fetchSports();
    this.sportTypeService.fetchSportTypes();
    this.resetSessionWindowAndLoad();
    this.loadTrainings();
  }

  protected get weekDays(): Date[] {
    const reference: Date = this.selectedFirstDate ? new Date(this.selectedFirstDate) : new Date();
    const day: number = reference.getDay();
    const mondayOffset: number = day === 0 ? -6 : 1 - day;
    const monday: Date = new Date(reference);
    monday.setDate(reference.getDate() + mondayOffset);

    return Array.from({length: 7}, (_, index) => {
      const current = new Date(monday);
      current.setDate(monday.getDate() + index);
      return current;
    });
  }

  protected sessionsForDay(day: Date): StaminaSessions {
    const isoDate = this.toIsoDate(day);
    return this.filteredSessions().filter((session) => session.date === isoDate);
  }

  protected filteredSessions(): StaminaSessions {
    return this.displayedSessions.filter((session) => {
      const sportTypeMatch = !this.selectedSportTypeId || session.sportType?.id === this.selectedSportTypeId;
      const trainingMatch = !this.selectedTrainingId || session.staminaTraining?.id === this.selectedTrainingId;
      const statusMatch = this.selectedSessionStatus === 'all'
        || (this.selectedSessionStatus === 'done' && session.realised)
        || (this.selectedSessionStatus === 'pending' && !session.realised);

      return sportTypeMatch && trainingMatch && statusMatch;
    });
  }

  protected filteredTrainings(): StaminaTrainings {
    if (!this.selectedSport) {
      return this.staminaTrainings();
    }

    return this.staminaTrainings().filter((training) => training.sport.id === this.selectedSport?.id);
  }

  protected resetFilters(): void {
    this.selectedSport = null;
    this.selectedSportTypeId = null;
    this.selectedTrainingId = null;
    this.selectedSessionStatus = 'all';
    this.selectedFirstDate = null;
    this.selectedSecondDate = null;
    this.resetSessionWindowAndLoad();
  }

  protected setSelectedSport(newSport: Sport | null): void {
    this.selectedSport = newSport;
    this.resetSessionWindowAndLoad();
  }

  protected setSelectedSportTypeId(sportTypeId: number | null): void {
    this.selectedSportTypeId = sportTypeId;
    this.refreshAnchorSessionId(true);
  }

  protected setSelectedTrainingId(trainingId: number | null): void {
    this.selectedTrainingId = trainingId;
    this.refreshAnchorSessionId(true);
  }

  protected setSelectedSessionStatus(status: SessionStatusFilter): void {
    this.selectedSessionStatus = status;
    this.refreshAnchorSessionId(true);
  }

  protected setFirstDate(newDate: string): void {
    this.selectedFirstDate = newDate ? newDate.split('T')[0] : null;
    this.resetSessionWindowAndLoad();
  }

  protected setSecondDate(newDate: string): void {
    this.selectedSecondDate = newDate ? newDate.split('T')[0] : null;
    this.resetSessionWindowAndLoad();
  }

  protected async loadPreviousSessions(): Promise<void> {
    if (!this.hasPreviousSessions || this.isLoadingPrevious || !this.loadedStartDate) {
      return;
    }

    this.isLoadingPrevious = true;
    const newEndDate = this.addDays(this.loadedStartDate, -1);
    const newStartDate = this.addDays(this.loadedStartDate, -this.sessionWindowDays);

    const chunk = await this.staminaSessionService.fetchStaminaSessionsChunk(
      this.selectedSport,
      newStartDate,
      newEndDate
    );

    this.displayedSessions = this.mergeSessions(chunk, this.displayedSessions);
    this.loadedStartDate = newStartDate;
    this.hasPreviousSessions = !this.selectedFirstDate;
    this.isLoadingPrevious = false;
  }

  protected async loadNextSessions(): Promise<void> {
    if (!this.hasNextSessions || this.isLoadingNext || !this.loadedEndDate) {
      return;
    }

    this.isLoadingNext = true;
    const newStartDate = this.addDays(this.loadedEndDate, 1);
    const newEndDate = this.addDays(this.loadedEndDate, this.sessionWindowDays);

    const chunk = await this.staminaSessionService.fetchStaminaSessionsChunk(
      this.selectedSport,
      newStartDate,
      newEndDate
    );

    this.displayedSessions = this.mergeSessions(this.displayedSessions, chunk);
    this.loadedEndDate = newEndDate;
    this.hasNextSessions = !this.selectedSecondDate;
    this.refreshAnchorSessionId(false);
    this.isLoadingNext = false;
  }

  protected async createSession(): Promise<void> {
    const modal = await this.modalController.create({
      component: SessionModalComponent
    });

    await modal.present();
    const {role} = await modal.onWillDismiss();

    if (role === 'confirm') {
      await this.resetSessionWindowAndLoad();
      this.loadTrainings();
    }
  }

  protected async editSession(sessionId: number): Promise<void> {
    const modal = await this.modalController.create({
      component: SessionModalComponent,
      componentProps: {
        sessionId
      }
    });

    await modal.present();
    const {role} = await modal.onWillDismiss();

    if (role === 'confirm') {
      await this.resetSessionWindowAndLoad();
      this.loadTrainings();
    }
  }

  protected async createTraining(): Promise<void> {
    const modal = await this.modalController.create({
      component: TrainingModalComponent
    });

    await modal.present();
    const {role} = await modal.onWillDismiss();

    if (role === 'confirm') {
      this.loadTrainings();
      await this.resetSessionWindowAndLoad();
    }
  }

  protected async editTraining(trainingId: number): Promise<void> {
    const modal = await this.modalController.create({
      component: TrainingModalComponent,
      componentProps: {
        trainingId
      }
    });

    await modal.present();
    const {role} = await modal.onWillDismiss();

    if (role === 'confirm') {
      this.loadTrainings();
      await this.resetSessionWindowAndLoad();
    }
  }

  protected async openSession(sessionId: number): Promise<void> {
    const session: StaminaSession | null = await this.staminaSessionService.fetchStaminaSessionById(sessionId);
    if (!session) {
      return;
    }

    const modal = await this.modalController.create({
      component: SessionDetailModalComponent,
      componentProps: {
        staminaSession: session
      }
    });

    await modal.present();
    const {role, data} = await modal.onWillDismiss();

    if (role === 'edit' && data) {
      await this.editSession(data);
    }
  }

  protected getSessionDisplayKilometers(session: StaminaSession): number {
    return session.realised ? session.realKilometers : (session.predictedKilometers ?? 0);
  }

  protected getSessionDisplayTime(session: StaminaSession): number {
    return session.realised ? session.realTime : (session.predictedTime ?? 0);
  }

  private async resetSessionWindowAndLoad(): Promise<void> {
    const today = this.toIsoDate(new Date());
    let startDate: string;
    let endDate: string;

    if (this.selectedFirstDate && this.selectedSecondDate) {
      startDate = this.selectedFirstDate;
      endDate = this.selectedSecondDate;
      this.hasPreviousSessions = false;
      this.hasNextSessions = false;
    } else if (this.selectedFirstDate) {
      startDate = this.selectedFirstDate;
      endDate = this.addDays(startDate, this.sessionWindowDays);
      this.hasPreviousSessions = false;
      this.hasNextSessions = true;
    } else if (this.selectedSecondDate) {
      startDate = this.addDays(this.selectedSecondDate, -this.sessionWindowDays);
      endDate = this.selectedSecondDate;
      this.hasPreviousSessions = true;
      this.hasNextSessions = false;
    } else {
      startDate = this.addDays(today, -this.sessionWindowDays);
      endDate = this.addDays(today, this.sessionWindowDays);
      this.hasPreviousSessions = true;
      this.hasNextSessions = true;
    }

    this.loadedStartDate = startDate;
    this.loadedEndDate = endDate;
    this.isLoadingPrevious = false;
    this.isLoadingNext = false;
    this.displayedSessions = await this.staminaSessionService.fetchStaminaSessionsChunk(
      this.selectedSport,
      startDate,
      endDate
    );
    this.refreshAnchorSessionId(true);
  }

  private refreshAnchorSessionId(forceReset: boolean): void {
    const filtered = this.filteredSessions();
    if (!filtered.length) {
      this.anchorSessionId = null;
      return;
    }

    if (!forceReset && this.anchorSessionId && filtered.some((session) => session.id === this.anchorSessionId)) {
      return;
    }

    const today = this.toIsoDate(new Date());
    const nextSession = filtered.find((session) => session.date >= today);
    this.anchorSessionId = nextSession?.id ?? filtered[filtered.length - 1].id;
  }

  private mergeSessions(first: StaminaSessions, second: StaminaSessions): StaminaSessions {
    const sessionsById = new Map<number, StaminaSession>();

    for (const session of [...first, ...second]) {
      sessionsById.set(session.id, session);
    }

    return Array.from(sessionsById.values()).sort((left, right) => {
      if (left.date === right.date) {
        return left.id - right.id;
      }

      return left.date.localeCompare(right.date);
    });
  }

  private addDays(dateString: string, days: number): string {
    const date = new Date(`${dateString}T00:00:00`);
    date.setDate(date.getDate() + days);
    return this.toIsoDate(date);
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private loadTrainings(): void {
    this.staminaTrainingService.fetchStaminaTrainings();
  }
}
