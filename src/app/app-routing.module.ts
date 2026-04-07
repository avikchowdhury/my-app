import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';
import { AppShellComponent } from './layout/app-shell.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'expense-tracker-login',
    pathMatch: 'full',
    redirectTo: 'auth/login',
  },
  { path: 'register', pathMatch: 'full', redirectTo: 'auth/register' },
  {
    path: 'auth',
    canActivate: [GuestGuard],
    loadChildren: () =>
      import('./features/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.module').then(
            (m) => m.DashboardModule,
          ),
      },
      {
        path: 'receipts',
        loadChildren: () =>
          import('./features/receipts/receipts.module').then(
            (m) => m.ReceiptsModule,
          ),
      },
      {
        path: 'budgets',
        loadChildren: () =>
          import('./features/budgets/budgets.module').then(
            (m) => m.BudgetsModule,
          ),
      },
      {
        path: 'categories',
        loadChildren: () =>
          import('./features/categories/categories.module').then(
            (m) => m.CategoriesModule,
          ),
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('./features/profile/profile.module').then(
            (m) => m.ProfileModule,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
