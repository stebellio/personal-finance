import { Component, Input } from '@angular/core';
import { AccountType } from '../../../core/models/account.model';

@Component({
  selector: 'app-account-icon',
  templateUrl: './account-icon.component.html',
  styleUrls: ['./account-icon.component.less'],
})
export class AccountIconComponent {
  @Input() type: AccountType = 'checking';
}
