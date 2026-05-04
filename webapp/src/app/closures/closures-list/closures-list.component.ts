import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AccountService } from '../../core/services/account.service';
import { ClosureService } from '../../core/services/closure.service';
import { Account } from '../../core/models/account.model';
import { Closure } from '../../core/models/closure.model';

interface AccountClosureRow {
  account: Account;
  closure?: Closure;
}

type ModalMode = 'create' | 'edit';

@Component({
  selector: 'app-closures-list',
  templateUrl: './closures-list.component.html',
  styleUrls: ['./closures-list.component.less'],
})
export class ClosuresListComponent implements OnInit {
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

  selectedYear: number;
  selectedMonth: number;

  rows: AccountClosureRow[] = [];
  loading = true;
  error: string | null = null;

  modalRow: AccountClosureRow | null = null;
  modalMode: ModalMode = 'create';
  formAmount: number | null = null;
  formNote = '';
  saving = false;
  saveError: string | null = null;

  deleteRow: AccountClosureRow | null = null;
  deleting = false;
  deleteError: string | null = null;

  constructor(
    private readonly accountService: AccountService,
    private readonly closureService: ClosureService,
  ) {
    const now = new Date();
    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    this.selectedYear = previous.getFullYear();
    this.selectedMonth = previous.getMonth() + 1;

    const currentYear = now.getFullYear();
    this.years = [];
    for (let y = currentYear; y >= currentYear - 5; y--) {
      this.years.push(y);
    }
  }

  ngOnInit(): void {
    this.loadData();
  }

  onPeriodChange(): void {
    this.loadData();
  }

  trackByAccountId(_: number, row: AccountClosureRow): number {
    return row.account.id;
  }

  get closedCount(): number {
    return this.rows.filter(r => r.closure).length;
  }

  openCreateModal(row: AccountClosureRow): void {
    this.modalMode = 'create';
    this.modalRow = row;
    this.formAmount = null;
    this.formNote = '';
    this.saveError = null;
  }

  openEditModal(row: AccountClosureRow): void {
    this.modalMode = 'edit';
    this.modalRow = row;
    this.formAmount = row.closure!.amount;
    this.formNote = row.closure!.note ?? '';
    this.saveError = null;
  }

  closeModal(): void {
    if (this.saving) return;
    this.modalRow = null;
  }

  submitClosure(): void {
    if (!this.modalRow || this.formAmount === null) return;

    this.saving = true;
    this.saveError = null;

    const request$ =
      this.modalMode === 'create'
        ? this.closureService.createClosure(this.modalRow.account.id, {
            year: this.selectedYear,
            month: this.selectedMonth,
            amount: this.formAmount,
            note: this.formNote.trim() || undefined,
          })
        : this.closureService.updateClosure(this.modalRow.closure!.id, {
            amount: this.formAmount,
            note: this.formNote.trim() || null,
          });

    request$.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.modalRow = null;
        this.loadData();
      },
      error: () => {
        this.saveError =
          this.modalMode === 'create'
            ? 'Impossibile salvare la chiusura. Riprova più tardi.'
            : 'Impossibile aggiornare la chiusura. Riprova più tardi.';
      },
    });
  }

  openDeleteConfirm(row: AccountClosureRow): void {
    this.deleteRow = row;
    this.deleteError = null;
  }

  closeDeleteConfirm(): void {
    if (this.deleting) return;
    this.deleteRow = null;
  }

  confirmDelete(): void {
    if (!this.deleteRow?.closure) return;

    this.deleting = true;
    this.deleteError = null;

    this.closureService
      .deleteClosure(this.deleteRow.closure.id)
      .pipe(finalize(() => (this.deleting = false)))
      .subscribe({
        next: () => {
          this.deleteRow = null;
          this.loadData();
        },
        error: () => {
          this.deleteError =
            'Impossibile eliminare la chiusura. Riprova più tardi.';
        },
      });
  }

  private loadData(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      accounts: this.accountService.getAccounts(),
      closures: this.closureService.getClosures(
        this.selectedYear,
        this.selectedMonth,
      ),
    })
      .pipe(
        catchError(() => {
          this.error = 'Impossibile caricare le chiusure. Riprova più tardi.';
          return of({ accounts: [] as Account[], closures: [] as Closure[] });
        }),
        finalize(() => (this.loading = false)),
      )
      .subscribe(({ accounts, closures }) => {
        const closureByAccount = new Map<number, Closure>();
        closures.forEach(c => closureByAccount.set(c.accountId, c));
        this.rows = accounts.map(account => ({
          account,
          closure: closureByAccount.get(account.id),
        }));
      });
  }
}
