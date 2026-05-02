import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountsRoutingModule } from './accounts-routing.module';
import { AccountsListComponent } from './accounts-list/accounts-list.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [AccountsListComponent],
  imports: [CommonModule, FormsModule, AccountsRoutingModule, SharedModule],
})
export class AccountsModule {}
