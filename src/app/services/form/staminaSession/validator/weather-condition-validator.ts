import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import {WeatherCondition} from "../../../../models/enums/WeatherCondition";

export function weatherConditionValidator(): ValidatorFn {
  const validValues: string[] = Object.values(WeatherCondition);
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    return validValues.includes(control.value)
      ? null
      : { invalidWeatherCondition: true };
  };
}
