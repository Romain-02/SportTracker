import { Pipe, PipeTransform } from '@angular/core';
import {Sport} from "../models/enums/Sport";

@Pipe({
  standalone: true,
  name: 'sport'
})
export class SportPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    switch (value){
      case Sport.Running: return "directions_run"
      case Sport.Biking: return "directions_bike"
      case Sport.Walking: return "footprint"
      default: return "directions_run"
    }
  }

}
