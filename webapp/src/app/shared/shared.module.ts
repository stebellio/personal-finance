import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountIconComponent } from './components/account-icon/account-icon.component';

@NgModule({
  declarations: [AccountIconComponent],
  imports: [CommonModule],
  exports: [AccountIconComponent],
})
export class SharedModule {}
