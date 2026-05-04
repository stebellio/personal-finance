import { Component, OnInit } from '@angular/core';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexStroke,
  ApexFill, ApexTooltip, ApexGrid, ApexYAxis, ApexDataLabels, ApexMarkers,
  ApexPlotOptions, ApexLegend } from 'ng-apexcharts';
import { AuthService } from '../../auth/auth.service';
import { AccountService } from '../../core/services/account.service';
import { Account } from '../../core/models/account.model';
import {Period} from "../../core/enum/period.enum";
import {AnalyticService} from "../../core/services/analytic.service";
import {NetWorthPoint} from "../../core/models/netWorthPoint.model";

export type DonutChartOptions = {
  series: number[];
  chart: ApexChart;
  labels: string[];
  colors: string[];
  tooltip: ApexTooltip;
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
};

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
  dataLabels: ApexDataLabels;
  markers: ApexMarkers;
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

  netWorthData: NetWorthPoint[] = [];
  chartOptions: ChartOptions = this.buildChartOptions([], []);
  readonly allocationColors = ['#6366f1', '#764ba2', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#06b6d4', '#f97316'];

  donutChartOptions: DonutChartOptions = this.buildDonutOptions([]);
  donutTypeChartOptions: DonutChartOptions = this.buildDonutOptions([]);

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

  get currentNetWorth(): number | null {
    const valid = this.netWorthData.filter(p => p.amount !== null);
    if (!valid.length) return null;
    return valid[valid.length - 1].amount;
  }

  get firstNetWorth(): number | null {
    const valid = this.netWorthData.filter(p => p.amount !== null);
    if (!valid.length) return null;
    return valid[0].amount;
  }

  get netWorthDelta(): number | null {
    const first = this.firstNetWorth;
    const current = this.currentNetWorth;
    if (first === null || current === null) return null;
    return current - first;
  }

  get netWorthDeltaPercent(): number | null {
    const first = this.firstNetWorth;
    const delta = this.netWorthDelta;
    if (first === null || delta === null || first === 0) return null;
    return (delta / Math.abs(first)) * 100;
  }

  get isPositiveTrend(): boolean {
    return (this.netWorthDelta ?? 0) >= 0;
  }

  get hasPositiveAccounts(): boolean {
    return this.accounts.some(a => (a.balance ?? 0) > 0);
  }

  get allocationItems(): { name: string; balance: number; pct: number }[] {
    return this.toAllocationItems(
      this.accounts.filter(a => (a.balance ?? 0) > 0).map(a => ({ label: a.name, balance: a.balance ?? 0 }))
    );
  }

  get allocationTypeItems(): { name: string; balance: number; pct: number }[] {
    return this.toAllocationItems(this.groupByType(this.accounts));
  }

  private toAllocationItems(items: { label: string; balance: number }[]): { name: string; balance: number; pct: number }[] {
    const total = items.reduce((s, i) => s + i.balance, 0);
    if (total === 0) return [];
    return items.map(i => ({ name: i.label, balance: i.balance, pct: (i.balance / total) * 100 }));
  }

  private groupByType(accounts: Account[]): { label: string; balance: number }[] {
    const labels: Record<string, string> = { checking: 'Conto corrente', saving: 'Risparmio', debit: 'Debito' };
    const map = new Map<string, number>();
    for (const a of accounts) {
      if ((a.balance ?? 0) <= 0) continue;
      const key = a.type ?? 'checking';
      map.set(key, (map.get(key) ?? 0) + (a.balance ?? 0));
    }
    return Array.from(map.entries()).map(([type, balance]) => ({ label: labels[type] ?? type, balance }));
  }

  trackById(_: number, account: Account): number {
    return account.id;
  }

  onPeriodChange(period: Period): void {
    if (this.selectedPeriod === period) return;
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
    ).subscribe(accounts => {
      this.accounts = accounts;
      const positive = accounts.filter(a => (a.balance ?? 0) > 0).map(a => ({ label: a.name, balance: a.balance ?? 0 }));
      this.donutChartOptions = this.buildDonutOptions(positive);
      this.donutTypeChartOptions = this.buildDonutOptions(this.groupByType(accounts));
    });
  }

  private loadNetWorthHistory(): void {
    this.loadingChart = true;

    this.analyticsService.getNetWorthHistory(this.selectedPeriod).pipe(
        catchError(() => of<NetWorthPoint[]>([])),
        finalize(() => (this.loadingChart = false)),
    ).subscribe(data => {
      this.netWorthData = data;
      const labels = data.map(p => p.label);
      const values = data.map(p => p.amount);
      this.chartOptions = this.buildChartOptions(labels, values);
    });
  }

  private buildDonutOptions(items: { label: string; balance: number }[]): DonutChartOptions {
    return {
      series: items.map(i => i.balance),
      chart: {
        type: 'donut',
        height: 200,
        background: 'transparent',
        fontFamily: 'inherit',
        animations: { enabled: true, speed: 500 },
        toolbar: { show: false },
      },
      labels: items.map(i => i.label),
      colors: this.allocationColors.slice(0, items.length),
      plotOptions: {
        pie: {
          donut: { size: '70%', labels: { show: false } },
          expandOnClick: false,
        },
      },
      dataLabels: { enabled: false },
      legend: { show: false },
      tooltip: {
        theme: 'light',
        style: { fontSize: '13px', fontFamily: 'inherit' },
        y: {
          formatter: (val: number) =>
            `€ ${val.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        },
      },
    };
  }

  private buildChartOptions(labels: string[], values: (number | null)[]): ChartOptions {
    return {
      series: [{ name: 'Patrimonio', data: values as number[] }],
      chart: {
        type: 'area',
        height: 320,
        toolbar: { show: false },
        zoom: { enabled: false },
        background: 'transparent',
        fontFamily: 'inherit',
        animations: { enabled: true, speed: 500 },
        dropShadow: {
          enabled: true,
          top: 6,
          left: 0,
          blur: 12,
          color: '#6366f1',
          opacity: 0.15,
        },
      },
      colors: ['#6366f1'],
      stroke: { curve: 'smooth', width: 3, lineCap: 'round' },
      dataLabels: { enabled: false },
      markers: {
        size: 0,
        colors: ['#6366f1'],
        strokeColors: '#ffffff',
        strokeWidth: 3,
        hover: { size: 7 },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'vertical',
          shadeIntensity: 0.6,
          gradientToColors: ['#764ba2'],
          inverseColors: false,
          opacityFrom: 0.4,
          opacityTo: 0,
          stops: [0, 100],
        },
      },
      xaxis: {
        categories: labels,
        labels: {
          style: { colors: '#9ca3af', fontSize: '12px', fontWeight: 500 },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
        crosshairs: {
          show: true,
          stroke: { color: '#c7d2fe', width: 1, dashArray: 4 },
        },
        tooltip: { enabled: false },
      },
      yaxis: {
        labels: {
          style: { colors: '#9ca3af', fontSize: '12px', fontWeight: 500 },
          formatter: (val) => this.formatCompact(val),
        },
      },
      grid: {
        show: true,
        borderColor: '#eef0f7',
        strokeDashArray: 4,
        position: 'back',
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { left: 8, right: 8, top: 0, bottom: 0 },
      },
      tooltip: {
        theme: 'light',
        style: { fontSize: '13px', fontFamily: 'inherit' },
        x: { show: true },
        y: {
          formatter: (val) =>
            val == null ? '—' : `€ ${val.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        },
        marker: { show: true },
      },
    };
  }

  private formatCompact(val: number): string {
    if (val == null || isNaN(val)) return '';
    const abs = Math.abs(val);
    if (abs >= 1_000_000) return `€${(val / 1_000_000).toFixed(1).replace('.', ',')}M`;
    if (abs >= 1_000) return `€${(val / 1_000).toFixed(1).replace('.', ',')}k`;
    return `€${val.toFixed(0)}`;
  }
}
