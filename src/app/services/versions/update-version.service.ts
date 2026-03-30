import {Injectable} from '@angular/core';
import {BundleInfo, CapacitorUpdater} from '@capgo/capacitor-updater';
import {ConnectionStatus, Network} from '@capacitor/network';
import {App} from '@capacitor/app';
import {environment} from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class UpdateService {

  constructor() { }

  async checkForUpdates() {
    const status: ConnectionStatus = await Network.getStatus();
    if (!status.connected) {
      console.log("Hors connexion, utilisation de la version actuelle.");
      return;
    }

    try {
      // Récupère la dernière release depuis GitHub API
      const response: Response = await fetch(environment.githubApiUrl);
      const latestRelease = await response.json();
      const latestVersion = latestRelease.tag_name;
      const downloadUrl = latestRelease.assets[0].browser_download_url; // URL du .zip

      // Compare avec la version actuelle de l’appli
      const currentVersion: string = (await App.getInfo()).version;
      if (latestVersion !== currentVersion) {
        const update: BundleInfo = await CapacitorUpdater.download({ url: downloadUrl, version: latestVersion });
        await CapacitorUpdater.set(update);
        globalThis.location.reload();
      }
    } catch (e) {
      console.error("Erreur de mise à jour :", e);
    }
  }
}
