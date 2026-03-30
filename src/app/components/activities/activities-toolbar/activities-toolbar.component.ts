import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {IonicModule} from "@ionic/angular";
import {addIcons} from "ionicons";
import {
  calendarOutline,
  chevronDownOutline,
  chevronUpOutline,
  funnelOutline,
  listOutline,
  refreshOutline
} from "ionicons/icons";
import {DateFiltersComponent} from "../../date-filters/date-filters.component";
import {Sport, Sports} from "../../../models/Sport";
import {SportType, SportTypes} from "../../../models/SportType";
import {StaminaTraining, StaminaTrainings} from "../../../models/StaminaTraining";

type ActivityTab = 'sessions' | 'trainings';
type SessionViewMode = 'list' | 'week';
type SessionStatusFilter = 'all' | 'done' | 'pending';

@Component({
  selector: 'app-activities-toolbar',
  templateUrl: './activities-toolbar.component.html',
  styleUrls: ['./activities-toolbar.component.scss'],
  imports: [
    IonicModule,
    FormsModule,
    DateFiltersComponent
  ],
  standalone: true
})
export class ActivitiesToolbarComponent {
  @ViewChild('dateFilters')
  private dateFilters!: DateFiltersComponent;

  @Input({required: true})
  public sports: Sports = [];

  @Input()
  public selectedSport: Sport | null = null;

  @Input()
  public sportTypes: SportTypes = [];

  @Input()
  public selectedSportTypeId: number | null = null;

  @Input()
  public trainings: StaminaTrainings = [];

  @Input()
  public selectedTrainingId: number | null = null;

  @Input()
  public selectedSessionStatus: SessionStatusFilter = 'all';

  @Input({required: true})
  public activityTab: ActivityTab = 'sessions';

  @Input({required: true})
  public sessionViewMode: SessionViewMode = 'list';

  @Output()
  public selectedSportChange: EventEmitter<Sport | null> = new EventEmitter<Sport | null>();

  @Output()
  public selectedSportTypeIdChange: EventEmitter<number | null> = new EventEmitter<number | null>();

  @Output()
  public selectedTrainingIdChange: EventEmitter<number | null> = new EventEmitter<number | null>();

  @Output()
  public selectedSessionStatusChange: EventEmitter<SessionStatusFilter> = new EventEmitter<SessionStatusFilter>();

  @Output()
  public firstDateChange: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  public secondDateChange: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  public sessionViewModeChange: EventEmitter<SessionViewMode> = new EventEmitter<SessionViewMode>();

  @Output()
  public resetRequested: EventEmitter<void> = new EventEmitter<void>();

  protected filtersExpanded: boolean = false;
  protected readonly sessionStatusOptions: Array<{value: SessionStatusFilter; label: string}> = [
    {value: 'all', label: 'Tous'},
    {value: 'done', label: 'Terminees'},
    {value: 'pending', label: 'Non realisees'}
  ];

  constructor() {
    addIcons({funnelOutline, chevronDownOutline, chevronUpOutline, listOutline, calendarOutline, refreshOutline});
  }

  protected toggleFiltersExpanded(): void {
    this.filtersExpanded = !this.filtersExpanded;
  }

  protected updateSport(sport: Sport | null): void {
    this.selectedSportChange.emit(sport);
    this.selectedSportTypeIdChange.emit(null);
  }

  protected get filteredSportTypes(): SportTypes {
    if (!this.selectedSport) {
      return this.sportTypes;
    }

    return this.sportTypes.filter((sportType: SportType) => sportType.sport.id === this.selectedSport?.id);
  }

  protected get filteredTrainings(): StaminaTrainings {
    return this.trainings.filter((training: StaminaTraining) => {
      const sportMatch = !this.selectedSport || training.sport.id === this.selectedSport.id;
      const sportTypeMatch = !this.selectedSportTypeId || training.sportType?.id === this.selectedSportTypeId;
      return sportMatch && sportTypeMatch;
    });
  }

  protected setSessionViewMode(mode: SessionViewMode): void {
    if (this.activityTab !== 'sessions') {
      return;
    }

    this.sessionViewModeChange.emit(mode);
  }

  protected resetFilters(): void {
    this.dateFilters?.resetDate();
    this.selectedSportChange.emit(null);
    this.selectedSportTypeIdChange.emit(null);
    this.selectedTrainingIdChange.emit(null);
    this.selectedSessionStatusChange.emit('all');
    this.resetRequested.emit();
  }
}
