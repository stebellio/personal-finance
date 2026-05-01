import { Component, OnInit } from '@angular/core';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AccountService } from '../../core/services/account.service';
import { Account } from '../../core/models/account.model';
import {ConsoleLogger} from "@angular/compiler-cli";

@Component({
  selector: 'app-accounts-list',
  templateUrl: './accounts-list.component.html',
  styleUrls: ['./accounts-list.component.less'],
})
export class AccountsListComponent implements OnInit {
  accounts: Account[] = [];
  loading = true;
  error: string | null = null;

  // Modal state
  isModalOpen = false;
  newAccount: {
    name: string;
    description: string;
    balance: number;
  } = { name: '', description: '', balance: 0 };
  saving = false;
  saveError: string | null = null;

  constructor(private readonly accountService: AccountService) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  trackById(_: number, account: Account): number {
    return account.id;
  }

  openModal(): void {
    this.newAccount = { name: '', description: '', balance: 0};
    this.saveError = null;
    this.isModalOpen = true;
  }

  closeModal(): void {
    if (this.saving) {
      return;
    }
    this.isModalOpen = false;
  }

  submitNewAccount(): void {
    const name = this.newAccount.name.trim();
    if (!name) {
      this.saveError = 'Il nome è obbligatorio.';
      return;
    }
    const balance = this.newAccount.balance;
    if (balance === undefined || isNaN(balance) || balance < 0) {
      this.saveError = 'Il saldo deve essere un numero valido.';
      return;
    }
    this.saving = true;
    this.saveError = null;
    const description = this.newAccount.description.trim();
    this.accountService
      .createAccount({ name, description: description || undefined, balance: balance || 0 })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.isModalOpen = false;
          this.loadAccounts();
        },
        error: () => {
          this.saveError = 'Impossibile creare il conto. Riprova più tardi.';
        },
      });
  }

  private loadAccounts(): void {
    this.loading = true;
    this.error = null;
    this.accountService
      .getAccounts()
      .pipe(
        catchError(() => {
          this.error = 'Impossibile caricare i conti. Riprova più tardi.';
          return of<Account[]>([]);
        }),
        finalize(() => (this.loading = false)),
      )
      .subscribe(accounts => (this.accounts = accounts));
  }
}
