import { Injectable, effect, signal } from '@angular/core';
import { OddsFormat } from './odds';
import { load, save } from './storage';

export type Lang = 'en' | 'ka';
export type AcceptChanges = 'any' | 'higher' | 'none';

interface Settings {
  lang: Lang;
  oddsFormat: OddsFormat;
  acceptChanges: AcceptChanges;
}

const DEFAULTS: Settings = { lang: 'en', oddsFormat: 'decimal', acceptChanges: 'higher' };

@Injectable()
export class SettingsStore {
  private readonly saved = load<Settings>('settings', DEFAULTS, (v) => typeof v === 'object' && v !== null);

  readonly lang = signal<Lang>(this.saved.lang ?? DEFAULTS.lang);
  readonly oddsFormat = signal<OddsFormat>(this.saved.oddsFormat ?? DEFAULTS.oddsFormat);
  readonly acceptChanges = signal<AcceptChanges>(this.saved.acceptChanges ?? DEFAULTS.acceptChanges);

  constructor() {
    effect(() =>
      save('settings', { lang: this.lang(), oddsFormat: this.oddsFormat(), acceptChanges: this.acceptChanges() }),
    );
  }
}
