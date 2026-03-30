import {Injectable} from '@angular/core';
import {FormGroup} from "@angular/forms";
import {getProgramFormObject} from "../../../utils/form/getFormsObject";

@Injectable({
  providedIn: 'root'
})
export class ProgramFormService {
  public createForm(): FormGroup {
    return new FormGroup(getProgramFormObject());
  }
}
