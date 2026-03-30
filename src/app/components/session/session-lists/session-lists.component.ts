import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {IonicModule} from "@ionic/angular";
import {SessionCardComponent} from "../session-card/session-card.component";
import {StaminaSession, StaminaSessions} from "../../../models/StaminaSession";

interface SessionGroup {
  label: string;
  sessions: StaminaSessions;
}

@Component({
  selector: 'app-session-lists',
  templateUrl: './session-lists.component.html',
  styleUrls: ['./session-lists.component.scss'],
  imports: [
    SessionCardComponent,
    IonicModule
  ],
  standalone: true
})
export class SessionListsComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('topSentinel')
  private topSentinel?: ElementRef<HTMLDivElement>;

  @ViewChild('bottomSentinel')
  private bottomSentinel?: ElementRef<HTMLDivElement>;

  @Input()
  public staminaSessions: StaminaSessions = [];

  @Input()
  public anchorSessionId: number | null = null;

  @Input()
  public hasPrevious = false;

  @Input()
  public hasNext = false;

  @Input()
  public isLoadingPrevious = false;

  @Input()
  public isLoadingNext = false;

  @Output()
  public openSession = new EventEmitter<number>();

  @Output()
  public editSession = new EventEmitter<number>();

  @Output()
  public loadPrevious = new EventEmitter<void>();

  @Output()
  public loadNext = new EventEmitter<void>();

  private topObserver?: IntersectionObserver;
  private bottomObserver?: IntersectionObserver;
  private hasScrolledToAnchor = false;

  public ngAfterViewInit(): void {
    this.setupObservers();
    this.scrollToAnchorIfNeeded();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['anchorSessionId']) {
      this.hasScrolledToAnchor = false;
    }

    if (changes['staminaSessions'] && !changes['staminaSessions'].firstChange) {
      setTimeout(() => this.scrollToAnchorIfNeeded(), 0);
    }
  }

  public ngOnDestroy(): void {
    this.topObserver?.disconnect();
    this.bottomObserver?.disconnect();
  }

  protected get groupedSessions(): SessionGroup[] {
    const groups = new Map<string, StaminaSessions>();

    for (const session of this.staminaSessions) {
      const label = this.getPeriodLabel(session.date);
      const existing = groups.get(label) ?? [];
      existing.push(session);
      groups.set(label, existing);
    }

    return Array.from(groups.entries()).map(([label, sessions]) => ({
      label,
      sessions
    }));
  }

  protected getSessionAnchorId(sessionId: number): string {
    return `session-anchor-${sessionId}`;
  }

  private setupObservers(): void {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.topObserver?.disconnect();
    this.bottomObserver?.disconnect();

    this.topObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && this.hasPrevious && !this.isLoadingPrevious) {
          this.loadPrevious.emit();
        }
      }
    }, {rootMargin: '300px 0px 0px 0px'});

    this.bottomObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && this.hasNext && !this.isLoadingNext) {
          this.loadNext.emit();
        }
      }
    }, {rootMargin: '0px 0px 300px 0px'});

    if (this.topSentinel?.nativeElement) {
      this.topObserver.observe(this.topSentinel.nativeElement);
    }

    if (this.bottomSentinel?.nativeElement) {
      this.bottomObserver.observe(this.bottomSentinel.nativeElement);
    }
  }

  private scrollToAnchorIfNeeded(): void {
    if (this.hasScrolledToAnchor || !this.anchorSessionId) {
      return;
    }

    const anchor = document.getElementById(this.getSessionAnchorId(this.anchorSessionId));
    if (!anchor) {
      return;
    }

    this.hasScrolledToAnchor = true;
    anchor.scrollIntoView({block: 'start'});
  }

  private getPeriodLabel(dateString: string): string {
    const today = this.startOfDay(new Date());
    const target = this.startOfDay(new Date(`${dateString}T00:00:00`));
    const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
    const currentYear = today.getFullYear();
    const targetYear = target.getFullYear();

    if (diffDays === 0) {
      return "Aujourd'hui";
    }

    if (this.isSameWeek(target, today)) {
      return 'Cette semaine';
    }

    const lastWeekReference = new Date(today);
    lastWeekReference.setDate(today.getDate() - 7);
    if (this.isSameWeek(target, lastWeekReference)) {
      return 'La semaine derniere';
    }

    if (targetYear === currentYear && target.getMonth() === today.getMonth()) {
      return 'Ce mois';
    }

    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    if (targetYear === lastMonth.getFullYear() && target.getMonth() === lastMonth.getMonth()) {
      return 'Le mois dernier';
    }

    if (targetYear === currentYear) {
      return 'Cette annee';
    }

    if (targetYear === currentYear - 1) {
      return "L'annee derniere";
    }

    const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    if (target > nextYear) {
      return "Dans plus d'un an";
    }

    if (targetYear === currentYear + 1) {
      return "L'annee prochaine";
    }

    return "Il y a plus d'un an";
  }

  private isSameWeek(first: Date, second: Date): boolean {
    return this.getWeekStart(first).getTime() === this.getWeekStart(second).getTime();
  }

  private getWeekStart(date: Date): Date {
    const normalized = this.startOfDay(date);
    const day = normalized.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    normalized.setDate(normalized.getDate() + mondayOffset);
    return normalized;
  }

  private startOfDay(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }
}
