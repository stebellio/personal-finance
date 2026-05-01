import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { AccountService } from '../../core/services/account.service';
import { Account } from '../../core/models/account.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less'],
})
export class HomeComponent implements OnInit {
  accounts: Account[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly accountService: AccountService,
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  get userName(): string {
    return this.authService.user?.email?.split('@')[0] ?? '';
  }

  get totalBalance(): number {
    return this.accounts.reduce((sum, a) => sum + (a.balance ?? 0), 0);
  }

  trackById(_: number, account: Account): number {
    return account.id;
  }

  private loadAccounts(): void {
    this.loading = true;
    this.error = null;

    const accounts$: Observable<Account[]> = this.accountService.getAccounts().pipe(
      catchError(() => {
        this.error = 'Impossibile caricare i conti. Riprova più tardi.';
        return of<Account[]>([]);
      }),
      finalize(() => (this.loading = false)),
    );

    accounts$.subscribe(accounts => (this.accounts = accounts));
  }
}
