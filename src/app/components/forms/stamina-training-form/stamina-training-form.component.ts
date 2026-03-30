import {Component, inject, Input, OnInit, WritableSignal} from '@angular/core';
import {FormGroup, ReactiveFormsModule} from "@angular/forms";
import {IonicModule} from "@ionic/angular";
import {ProgramService} from "../../../services/database/entities/program/program.service";
import {Programs} from "../../../models/Program";
import {TrainingRecurrenceFrequency} from "../../../models/enums/TrainingRecurrenceFrequency";
import {SportSelectsComponent} from "../sport-selects/sport-selects.component";

@Component({
  selector: 'app-stamina-training-form',
  templateUrl: './stamina-training-form.component.html',
  styleUrls: ['./stamina-training-form.component.scss'],
  imports: [
    IonicModule,
    ReactiveFormsModule,
    SportSelectsComponent
  ],
  standalone: true
})
export class StaminaTrainingFormComponent implements OnInit {
  private programService: ProgramService = inject(ProgramService);

  @Input({required: true})
  public staminaTrainingForm!: FormGroup;

  @Input()
  public showPlanning = true;

  protected programs: WritableSignal<Programs> = this.programService.programs;
  protected readonly recurrenceDays: string[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  protected readonly TrainingRecurrenceFrequency = TrainingRecurrenceFrequency;
  protected readonly Object: ObjectConstructor = Object;

  ngOnInit(): void {
    this.programService.fetchPrograms();
  }
}
