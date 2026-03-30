import {Injectable} from '@angular/core';
import {FormGroup} from "@angular/forms";
import {getStaminaSessionFormObject} from "../../../utils/form/getFormsObject";
import {realisedDateValidator} from "./validator/realised-date-validator";

@Injectable({
  providedIn: 'root'
})
export class StaminaSessionFormService {
  public createForm(): FormGroup {
    return new FormGroup(getStaminaSessionFormObject(), {
      validators: [realisedDateValidator()]
    });
  }
}
