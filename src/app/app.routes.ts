import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home/sessions',
    pathMatch: 'full',
  },
  {
    path: '',
    loadComponent: () => import('./layout-component/layout-component.component').then(m => m.LayoutComponentComponent),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then(m => m.HomePage),
        children: [
          {
            path: '',
            redirectTo: 'sessions',
            pathMatch: 'full',
          },
          {
            path: 'sessions',
            loadComponent: () => import('./pages/sessions/sessions.component').then(m => m.SessionsComponent),
          },
          {
            path: 'dashboard',
            loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
          },
          {
            path: 'programs',
            loadComponent: () => import('./pages/programs/programs.component').then(m => m.ProgramsComponent),
          },
        ],
      },
    ],
  },
];
