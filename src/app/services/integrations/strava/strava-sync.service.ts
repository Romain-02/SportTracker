import {inject, Injectable, signal, WritableSignal} from '@angular/core';
import {environment} from "../../../../environments/environment";
import {Sport} from "../../../models/Sport";
import {SportType} from "../../../models/SportType";
import {StaminaSession, StaminaSessionForm} from "../../../models/StaminaSession";
import {ToastService} from "../../components/toast.service";
import {SportTypeService} from "../../database/entities/sportTypes/sport-types-services";
import {SportService} from "../../database/entities/sports/sport.service";
import {StaminaSessionService} from "../../database/entities/staminaSession/stamina-session.service";

interface StravaActivity {
  id: number;
  name?: string;
  sport_type?: string;
  type?: string;
  start_date_local?: string;
  elapsed_time?: number;
  distance?: number;
}

interface SyncTarget {
  sport: Sport;
  sportType: SportType;
}

interface SyncCounters {
  created: number;
  updated: number;
  skipped: number;
}

@Injectable({
  providedIn: 'root'
})
export class StravaSyncService {
  private readonly toastService: ToastService = inject(ToastService);
  private readonly sportService: SportService = inject(SportService);
  private readonly sportTypeService: SportTypeService = inject(SportTypeService);
  private readonly staminaSessionService: StaminaSessionService = inject(StaminaSessionService);

  public isSyncing: WritableSignal<boolean> = signal(false);

  public async loginToStrava(): Promise<void> {
    const clientId: string | undefined = environment.strava.clientId?.trim();
    const redirectUrl: string | undefined = environment.redirectUrl?.trim();
    const stravaAuthUrl: string | undefined = environment.strava.authUrl?.trim();

    if (!clientId || !redirectUrl) {
      await this.toastService.showError("Il faut renseigner le client ID et le redirect URI pour Strava.");
      return;
    }

    const authUrl: string = `${stravaAuthUrl}?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=activity:read_all`;
    window.open(authUrl, '_blank');

    await this.toastService.showSuccess("Une nouvelle fenetre s'est ouverte pour se connecter a Strava. Apres connexion, revenez sur l'application pour synchroniser vos activites.");
  }

  public async syncActivities(): Promise<void> {
    if (this.isSyncing()) {
      return;
    }

    const accessToken: string | undefined = environment.strava.refreshToken?.trim();
    if (!accessToken) {
      await this.toastService.showError("Il faut renseigner le token d'acces Strava.");
      return;
    }

    this.isSyncing.set(true);

    try {
      const [activities, existingSessions] = await Promise.all([
        this.fetchActivities(accessToken),
        this.staminaSessionService.fetchStaminaSessionsChunk()
      ]);

      const counters: SyncCounters = {
        created: 0,
        updated: 0,
        skipped: 0
      };

      for (const activity of activities) {
        const target: SyncTarget | null = await this.resolveTarget(activity);
        if (!target) {
          counters.skipped++;
          continue;
        }

        const sessionDate: string | null = this.getSessionDate(activity);
        if (!sessionDate) {
          counters.skipped++;
          continue;
        }

        const matchingSessions = existingSessions.filter((session) =>
          session.date === sessionDate &&
          session.sport?.id === target.sport.id &&
          session.sportType?.id === target.sportType.id
        );

        const existingRealised = matchingSessions.find((session) => session.realised);
        if (existingRealised) {
          counters.skipped++;
          continue;
        }

        const pendingSession = matchingSessions.find((session) => !session.realised);
        if (pendingSession) {
          const updated: boolean = await this.updatePendingSession(pendingSession, activity);
          counters.updated += updated ? 1 : 0;
          counters.skipped += updated ? 0 : 1;
          if (updated) {
            const index = existingSessions.findIndex((session) => session.id === pendingSession.id);
            if (index >= 0) {
              existingSessions[index] = {
                ...existingSessions[index],
                realised: true,
                realTime: this.getRealTime(activity),
                realKilometers: this.getRealKilometers(activity),
                realDifficulty: 0,
                realWarmupTime: 0,
                realWarmupKilometers: 0,
                label: existingSessions[index].label || activity.name || null
              };
            }
          }
          continue;
        }

        const created: boolean = await this.createSessionFromActivity(activity, target, sessionDate);
        counters.created += created ? 1 : 0;
        counters.skipped += created ? 0 : 1;
      }

      await this.staminaSessionService.fetchStaminaSessions();
      await this.showSummary(counters);
    } catch (_) {
      await this.toastService.showError("Impossible de recuperer les donnees Strava");
    } finally {
      this.isSyncing.set(false);
    }
  }

