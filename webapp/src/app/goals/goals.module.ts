import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoalsRoutingModule } from './goals-routing.module';
import { GoalsListComponent } from './goals-list/goals-list.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [GoalsListComponent],
  imports: [CommonModule, FormsModule, GoalsRoutingModule, SharedModule],
})
export class GoalsModule {}
