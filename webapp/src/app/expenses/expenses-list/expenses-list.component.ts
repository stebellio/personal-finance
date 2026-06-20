import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { TransactionService } from '../../core/services/transaction.service';
import { AccountService } from '../../core/services/account.service';
import { Transaction } from '../../core/models/transaction.model';
import { Account } from '../../core/models/account.model';

@Component({
  selector: 'app-expenses-list',
  templateUrl: './expenses-list.component.html',
  styleUrls: ['./expenses-list.component.less'],
})
export class ExpensesListComponent implements OnInit {
  transactions: Transaction[] = [];
  accounts: Account[] = [];
  loading = true;
  error: string | null = null;

  readonly months: { value: number; label: string }[] = [
    { value: 1, label: 'Gennaio' },
    { value: 2, label: 'Febbraio' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Aprile' },
    { value: 5, label: 'Maggio' },
    { value: 6, label: 'Giugno' },
    { value: 7, label: 'Luglio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Settembre' },
    { value: 10, label: 'Ottobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Dicembre' },
  ];
  readonly years: number[];

  selectedMonth: number;
  selectedYear: number;

  isModalOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  editingId: number | null = null;

  formData: { accountId: number | null; amount: number; date: string; note: string } = {
    accountId: null,
    amount: 0,
    date: '',
    note: '',
  };

  saving = false;
  saveError: string | null = null;

  deleteConfirmTransaction: Transaction | null = null;
  deleting = false;
  deleteError: string | null = null;

  constructor(
    private readonly transactionService: TransactionService,
    private readonly accountService: AccountService,
  ) {
    const now = new Date();
    this.selectedYear = now.getFullYear();
    this.selectedMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    this.years = [];
    for (let y = currentYear; y >= currentYear - 5; y--) {
      this.years.push(y);
    }
  }

  ngOnInit(): void {
    this.loadData();
  }

  trackById(_: number, t: Transaction): number {
    return t.id;
  }

  accountName(accountId: number): string {
    return this.accounts.find(a => a.id === accountId)?.name ?? `Conto #${accountId}`;
  }

  isExpense(amount: number): boolean {
    return amount < 0;
  }

  get totalAmount(): number {
    return this.transactions.reduce((sum, t) => sum + t.amount, 0);
  }

  onPeriodChange(): void {
    this.loadTransactions();
  }

  openCreateModal(): void {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.formData = {
      accountId: this.accounts[0]?.id ?? null,
      amount: 0,
      date: `${yyyy}-${mm}-${dd}`,
      note: '',
    };
    this.saveError = null;
    this.modalMode = 'create';
    this.editingId = null;
    this.isModalOpen = true;
  }

  openEditModal(t: Transaction): void {
    this.formData = {
      accountId: t.accountId,
      amount: t.amount,
      date: t.date.substring(0, 10),
      note: t.note ?? '',
    };
    this.saveError = null;
    this.modalMode = 'edit';
    this.editingId = t.id;
    this.isModalOpen = true;
  }

  closeModal(): void {
    if (this.saving) return;
    this.isModalOpen = false;
  }

  openDeleteConfirm(t: Transaction): void {
    this.deleteConfirmTransaction = t;
    this.deleteError = null;
  }

  closeDeleteConfirm(): void {
    if (this.deleting) return;
    this.deleteConfirmTransaction = null;
  }

  confirmDelete(): void {
    if (!this.deleteConfirmTransaction) return;
    this.deleting = true;
    this.deleteError = null;
    this.transactionService
      .deleteTransaction(this.deleteConfirmTransaction.id)
      .pipe(finalize(() => (this.deleting = false)))
      .subscribe({
        next: () => {
          this.deleteConfirmTransaction = null;
          this.loadTransactions();
        },
        error: () => {
          this.deleteError = 'Impossibile eliminare la transazione. Riprova più tardi.';
        },
      });
  }

  submitForm(): void {
    if (!this.formData.accountId) {
      this.saveError = 'Seleziona un conto.';
      return;
    }
    if (!this.formData.date) {
      this.saveError = 'La data è obbligatoria.';
      return;
    }
    if (isNaN(this.formData.amount) || this.formData.amount === 0) {
      this.saveError = "L'importo non può essere zero.";
      return;
    }
    if (this.modalMode === 'create') {
      this.submitCreate();
    } else {
      this.submitEdit();
    }
  }

  private submitCreate(): void {
    this.saving = true;
    this.saveError = null;
    this.transactionService
      .createTransaction({
        accountId: this.formData.accountId!,
        amount: this.formData.amount,
        date: this.formData.date,
        note: this.formData.note.trim() || undefined,
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.isModalOpen = false;
          this.loadTransactions();
        },
        error: () => {
          this.saveError = 'Impossibile creare la transazione. Riprova più tardi.';
        },
      });
  }

  private submitEdit(): void {
    this.saving = true;
    this.saveError = null;
    const note = this.formData.note.trim();
    this.transactionService
      .updateTransaction(this.editingId!, {
        amount: this.formData.amount,
        date: this.formData.date,
        note: note || null,
        accountId: this.formData.accountId!,
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.isModalOpen = false;
          this.loadTransactions();
        },
        error: () => {
          this.saveError = 'Impossibile modificare la transazione. Riprova più tardi.';
        },
      });
  }

  private loadData(): void {
    this.loading = true;
    this.error = null;
    forkJoin({
      accounts: this.accountService.getAccounts().pipe(catchError(() => of<Account[]>([]))),
      transactions: this.transactionService
        .getTransactions(...this.monthRange())
        .pipe(catchError(() => of<Transaction[]>([]))),
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ accounts, transactions }) => {
          this.accounts = accounts;
          this.transactions = transactions;
        },
        error: () => {
          this.error = 'Impossibile caricare i dati. Riprova più tardi.';
        },
      });
  }

  private loadTransactions(): void {
    this.loading = true;
    this.error = null;
    this.transactionService
      .getTransactions(...this.monthRange())
      .pipe(
        catchError(() => {
          this.error = 'Impossibile caricare le transazioni. Riprova più tardi.';
          return of<Transaction[]>([]);
        }),
        finalize(() => (this.loading = false)),
      )
      .subscribe(transactions => (this.transactions = transactions));
  }

  private monthRange(): [Date, Date] {
    const from = new Date(this.selectedYear, this.selectedMonth - 1, 1, 0, 0, 0, 0);
    const to = new Date(this.selectedYear, this.selectedMonth, 0, 23, 59, 59, 999);
    return [from, to];
  }
}
