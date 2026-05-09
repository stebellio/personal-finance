import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GoalsListComponent } from './goals-list/goals-list.component';

const routes: Routes = [{ path: '', component: GoalsListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GoalsRoutingModule {}
