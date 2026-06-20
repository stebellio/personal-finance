import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpensesRoutingModule } from './expenses-routing.module';
import { ExpensesListComponent } from './expenses-list/expenses-list.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [ExpensesListComponent],
  imports: [CommonModule, FormsModule, ExpensesRoutingModule, SharedModule],
})
export class ExpensesModule {}
