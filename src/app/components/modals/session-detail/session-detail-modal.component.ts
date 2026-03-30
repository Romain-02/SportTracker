import {DatePipe} from "@angular/common";
import {Component, Input} from '@angular/core';
import {ModalController} from "@ionic/angular";
import {IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonTitle, IonToolbar} from "@ionic/angular/standalone";
import {StaminaSession} from "../../../models/StaminaSession";

@Component({
  selector: 'app-session-detail-modal',
  templateUrl: './session-detail-modal.component.html',
  styleUrls: ['./session-detail-modal.component.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    DatePipe
  ],
  standalone: true
})
export class SessionDetailModalComponent {
  @Input({required: true})
  public staminaSession!: StaminaSession;

  constructor(private readonly modalController: ModalController) {}

  close(): void {
    this.modalController.dismiss();
  }

  edit(): void {
    this.modalController.dismiss(this.staminaSession.id, 'edit');
  }
}
