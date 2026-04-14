import {DOCUMENT, isPlatformBrowser} from '@angular/common';
import {inject, Injectable, PLATFORM_ID, signal} from '@angular/core';
import {Capacitor} from "@capacitor/core";
import {Style, StatusBar} from "@capacitor/status-bar";

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageKey = 'sport-tracker-theme';

  readonly isDark = signal(false);

  initializeTheme(): void {
    const preferredDark = this.getPreferredTheme();
    this.applyTheme(preferredDark);
  }

  toggleTheme(): void {
    this.applyTheme(!this.isDark());
  }

  private applyTheme(isDark: boolean): void {
    this.isDark.set(isDark);

    if (!isPlatformBrowser(this.platformId) || !this.document?.body) {
      return;
    }

    this.document.body.classList.toggle('dark', isDark);
    this.document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    void this.syncSystemBars();

    try {
      localStorage.setItem(this.storageKey, isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage failures in restrictive environments.
    }
  }

  private getPreferredTheme(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      const storedTheme = localStorage.getItem(this.storageKey);
      if (storedTheme === 'dark') {
        return true;
      }
      if (storedTheme === 'light') {
        return false;
      }

      return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    }

    return false;
  }

  async syncSystemBars(): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      return;
    }

    await StatusBar.setOverlaysWebView({overlay: false});
    await StatusBar.setStyle({
      style: this.isDark() ? Style.Dark : Style.Light
    });
    await StatusBar.setBackgroundColor({
      color: this.isDark() ? '#050505' : '#ffffffff'
    });
    await StatusBar.show();
  }
}



