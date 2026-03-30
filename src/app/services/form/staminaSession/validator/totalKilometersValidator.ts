import {AbstractControl, ValidationErrors, ValidatorFn} from "@angular/forms";

export function totalKilometersValidator(): ValidatorFn{
  return (group: AbstractControl): ValidationErrors | null => {
    const totalKilometers: number | undefined = group.get('totalKilometers')?.value;
    const realKilometers: number | undefined = group.get('realKilometers')?.value;
    if(totalKilometers && realKilometers && totalKilometers < realKilometers){
      return {totalKilometersInvalid: "Le nombre de kilomètre total ne peut pas être inférieur au nombre de kilomètres réels"}
    }
    return null
  }
}
