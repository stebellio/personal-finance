import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountsRoutingModule } from './accounts-routing.module';
import { AccountsListComponent } from './accounts-list/accounts-list.component';
@NgModule({
  declarations: [AccountsListComponent],
  imports: [CommonModule, FormsModule, AccountsRoutingModule],
})
export class AccountsModule {}
