import { Routes } from '@angular/router';
import { ShellComponent } from './shell/shell.component';

export const KICKOFF_ROUTES: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/lobby/lobby.component').then((m) => m.LobbyComponent),
        title: 'Kickoff — live football betting (demo)',
      },
      {
        path: 'match/:id',
        loadComponent: () => import('./pages/match/match.component').then((m) => m.MatchComponent),
        title: 'Match — Kickoff',
      },
      {
        path: 'bets',
        loadComponent: () => import('./pages/bets/bets.component').then((m) => m.BetsComponent),
        title: 'My bets — Kickoff',
      },
      {
        path: 'wallet',
        loadComponent: () => import('./pages/wallet/wallet.component').then((m) => m.WalletComponent),
        title: 'Wallet — Kickoff',
      },
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
        title: 'Log in — Kickoff',
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component').then((m) => m.SettingsComponent),
        title: 'Settings — Kickoff',
      },
      { path: '**', redirectTo: '' },
    ],
  },
];
