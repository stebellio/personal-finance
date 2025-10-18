import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LoginComponent} from "./login/login.component";
import {RegisterComponent} from "./register/register.component";
import {noAuthGuard} from "./no-auth.guard";

const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [noAuthGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [noAuthGuard] },
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
