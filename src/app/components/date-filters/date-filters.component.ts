import {Component, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'app-date-filters',
  templateUrl: './date-filters.component.html',
  styleUrls: ['./date-filters.component.scss'],
  imports: [],
  standalone: true
})
export class DateFiltersComponent {
  @Output()
  public firstDateChange: EventEmitter<string> = new EventEmitter<string>();
  @Output()
  public secondDateChange: EventEmitter<string> = new EventEmitter<string>();

  protected firstDate = '';
  protected secondDate = '';

  public resetDate(): void{
    this.firstDate = '';
    this.secondDate = '';
    this.firstDateChange.emit('');
    this.secondDateChange.emit('');
  }

  protected onFirstDateChange(event: Event): void {
    this.firstDate = (event.target as HTMLInputElement).value;
    this.firstDateChange.emit(this.firstDate);
  }

  protected onSecondDateChange(event: Event): void {
    this.secondDate = (event.target as HTMLInputElement).value;
    this.secondDateChange.emit(this.secondDate);
  }
}
