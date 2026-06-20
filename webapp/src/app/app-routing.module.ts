import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';
import { authGuard } from './auth/auth.guard';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadChildren: () => import('./home/home.module').then(m => m.HomeModule),
      },
      {
        path: 'accounts',
        loadChildren: () =>
          import('./accounts/accounts.module').then(m => m.AccountsModule),
      },
      {
        path: 'closures',
        loadChildren: () =>
          import('./closures/closures.module').then(m => m.ClosuresModule),
      },
      {
        path: 'goals',
        loadChildren: () =>
          import('./goals/goals.module').then(m => m.GoalsModule),
      },
      {
        path: 'expenses',
        loadChildren: () =>
          import('./expenses/expenses.module').then(m => m.ExpensesModule),
      },
      {
        path: 'properties',
        loadChildren: () =>
          import('./properties/properties.module').then(m => m.PropertiesModule),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
