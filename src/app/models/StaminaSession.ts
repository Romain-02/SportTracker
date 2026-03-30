import {Program} from "./Program";
import {Sport} from "./Sport";
import {SportType} from "./SportType";
import {StaminaTraining} from "./StaminaTraining";
import {WeatherCondition} from "./enums/WeatherCondition";

export interface StaminaSessionRow {
  id: number;
  label: string | null;
  createdAt: string;
  realTime: number;
  realDifficulty: number;
  realKilometers: number;
  predictedTime: number | null;
  predictedDifficulty: number | null;
  predictedKilometers: number | null;
  predictedWarmupTime: number;
  predictedWarmupKilometers: number;
  realWarmupTime: number;
  realWarmupKilometers: number;
  date: string;
  weatherCondition: WeatherCondition | null;
  staminaTrainingId: number | null;
  programId: number | null;
  sportId: number | null;
  sportTypeId: number | null;
  realised: number;
}

export type StaminaSessionRows = StaminaSessionRow[];

export interface StaminaSession {
  id: number;
  label?: string | null;
  createdAt: string;
  realTime: number;
  realDifficulty: number;
  realKilometers: number;
  predictedTime?: number | null;
  predictedDifficulty?: number | null;
  predictedKilometers?: number | null;
  predictedWarmupTime: number;
  predictedWarmupKilometers: number;
  realWarmupTime: number;
  realWarmupKilometers: number;
  date: string;
  realised: boolean;
  weatherCondition?: WeatherCondition | null;
  sport: Sport | null;
  sportType?: SportType | null;
  staminaTraining: StaminaTraining | null;
  program?: Program | null;
}

export type StaminaSessions = StaminaSession[];

export interface StaminaSessionForm {
  label?: string | null;
  realTime: number;
  realDifficulty?: number | null;
  realKilometers: number;
  predictedWarmupTime?: number | null;
  predictedWarmupKilometers?: number | null;
  realWarmupTime?: number | null;
  realWarmupKilometers?: number | null;
  weatherCondition?: WeatherCondition | null;
  date: string;
  realised?: boolean | null;
  program?: number | null;
  staminaTraining?: number | null;
  sport: number | null;
  sportType?: number | null;
  predictedTime?: number | null;
  predictedDifficulty?: number | null;
  predictedKilometers?: number | null;
}
