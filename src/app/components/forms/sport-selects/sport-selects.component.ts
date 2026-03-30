import {Component, inject, Input, OnInit, WritableSignal} from '@angular/core';
import {AbstractControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {SportService} from "../../../services/database/entities/sports/sport.service";
import {SportTypeService} from "../../../services/database/entities/sportTypes/sport-types-services";
import {Sports} from "../../../models/Sport";
import {SportTypes} from "../../../models/SportType";
import {distinctUntilChanged, filter} from "rxjs";
import {IonicModule} from "@ionic/angular";

@Component({
  selector: 'app-sport-selects',
  templateUrl: './sport-selects.component.html',
  styleUrls: ['./sport-selects.component.scss'],
  imports: [
    IonicModule,
    ReactiveFormsModule
  ],
  standalone: true
})
export class SportSelectsComponent  implements OnInit {
  @Input({required: true})
  public staminaTrainingForm!: FormGroup;

  private sportService: SportService = inject(SportService);
  private sportTypeService: SportTypeService = inject(SportTypeService);

  protected sports: WritableSignal<Sports> = this.sportService.sports;
  protected filteredSportTypes: WritableSignal<SportTypes> = this.sportTypeService.filteredSportTypes;

  ngOnInit() {
    this.sportService.fetchSports();
    const sportField: AbstractControl | null = this.staminaTrainingForm.get('sport')

    if(sportField){
      sportField.valueChanges
        .pipe(
          distinctUntilChanged(),
          filter((sportId) => !!sportId),
        )
        .subscribe((sportId: number) => {
          this.sportTypeService.fetchFilteredSportTypes(sportId);
        });
    }
  }

}
