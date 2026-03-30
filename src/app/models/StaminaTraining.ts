import {Program} from "./Program";
import {Sport} from "./Sport";
import {SportType} from "./SportType";
import {TrainingRecurrenceFrequency} from "./enums/TrainingRecurrenceFrequency";

export interface StaminaTrainingRow {
  id: number;
  name: string | null;
  predictedTime: number | null;
  predictedKilometers: number | null;
  predictedDifficulty: number | null;
  predictedWarmupTime: number | null;
  predictedWarmupKilometers: number | null;
  isActive: number;
  sportTypeId: number | null;
  sportId: number;
  programId: number | null;
  recurrenceDays: string | null;
  recurrenceFrequency: TrainingRecurrenceFrequency | null;
  nbStaminaSessions?: number;
}

export type StaminaTrainingRows = StaminaTrainingRow[];

export interface StaminaTraining {
  id: number;
  name?: string | null;
  predictedTime?: number | null;
  sportType?: SportType | null;
  predictedKilometers?: number | null;
  predictedDifficulty?: number | null;
  predictedWarmupTime?: number | null;
  predictedWarmupKilometers?: number | null;
  isActive: boolean;
  sport: Sport;
  program?: Program | null;
  recurrenceDays: string[];
  recurrenceFrequency?: TrainingRecurrenceFrequency | null;
  nbStaminaSessions?: number;
}

export type StaminaTrainings = StaminaTraining[];

export interface StaminaTrainingForm {
  name?: string | null;
  predictedTime?: number | null;
  sportType?: number | null;
  predictedKilometers?: number | null;
  predictedDifficulty?: number | null;
  predictedWarmupTime?: number | null;
  predictedWarmupKilometers?: number | null;
  isActive?: boolean | null;
  sport: number | null;
  program?: number | null;
  recurrenceDays?: string[];
  recurrenceFrequency?: TrainingRecurrenceFrequency | null;
}
