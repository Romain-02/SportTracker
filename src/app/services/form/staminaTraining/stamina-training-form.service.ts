import {Injectable} from '@angular/core';
import {FormGroup} from "@angular/forms";
import {getStaminaTrainingFormObject} from "../../../utils/form/getFormsObject";

@Injectable({
  providedIn: 'root'
})
export class StaminaTrainingFormService {
  public createForm(): FormGroup {
    return new FormGroup(getStaminaTrainingFormObject(true));
  }
}
