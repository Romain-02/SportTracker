import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {IonicModule} from "@ionic/angular";
import {addIcons} from "ionicons";
import {chevronDownOutline, chevronUpOutline, funnelOutline, refreshOutline} from "ionicons/icons";
import {DateFiltersComponent} from "../../date-filters/date-filters.component";

@Component({
  selector: 'app-program-filters-toolbar',
  templateUrl: './program-filters-toolbar.component.html',
  styleUrls: ['./program-filters-toolbar.component.scss'],
  imports: [
    IonicModule,
    FormsModule,
    DateFiltersComponent
  ],
  standalone: true
})
export class ProgramFiltersToolbarComponent {
  @ViewChild('dateFilters')
  private dateFilters!: DateFiltersComponent;

  @Input()
  public showArchived = false;

  @Output()
  public showArchivedChange = new EventEmitter<boolean>();

  @Output()
  public firstDateChange = new EventEmitter<string>();

  @Output()
  public secondDateChange = new EventEmitter<string>();

  @Output()
  public resetRequested = new EventEmitter<void>();

  protected filtersExpanded = false;

  constructor() {
    addIcons({funnelOutline, chevronDownOutline, chevronUpOutline, refreshOutline});
  }

  protected toggleFiltersExpanded(): void {
    this.filtersExpanded = !this.filtersExpanded;
  }

  protected resetFilters(): void {
    this.dateFilters?.resetDate();
    this.resetRequested.emit();
  }
}
