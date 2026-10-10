import { Injectable, computed, effect, signal } from '@angular/core';
import { Transaction, TxKind } from './models';
import { load, save, uid } from './storage';

const START_BALANCE = 100;

interface WalletState {
  balance: number;
  transactions: Transaction[];
}

const fresh = (): WalletState => ({
  balance: START_BALANCE,
  transactions: [{ id: uid(), at: Date.now(), kind: 'deposit', amount: START_BALANCE, balance: START_BALANCE, note: 'demo' }],
});

/** Virtual balance with a full ledger; every movement is a transaction. */
@Injectable()
export class WalletStore {
  private readonly state = signal<WalletState>(
    load<WalletState>('wallet', fresh(), (v) => typeof (v as WalletState)?.balance === 'number'),
  );

  readonly balance = computed(() => this.state().balance);
  readonly transactions = computed(() => this.state().transactions);

  constructor() {
    effect(() => save('wallet', this.state()));
  }

  /** Apply a signed movement. Returns false (and changes nothing) if it would overdraw. */
  apply(kind: TxKind, amount: number, note?: string): boolean {
    const value = Math.round(amount * 100) / 100;
    const { balance, transactions } = this.state();
    const next = Math.round((balance + value) * 100) / 100;
    if (next < 0) return false;
    this.state.set({
      balance: next,
      transactions: [{ id: uid(), at: Date.now(), kind, amount: value, balance: next, note }, ...transactions].slice(0, 200),
    });
    return true;
  }

  reset(): void {
    this.state.set(fresh());
  }
}
