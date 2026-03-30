import {inject, Injectable} from '@angular/core';
import {ToastController} from "@ionic/angular";

export type ToastType = 'success' | 'danger' | 'warning'
export type ToastPosition = 'bottom' | 'top' | 'middle'

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastController: ToastController = inject(ToastController);

  private nbToast: number = 0;

  async showSuccess(message: string, duration: number = 2000, toastPosition: ToastPosition = 'top'): Promise<void> {
    await this.showMessage(message, duration, toastPosition, 'success');
  }

  async showError(message: string, duration: number = 2000, toastPosition: ToastPosition = 'top'): Promise<void> {
    await this.showMessage(message, duration, toastPosition, 'danger');
  }

  private async showMessage(message: string, duration: number, toastPosition: ToastPosition, toastType: ToastType): Promise<void>{
    this.nbToast++;
    const toast: HTMLIonToastElement = await this.toastController.create({
      message: message,
      duration: duration,
      position: toastPosition,
      color: toastType,
      cssClass: `ion-toast-custom-${this.nbToast}`
    });

    console.log(`ion-toast-custom-${this.nbToast}`)
    toast.onDidDismiss().then(() => {
      this.nbToast--;
    });

    await toast.present();
  }
}
