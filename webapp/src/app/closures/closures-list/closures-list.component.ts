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
