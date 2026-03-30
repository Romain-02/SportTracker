import {FormControl, Validators} from "@angular/forms";
import {TrainingRecurrenceFrequency} from "../../models/enums/TrainingRecurrenceFrequency";
import {weatherConditionValidator} from "../../services/form/staminaSession/validator/weather-condition-validator";

function getLocalIsoDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getStaminaSessionFormObject() {
  return {
    label: new FormControl<string>(""),
    realTime: new FormControl<number>(0, Validators.compose([
      Validators.min(0),
      Validators.max(10000),
      Validators.required
    ])),
    realDifficulty: new FormControl<number>(0, Validators.compose([
      Validators.min(0),
      Validators.max(10),
    ])),
    realKilometers: new FormControl<number>(0, Validators.compose([
      Validators.min(0),
      Validators.max(10000),
      Validators.required
    ])),
    predictedWarmupTime: new FormControl<number>(0, Validators.compose([
      Validators.min(0),
      Validators.max(10000)
    ])),
    predictedWarmupKilometers: new FormControl<number>(0, Validators.compose([
      Validators.min(0),
      Validators.max(10000)
    ])),
    realWarmupTime: new FormControl<number>(0, Validators.compose([
      Validators.min(0),
      Validators.max(10000)
    ])),
    realWarmupKilometers: new FormControl<number>(0, Validators.compose([
      Validators.min(0),
      Validators.max(10000)
    ])),
    weatherCondition: new FormControl<string | null>(null, Validators.compose([
      Validators.min(0),
      Validators.max(10000),
      weatherConditionValidator(),
    ])),
    date: new FormControl<string>(getLocalIsoDate(), Validators.required),
    realised: new FormControl<boolean>(false),
    program: new FormControl<number | null>(null),
    staminaTraining: new FormControl<number | null>(null),
    sport: new FormControl<number | null>(null, Validators.required),
    sportType: new FormControl<number | null>(null, Validators.required)
  };
}

export function getStaminaTrainingFormObject(isTrainingForm = true) {
  return {
    predictedTime: new FormControl<number>(0, Validators.compose([
      Validators.min(0),
      Validators.max(10000),
      ...(isTrainingForm ? [Validators.required] : [])
    ])),
    predictedDifficulty: new FormControl<number>(0, Validators.compose([
      Validators.min(0),
      Validators.max(10),
    ])),
    predictedKilometers: new FormControl<number>(0, Validators.compose([
      Validators.min(0),
      Validators.max(10000),
      ...(isTrainingForm ? [Validators.required] : [])
    ])),
    predictedWarmupTime: new FormControl<number>(0, Validators.compose([
      Validators.min(0),
      Validators.max(10000)
    ])),
    predictedWarmupKilometers: new FormControl<number>(0, Validators.compose([
      Validators.min(0),
      Validators.max(10000)
    ])),
    isActive: new FormControl<boolean>(true),
    program: new FormControl<number | null>(null),
    sport: new FormControl<number | null>(null, Validators.required),
    sportType: new FormControl<number | null>(null, Validators.required),
    name: new FormControl<string>(""),
    recurrenceDays: new FormControl<string[]>([]),
    recurrenceFrequency: new FormControl<TrainingRecurrenceFrequency | null>(null),
  };
}

export function getProgramFormObject() {
  const today: string = new Date().toISOString().split('T')[0];

  return {
    name: new FormControl<string>("", Validators.required),
    description: new FormControl<string>(""),
    startDate: new FormControl<string>(today),
    endDate: new FormControl<string | null>(null),
    isArchived: new FormControl<boolean>(false),
    trainingIds: new FormControl<number[]>([])
  };
}
