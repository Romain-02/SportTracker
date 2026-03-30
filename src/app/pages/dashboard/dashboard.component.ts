import {DatePipe, DecimalPipe} from "@angular/common";
import {Component, inject, OnInit, WritableSignal} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {IonicModule} from "@ionic/angular";
import {Program, Programs} from "../../models/Program";
import {Sport, Sports} from "../../models/Sport";
import {SportType, SportTypes} from "../../models/SportType";
import {StaminaSession, StaminaSessions} from "../../models/StaminaSession";
import {ProgramService} from "../../services/database/entities/program/program.service";
import {StaminaSessionService} from "../../services/database/entities/staminaSession/stamina-session.service";
import {SportTypeService} from "../../services/database/entities/sportTypes/sport-types-services";
import {SportService} from "../../services/database/entities/sports/sport.service";

type StatsTab = 'summary' | 'records' | 'distances';
type PresetRange = 'all' | 'week' | 'month' | 'quarter';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    IonicModule,
    FormsModule,
    DatePipe,
    DecimalPipe
  ],
  standalone: true
})
export class DashboardComponent implements OnInit {
  private staminaSessionService = inject(StaminaSessionService);
  private sportService = inject(SportService);
  private sportTypeService = inject(SportTypeService);
  private programService = inject(ProgramService);

  protected statsTab: StatsTab = 'summary';
  protected rangePreset: PresetRange = 'all';
  protected startDate = '';
  protected endDate = '';
  protected selectedSportId: number | null = null;
  protected selectedSportTypeId: number | null = null;
  protected selectedProgramId: number | null = null;

  protected sessions: WritableSignal<StaminaSessions> = this.staminaSessionService.staminaSessions;
  protected sports: WritableSignal<Sports> = this.sportService.sports;
  protected sportTypes: WritableSignal<SportTypes> = this.sportTypeService.sportTypes;
  protected programs: WritableSignal<Programs> = this.programService.programs;

  ngOnInit(): void {
    this.staminaSessionService.fetchStaminaSessions();
    this.sportService.fetchSports();
    this.sportTypeService.fetchSportTypes();
    this.programService.fetchPrograms(true);
  }

  protected get filteredSessions(): StaminaSessions {
    return this.sessions().filter((session) => {
      const sessionDate: Date = new Date(session.date);
      const presetStart: Date | null = this.getPresetStartDate();
      const withinPreset: boolean = !presetStart || sessionDate >= presetStart;
      const withinStart: boolean = !this.startDate || session.date >= this.startDate;
      const withinEnd: boolean = !this.endDate || session.date <= this.endDate;
      const sportMatch: boolean = !this.selectedSportId || session.sport?.id === this.selectedSportId;
      const sportTypeMatch: boolean = !this.selectedSportTypeId || session.sportType?.id === this.selectedSportTypeId;
      const programMatch: boolean = !this.selectedProgramId || session.program?.id === this.selectedProgramId || session.staminaTraining?.program?.id === this.selectedProgramId;

      return withinPreset && withinStart && withinEnd && sportMatch && sportTypeMatch && programMatch;
    });
  }

  protected get totals() {
    const sessions = this.filteredSessions;
    const totalKilometers = sessions.reduce((sum, session) => sum + session.realKilometers, 0);
    const totalMinutes = sessions.reduce((sum, session) => sum + this.getEffectiveTime(session), 0);
    const difficultyAverage = sessions.length
      ? sessions.reduce((sum, session) => sum + session.realDifficulty, 0) / sessions.length
      : 0;

    return {
      totalKilometers,
      totalMinutes,
      difficultyAverage,
      maxKilometers: Math.max(0, ...sessions.map((session) => session.realKilometers)),
      maxMinutes: Math.max(0, ...sessions.map((session) => this.getEffectiveTime(session)))
    };
  }

  protected get chartData() {
    const sessions = this.filteredSessions;
    const maxDistance = Math.max(1, ...sessions.map((session) => session.realKilometers));
    const maxTime = Math.max(1, ...sessions.map((session) => this.getEffectiveTime(session)));

    return sessions
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-8)
      .map((session) => ({
        label: session.date,
        distancePct: (session.realKilometers / maxDistance) * 100,
        timePct: (this.getEffectiveTime(session) / maxTime) * 100,
        difficultyPct: (session.realDifficulty / 10) * 100,
        session
      }));
  }

  protected get chronologicalRecords(): StaminaSessions {
    const ordered = this.filteredSessions.slice().sort((a, b) => a.date.localeCompare(b.date));
    const records: StaminaSessions = [];

    for (const session of ordered) {
      const speed = this.averageSpeed(session);
      const previousComparable = ordered.filter((candidate) =>
        candidate.date < session.date &&
        this.getEffectiveTime(candidate) >= this.getEffectiveTime(session)
      );

      const beaten = previousComparable.some((candidate) => this.averageSpeed(candidate) >= speed);
      if (!beaten) {
        records.push(session);
      }
    }

    return records.sort((a, b) => b.date.localeCompare(a.date));
  }

  protected distanceRecordsForSport(sportId: number, thresholds: number[]) {
    const sessions = this.filteredSessions.filter((session) => session.sport?.id === sportId);
    return thresholds.map((threshold) => {
      const candidates = sessions.filter((session) => session.realKilometers >= threshold);
      const best = candidates.sort((a, b) => this.getEffectiveTime(a) - this.getEffectiveTime(b))[0];
      return {threshold, best};
    });
  }

  protected resetFilters(): void {
    this.rangePreset = 'all';
    this.startDate = '';
    this.endDate = '';
    this.selectedSportId = null;
    this.selectedSportTypeId = null;
    this.selectedProgramId = null;
  }

  private getPresetStartDate(): Date | null {
    const now = new Date();
    if (this.rangePreset === 'week') {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    }
    if (this.rangePreset === 'month') {
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }
    if (this.rangePreset === 'quarter') {
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    }

    return null;
  }

  protected averageSpeed(session: StaminaSession): number {
    const effectiveTime = this.getEffectiveTime(session);
    if (!effectiveTime) {
      return 0;
    }

    return session.realKilometers / (effectiveTime / 60);
  }

  protected getEffectiveTime(session: StaminaSession): number {
    return Math.max((session.realTime ?? 0) - (session.realWarmupTime ?? 0), 0);
  }
}
