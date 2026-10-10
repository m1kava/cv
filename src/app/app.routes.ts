import { Routes } from '@angular/router';
import { MainPageComponent } from './layout/main-page/main-page.component';

export const routes: Routes = [
  {
    path: '',
    component: MainPageComponent,
    title: 'Vladimer Mikava — Software Engineer · Angular Developer',
  },
  {
    path: 'kickoff',
    loadChildren: () => import('./kickoff/kickoff.routes').then((m) => m.KICKOFF_ROUTES),
  },
  {
    path: 'work',
    loadComponent: () => import('./work/index/work-index.component').then((m) => m.WorkIndexComponent),
    title: 'All work — Vladimer Mikava',
  },
  {
    path: 'work/live-odds',
    loadComponent: () => import('./work/live-odds/live-odds.component').then((m) => m.LiveOddsComponent),
    title: 'Live Odds Board — Vladimer Mikava',
  },
  {
    path: 'work/task-board',
    loadComponent: () => import('./work/task-board/task-board.component').then((m) => m.TaskBoardComponent),
    title: 'Signal Task Board — Vladimer Mikava',
  },
  {
    path: 'work/market-chart',
    loadComponent: () => import('./work/market-chart/market-chart.component').then((m) => m.MarketChartComponent),
    title: 'Live Market Chart — Vladimer Mikava',
  },
  {
    // Case studies for client work. Declared after the demo routes so those win.
    path: 'work/:slug',
    loadComponent: () => import('./work/case/case-study.component').then((m) => m.CaseStudyComponent),
    title: 'Case study — Vladimer Mikava',
  },
  { path: '**', redirectTo: '' },
];
