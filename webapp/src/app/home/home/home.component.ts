import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexStroke,
  ApexFill, ApexTooltip, ApexGrid, ApexYAxis } from 'ng-apexcharts';
import { AuthService } from '../../auth/auth.service';
import { AccountService } from '../../core/services/account.service';
import { Account } from '../../core/models/account.model';
import {Period} from "../../core/enum/period.enum";
import {AnalyticService} from "../../core/services/analytic.service";
import {NetWorthPoint} from "../../core/models/netWorthPoint.model";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  fill: ApexFill;
  tooltip: ApexTooltip;
  grid: ApexGrid;
  colors: string[];
};

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less'],
})
export class HomeComponent implements OnInit {
  accounts: Account[] = [];
  loading = true;
  loadingChart = false;
  error: string | null = null;

  readonly periods = [
    { label: '3M', value: Period.TRIMESTRAL },
    { label: '6M', value: Period.SEMESTRAL },
    { label: '1A', value: Period.YEARLY },
  ];
  selectedPeriod: Period = Period.TRIMESTRAL;

  chartOptions: ChartOptions = this.buildChartOptions([], []);

  constructor(
      private readonly authService: AuthService,
      private readonly accountService: AccountService,
      private readonly analyticsService: AnalyticService,
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
    this.loadNetWorthHistory();
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

  onPeriodChange(period: Period): void {
    this.selectedPeriod = period;
    this.loadNetWorthHistory();
  }

  private loadAccounts(): void {
    this.loading = true;
    this.error = null;

    this.accountService.getAccounts().pipe(
        catchError(() => {
          this.error = 'Impossibile caricare i conti. Riprova più tardi.';
          return of<Account[]>([]);
        }),
        finalize(() => (this.loading = false)),
    ).subscribe(accounts => (this.accounts = accounts));
  }

  private loadNetWorthHistory(): void {
    this.loadingChart = true;

    this.analyticsService.getNetWorthHistory(this.selectedPeriod).pipe(
        catchError(() => of<NetWorthPoint[]>([])),
        finalize(() => (this.loadingChart = false)),
    ).subscribe(data => {
      const labels = data.map(p => p.label);
      const values = data.map(p => p.amount);
      this.chartOptions = this.buildChartOptions(labels, values);
    });
  }

  private buildChartOptions(labels: string[], values: (number | null)[]): ChartOptions {
    return {
      series: [{ name: 'Net Worth', data: values as number[] }],
      chart: {
        type: 'area',
        height: 280,
        toolbar: { show: false },
        background: 'transparent',
        animations: { enabled: true, speed: 400 },
      },
      colors: ['#7C3AED'],
      stroke: { curve: 'smooth', width: 2 },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.0,
          stops: [0, 100],
        },
      },
      xaxis: {
        categories: labels,
        labels: { style: { colors: '#9CA3AF' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { colors: '#9CA3AF' },
          formatter: (val) => `€${val.toLocaleString('it-IT')}`,
        },
      },
      grid: { show: false },
      tooltip: {
        theme: 'dark',
        y: { formatter: (val) => `€${val.toLocaleString('it-IT')}` },
      },
    };
  }
}