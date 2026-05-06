import { Component, OnInit } from '@angular/core';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AccountService } from '../../core/services/account.service';
import { Account, AccountType } from '../../core/models/account.model';

@Component({
  selector: 'app-accounts-list',
  templateUrl: './accounts-list.component.html',
  styleUrls: ['./accounts-list.component.less'],
})
export class AccountsListComponent implements OnInit {
  accounts: Account[] = [];
  loading = true;
  error: string | null = null;

  isModalOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  editingAccountId: number | null = null;

  formData: {
    name: string;
    description: string;
    balance: number;
    type: AccountType;
  } = { name: '', description: '', balance: 0, type: 'checking' };

  saving = false;
  saveError: string | null = null;

  deleteConfirmAccount: Account | null = null;
  deleting = false;
  deleteError: string | null = null;

  readonly accountTypes: { value: AccountType; label: string }[] = [
    { value: 'checking', label: 'Corrente' },
    { value: 'saving', label: 'Risparmio' },
    { value: 'investment', label: 'Investimento' },
    { value: 'debit', label: 'Debito' },
  ];

  constructor(private readonly accountService: AccountService) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  trackById(_: number, account: Account): number {
    return account.id;
  }

  openCreateModal(): void {
    this.formData = { name: '', description: '', balance: 0, type: 'checking' };
    this.saveError = null;
    this.modalMode = 'create';
    this.editingAccountId = null;
    this.isModalOpen = true;
  }

  openEditModal(account: Account): void {
    this.formData = {
      name: account.name,
      description: account.description ?? '',
      balance: account.balance ?? 0,
      type: account.type ?? 'checking',
    };
    this.saveError = null;
    this.modalMode = 'edit';
    this.editingAccountId = account.id;
    this.isModalOpen = true;
  }

  closeModal(): void {
    if (this.saving) return;
    this.isModalOpen = false;
  }

  openDeleteConfirm(account: Account): void {
    this.deleteConfirmAccount = account;
    this.deleteError = null;
  }

  closeDeleteConfirm(): void {
    if (this.deleting) return;
    this.deleteConfirmAccount = null;
  }

  confirmDelete(): void {
    if (!this.deleteConfirmAccount) return;
    this.deleting = true;
    this.deleteError = null;
    this.accountService
      .deleteAccount(this.deleteConfirmAccount.id)
      .pipe(finalize(() => (this.deleting = false)))
      .subscribe({
        next: () => {
          this.deleteConfirmAccount = null;
          this.loadAccounts();
        },
        error: () => {
          this.deleteError = 'Impossibile eliminare il conto. Riprova più tardi.';
        },
      });
  }

  submitForm(): void {
    const name = this.formData.name.trim();
    if (!name) {
      this.saveError = 'Il nome è obbligatorio.';
      return;
    }
    if (this.modalMode === 'create') {
      const balance = this.formData.balance;
      if (balance === undefined || isNaN(balance) || balance < 0) {
        this.saveError = 'Il saldo deve essere un numero valido.';
        return;
      }
      this.submitCreate(name, balance);
    } else {
      this.submitEdit(name);
    }
  }

  private submitCreate(name: string, balance: number): void {
    const description = this.formData.description.trim();
    this.saving = true;
    this.saveError = null;
    this.accountService
      .createAccount({ name, description: description || undefined, balance, type: this.formData.type })
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

  private submitEdit(name: string): void {
    const description = this.formData.description.trim();
    this.saving = true;
    this.saveError = null;
    this.accountService
      .updateAccount(this.editingAccountId!, { name, description: description || undefined, type: this.formData.type })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.isModalOpen = false;
          this.loadAccounts();
        },
        error: () => {
          this.saveError = 'Impossibile modificare il conto. Riprova più tardi.';
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
