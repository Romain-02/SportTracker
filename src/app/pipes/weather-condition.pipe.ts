import { Pipe, PipeTransform } from '@angular/core';
import {WeatherCondition} from "../models/enums/WeatherCondition";

@Pipe({
  standalone: true,
  name: 'weatherCondition'
})
export class WeatherConditionPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    switch (value){
      case WeatherCondition.Cloudy: return "cloud"
      case WeatherCondition.Freezing: return "weather_snowy"
      case WeatherCondition.Windy: return "air"
      case WeatherCondition.VeryWindy: return "cyclone"
      case WeatherCondition.LightRain: return "rainy"
      case WeatherCondition.HeavyRain: return "thunderstorm"
      case WeatherCondition.Snow: return "severe_cold"
      case WeatherCondition.Sunny: return "sunny"
      default: return ""
    }
  }

}