  private async fetchActivities(accessToken: string): Promise<StravaActivity[]> {
    const activities: StravaActivity[] = [];
    const perPage: number = environment.strava.perPage || 100;
    const baseUrl: string = environment.strava.baseUrl || 'https://www.strava.com/api/v3';

    for (let page = 1; page <= 50; page++) {
      const response: Response = await fetch(`${baseUrl}/athlete/activities?per_page=${perPage}&page=${page}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`strava_${response.status}`);
      }

      const pageActivities: StravaActivity[] = await response.json() as StravaActivity[];
      if (!pageActivities.length) {
        break;
      }

      activities.push(...pageActivities);
      if (pageActivities.length < perPage) {
        break;
      }
    }

    return activities;
  }

  private async resolveTarget(activity: StravaActivity): Promise<SyncTarget | null> {
    const activityType: string = activity.sport_type || activity.type || '';
    const normalizedType: string = activityType.toLowerCase();

    if (normalizedType.includes('run') || normalizedType === 'walk' || normalizedType === 'hike') {
      const sport: Sport | null = await this.findSportByName('Course');
      const sportType: SportType | null = await this.findSportTypeByName('Endurance');
      return sport && sportType ? {sport, sportType} : null;
    }

    if (normalizedType.includes('ride') || normalizedType.includes('bike') || normalizedType.includes('cycling')) {
      const sport: Sport | null  = await this.findSportByName('Velo');
      const sportType: SportType | null = await this.findSportTypeByName('VTT');
      return sport && sportType ? {sport, sportType} : null;
    }

    return null;
  }

  private async findSportByName(name: string): Promise<Sport | null> {
    const sports = await this.sportService.fetchSports();
    return sports.find((sport) => sport.name.toLowerCase() === name.toLowerCase()) ?? null;
  }

  private async findSportTypeByName(name: string): Promise<SportType | null> {
    const sportTypes = await this.sportTypeService.fetchSportTypes();
    return sportTypes.find((sportType) => sportType.name.toLowerCase() === name.toLowerCase()) ?? null;
  }

  private getSessionDate(activity: StravaActivity): string | null {
    return activity.start_date_local?.split('T')[0] ?? null;
  }

  private getRealTime(activity: StravaActivity): number {
    return Math.max(0, Math.round((activity.elapsed_time ?? 0) / 60));
  }

  private getRealKilometers(activity: StravaActivity): number {
    return Math.max(0, Number(((activity.distance ?? 0) / 1000).toFixed(2)));
  }

  private async createSessionFromActivity(
    activity: StravaActivity,
    target: SyncTarget,
    sessionDate: string
  ): Promise<boolean> {
    const sessionBody: StaminaSessionForm = {
      label: activity.name?.trim() || null,
      realTime: this.getRealTime(activity),
      realDifficulty: 0,
      realKilometers: this.getRealKilometers(activity),
      predictedTime: null,
      predictedDifficulty: null,
      predictedKilometers: null,
      predictedWarmupTime: 0,
      predictedWarmupKilometers: 0,
      realWarmupTime: 0,
      realWarmupKilometers: 0,
      weatherCondition: null,
      date: sessionDate,
      realised: true,
      program: null,
      staminaTraining: null,
      sport: target.sport.id,
      sportType: target.sportType.id
    };

    const createdId: number | null = await this.staminaSessionService.insertStaminaSession(sessionBody);
    return Boolean(createdId);
  }

  private async updatePendingSession(session: StaminaSession, activity: StravaActivity): Promise<boolean> {
    const sessionBody: StaminaSessionForm = {
      label: session.label || activity.name || null,
      realTime: this.getRealTime(activity),
      realDifficulty: 0,
      realKilometers: this.getRealKilometers(activity),
      predictedTime: session.predictedTime ?? null,
      predictedDifficulty: session.predictedDifficulty ?? null,
      predictedKilometers: session.predictedKilometers ?? null,
      predictedWarmupTime: session.predictedWarmupTime ?? 0,
      predictedWarmupKilometers: session.predictedWarmupKilometers ?? 0,
      realWarmupTime: 0,
      realWarmupKilometers: 0,
      weatherCondition: session.weatherCondition ?? null,
      date: session.date,
      realised: true,
      program: session.program?.id ?? null,
      staminaTraining: session.staminaTraining?.id ?? null,
      sport: session.sport?.id ?? null,
      sportType: session.sportType?.id ?? null
    };

    if (!sessionBody.sport || !sessionBody.sportType) {
      return false;
    }

    return this.staminaSessionService.updateStaminaSession(session.id, sessionBody);
  }

  private async showSummary(counters: SyncCounters): Promise<void> {
    if (!counters.created && !counters.updated) {
      await this.toastService.showSuccess("Aucune nouvelle seance Strava a importer");
      return;
    }

    const parts: string[] = [
      `${counters.created} creee${counters.created > 1 ? 's' : ''}`,
      `${counters.updated} mise${counters.updated > 1 ? 's' : ''} a jour`
    ];

    if (counters.skipped) {
      parts.push(`${counters.skipped} ignoree${counters.skipped > 1 ? 's' : ''}`);
    }

    await this.toastService.showSuccess(`Synchronisation Strava: ${parts.join(', ')}`, 3000);
  }
}
