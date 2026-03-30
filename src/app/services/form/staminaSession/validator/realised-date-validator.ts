import {AbstractControl, ValidationErrors, ValidatorFn} from "@angular/forms";

export function realisedDateValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const dateValue: string | null = group.get('date')?.value ?? null;
    const realised: boolean = Boolean(group.get('realised')?.value);

    if (!realised || !dateValue) {
      return null;
    }

    const sessionDate: string = dateValue.split('T')[0];
    const todayDate: Date = new Date();
    const today: string = `${todayDate.getFullYear()}-${`${todayDate.getMonth() + 1}`.padStart(2, '0')}-${`${todayDate.getDate()}`.padStart(2, '0')}`;

    console.log(dateValue, realised, sessionDate, today);

    if (sessionDate > today) {
      return {
        realisedDateInvalid: "Une seance future ne peut pas etre terminee"
      };
    }

    return null;
  };
}
