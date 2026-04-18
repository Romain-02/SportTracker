import {DatePipe} from "@angular/common";
import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {addIcons} from "ionicons";
import {calendarNumberOutline} from "ionicons/icons";
import {IonCard, IonCardContent, IonCardTitle, IonIcon} from '@ionic/angular/standalone';
import {StaminaSession} from "../../../models/StaminaSession";
import {SportPipe} from "../../../pipes/sport.pipe";
import {WeatherConditionPipe} from "../../../pipes/weather-condition.pipe";
import {ToastService} from "../../../services/components/toast.service";

@Component({
  selector: 'app-session-card',
  templateUrl: './session-card.component.html',
  styleUrls: ['./session-card.component.scss'],
  standalone: true,
  imports: [
    IonCard,
    IonCardContent,
    IonCardTitle,
    IonIcon,
    DatePipe,
    WeatherConditionPipe,
    SportPipe
  ]
})
export class SessionCardComponent {
  @Input() staminaSession!: StaminaSession;
  @Output() viewMore: EventEmitter<void> = new EventEmitter<void>();
  @Output() edit: EventEmitter<void> = new EventEmitter<void>();

  private toastService: ToastService = inject(ToastService);

  constructor() {
    addIcons({calendarNumberOutline});
    this.toastService.showError("Test").then(() => console.log("test"));

  }

  protected readonly Math: Math = Math;

  protected get displayDifficulty(): number {
    return this.staminaSession.realised
      ? this.staminaSession.realDifficulty
      : this.staminaSession.predictedDifficulty ?? 0;
  }

  protected get displayKilometers(): number {
    return this.staminaSession.realised
      ? this.staminaSession.realKilometers
      : this.staminaSession.predictedKilometers ?? 0;
  }

  protected get displayTime(): number {
    return this.staminaSession.realised
      ? this.staminaSession.realTime
      : this.staminaSession.predictedTime ?? 0;
  }
}
