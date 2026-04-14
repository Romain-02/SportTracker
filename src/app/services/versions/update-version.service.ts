import {Injectable} from '@angular/core';
import {BundleInfo, CapacitorUpdater} from '@capgo/capacitor-updater';
import {ConnectionStatus, Network} from '@capacitor/network';
import {App} from '@capacitor/app';
import {Capacitor} from '@capacitor/core';
import {environment} from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class UpdateService {

  private readonly lastFailedVersionKey = 'ota_last_failed_version';

  constructor() { }

  async checkForUpdates() {
    let attemptedVersion = '';

    if (!environment.production || !Capacitor.isNativePlatform()) {
      return;
    }

    const status: ConnectionStatus = await Network.getStatus();
    if (!status.connected) {
      console.log("Hors connexion, utilisation de la version actuelle.");
      return;
    }

    try {
      const response: Response = await fetch(environment.githubApiUrl);
      if (!response.ok) {
        console.warn('Impossible de lire la release OTA.', response.status);
        return;
      }

      const latestRelease = await response.json();
      if (!latestRelease?.tag_name || !Array.isArray(latestRelease.assets)) {
        console.warn('Release OTA invalide: tag ou assets manquants.');
        return;
      }

      const latestVersion = this.normalizeVersion(latestRelease.tag_name);
      attemptedVersion = latestVersion;
      const currentVersion: string = this.normalizeVersion((await App.getInfo()).version);

      if (!latestVersion || latestVersion === currentVersion) {
        return;
      }

      if (latestVersion === localStorage.getItem(this.lastFailedVersionKey)) {
        console.warn('Version OTA déjà en échec, tentative ignorée:', latestVersion);
        return;
      }

      const bundleAsset = latestRelease.assets.find((asset: { name?: string; browser_download_url?: string }) => {
        return !!asset?.browser_download_url && !!asset?.name && asset.name.toLowerCase().endsWith('.zip');
      });

      if (!bundleAsset?.browser_download_url) {
        console.warn('Aucun asset .zip trouvé pour OTA.');
        return;
      }

      // Compare avec la version actuelle de l’appli
      if (latestVersion !== currentVersion) {
        const update: BundleInfo = await CapacitorUpdater.download({
          url: bundleAsset.browser_download_url,
          version: latestVersion,
        });
        await CapacitorUpdater.set(update);
        localStorage.removeItem(this.lastFailedVersionKey);
        // Do not force reload now; app continues on embedded bundle and update applies safely.
        console.info('Mise à jour OTA prête, redémarrer l\'application pour l\'appliquer.');
      }
    } catch (e) {
      if (attemptedVersion) {
        localStorage.setItem(this.lastFailedVersionKey, attemptedVersion);
      }
      console.error("Erreur de mise à jour :", e);
    }
  }

  private normalizeVersion(version: string | undefined): string {
    return (version ?? '').replace(/^v/i, '').trim();
  }
}
