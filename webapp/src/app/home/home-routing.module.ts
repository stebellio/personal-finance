import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {HomeComponent} from "./home/home.component";
import {authGuard} from "../auth/auth.guard";

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    canActivate: [authGuard]
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule { }
