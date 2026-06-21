import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexStroke,
  ApexFill, ApexTooltip, ApexGrid, ApexYAxis, ApexDataLabels, ApexMarkers,
  ApexPlotOptions, ApexLegend } from 'ng-apexcharts';
import { AuthService } from '../../auth/auth.service';
import { AccountService } from '../../core/services/account.service';
import { Account } from '../../core/models/account.model';
import { Period } from "../../core/enum/period.enum";
import { AnalyticService } from "../../core/services/analytic.service";
import { NetWorthPoint } from "../../core/models/netWorthPoint.model";
import { NetWorthProjection } from "../../core/models/netWorthProjection.model";
import { PropertyService } from '../../core/services/property.service';
import { PropertySummary } from '../../core/models/property.model';
import { ExpenseCategory } from '../../core/models/expenseCategory.model';

export type DashboardMode = 'financial' | 'real-estate' | 'both';
const DASHBOARD_MODE_KEY = 'dashboard-mode';
const VALID_MODES: DashboardMode[] = ['financial', 'real-estate', 'both'];

export interface AllocationItem {
  name: string;
  balance: number;
  pct: number;
  color: string;
  isLiability: boolean;
}

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
  legend: ApexLegend;
};

export type ExpenseBarOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  colors: string[];
  tooltip: ApexTooltip;
  legend: ApexLegend;
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
  netWorthProjection: NetWorthProjection | null = null;
  chartOptions: ChartOptions = this.buildChartOptions([], [], null);

  expensesByCategory: ExpenseCategory[] = [];
  loadingExpenses = false;
  expenseBarOptions: ExpenseBarOptions = this.buildExpenseBarOptions([]);

  readonly assetColors = ['#6366f1', '#764ba2', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#06b6d4', '#f97316'];
  readonly liabilityColors = ['#ef4444', '#f87171', '#fca5a5'];

  donutChartOptions: DonutChartOptions = this.buildDonutOptions([]);
  donutTypeChartOptions: DonutChartOptions = this.buildDonutOptions([]);

  readonly modes: { label: string; value: DashboardMode }[] = [
    { label: 'Finanziario', value: 'financial' },
    { label: 'Immobiliare', value: 'real-estate' },
    { label: 'Entrambi', value: 'both' },
  ];

  selectedMode: DashboardMode = (() => {
    const stored = localStorage.getItem(DASHBOARD_MODE_KEY) as DashboardMode;
    return VALID_MODES.includes(stored) ? stored : 'financial';
  })();

  propertySummary: PropertySummary | null = null;
  realEstateDonutOptions: DonutChartOptions = this.buildDonutOptions([]);

  constructor(
      private readonly authService: AuthService,
      private readonly accountService: AccountService,
      private readonly analyticsService: AnalyticService,
      private readonly propertyService: PropertyService,
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
    this.loadNetWorthHistory();
    this.loadExpensesByCategory();
    this.loadPropertySummary();
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

  get showFinancial(): boolean {
    return this.selectedMode !== 'real-estate';
  }

  get showRealEstate(): boolean {
    return this.selectedMode !== 'financial';
  }

  get realEstateTotal(): number {
    return this.propertySummary?.total ?? 0;
  }

  get combinedNetWorth(): number {
    return (this.currentNetWorth ?? 0) + this.realEstateTotal;
  }

  get realEstateAllocationItems(): AllocationItem[] {
    if (!this.propertySummary) return [];
    const items = this.propertySummary.byType.map(bt => ({
      label: bt.type === 'building' ? 'Immobili' : 'Terreni',
      balance: bt.total,
      isLiability: false,
    }));
    return this.toAllocationItems(items);
  }

  get hasAllocationData(): boolean {
    return this.accounts.some(a => (a.balance ?? 0) > 0) ||
           this.accounts.some(a => (a.balance ?? 0) < 0 && a.type === 'debit');
  }

  get allocationItems(): AllocationItem[] {
    const assets = this.accounts
      .filter(a => (a.balance ?? 0) > 0)
      .map(a => ({ label: a.name, balance: a.balance ?? 0, isLiability: false }));
    const liabilities = this.accounts
      .filter(a => (a.balance ?? 0) < 0 && a.type === 'debit')
      .map(a => ({ label: a.name, balance: Math.abs(a.balance ?? 0), isLiability: true }));
    return this.toAllocationItems([...assets, ...liabilities]);
  }

  get allocationTypeItems(): AllocationItem[] {
    return this.toAllocationItems(this.groupByType(this.accounts));
  }

  private toAllocationItems(
    items: { label: string; balance: number; isLiability?: boolean }[]
  ): AllocationItem[] {
    const total = items.reduce((s, i) => s + i.balance, 0);
    if (total === 0) return [];
    let assetIdx = 0;
    let liabilityIdx = 0;
    return items.map(i => {
      const isLiability = i.isLiability ?? false;
      const color = isLiability
        ? this.liabilityColors[liabilityIdx++ % this.liabilityColors.length]
        : this.assetColors[assetIdx++ % this.assetColors.length];
      return { name: i.label, balance: i.balance, pct: (i.balance / total) * 100, color, isLiability };
    });
  }

  private groupByType(accounts: Account[]): { label: string; balance: number; isLiability?: boolean }[] {
    const labels: Record<string, string> = { checking: 'Conto corrente', saving: 'Risparmio', investment: 'Investimento', debit: 'Debito' };
    const assetMap = new Map<string, number>();
    let liabilityTotal = 0;

    for (const a of accounts) {
      const balance = a.balance ?? 0;
      if (balance === 0) continue;
      if (balance > 0) {
        const key = a.type ?? 'checking';
        assetMap.set(key, (assetMap.get(key) ?? 0) + balance);
      } else if (a.type === 'debit') {
        liabilityTotal += Math.abs(balance);
      }
    }

    const result: { label: string; balance: number; isLiability?: boolean }[] = [];
    for (const [type, balance] of assetMap) {
      result.push({ label: labels[type] ?? type, balance });
    }
    if (liabilityTotal > 0) {
      result.push({ label: 'Passività', balance: liabilityTotal, isLiability: true });
    }
    return result;
  }

  onPeriodChange(period: Period): void {
    if (this.selectedPeriod === period) return;
    this.selectedPeriod = period;
    this.loadNetWorthHistory();
    this.loadExpensesByCategory();
  }

  onModeChange(mode: DashboardMode): void {
    if (this.selectedMode === mode) return;
    this.selectedMode = mode;
    localStorage.setItem(DASHBOARD_MODE_KEY, mode);
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
      this.donutChartOptions = this.buildDonutOptions(this.allocationItems);
      this.donutTypeChartOptions = this.buildDonutOptions(this.allocationTypeItems);
    });
  }

  private loadPropertySummary(): void {
    this.propertyService.getSummary().pipe(
      catchError(() => of<PropertySummary>({ total: 0, count: 0, byType: [] }))
    ).subscribe(summary => {
      this.propertySummary = summary;
      this.realEstateDonutOptions = this.buildDonutOptions(this.realEstateAllocationItems);
    });
  }

  private loadNetWorthHistory(): void {
    this.loadingChart = true;

    forkJoin({
      history: this.analyticsService.getNetWorthHistory(this.selectedPeriod).pipe(
        catchError(() => of<NetWorthPoint[]>([]))
      ),
      projection: this.analyticsService.getNetWorthProjection(),
    }).pipe(
      finalize(() => (this.loadingChart = false)),
    ).subscribe(({ history, projection }) => {
      this.netWorthData = history;
      this.netWorthProjection = projection;
      this.chartOptions = this.buildChartOptions(
        history.map(p => p.label),
        history.map(p => p.amount),
        projection,
      );
    });
  }

  private loadExpensesByCategory(): void {
    this.loadingExpenses = true;

    this.analyticsService.getExpensesByCategory(this.selectedPeriod).pipe(
      catchError(() => of<ExpenseCategory[]>([])),
      finalize(() => (this.loadingExpenses = false)),
    ).subscribe(categories => {
      this.expensesByCategory = categories;
      this.expenseBarOptions = this.buildExpenseBarOptions(categories);
    });
  }

  private buildExpenseBarOptions(categories: ExpenseCategory[]): ExpenseBarOptions {
    const sorted = [...categories].sort((a, b) => b.total - a.total);

    return {
      series: [{ name: 'Spese', data: sorted.map(c => c.total) }],
      chart: {
        type: 'bar',
        height: Math.max(220, sorted.length * 44),
        toolbar: { show: false },
        zoom: { enabled: false },
        background: 'transparent',
        fontFamily: 'inherit',
        animations: { enabled: true, speed: 500 },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '70%',
          borderRadius: 6,
          borderRadiusApplication: 'end',
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) =>
          `€ ${val.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        style: { fontSize: '12px', fontWeight: 600, colors: ['#ffffff'] },
        offsetX: 6,
      },
      colors: ['#6366f1'],
      xaxis: {
        categories: sorted.map(c => c.categoryDescription),
        labels: {
          style: { colors: '#9ca3af', fontSize: '12px', fontWeight: 500 },
          formatter: (val: string | number) => this.formatCompact(Number(val)),
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { colors: '#6b7280', fontSize: '12px', fontWeight: 500 },
        },
      },
      grid: {
        show: true,
        borderColor: '#eef0f7',
        strokeDashArray: 4,
        position: 'back',
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } },
        padding: { left: 8, right: 8, top: 0, bottom: 0 },
      },
      tooltip: {
        theme: 'light',
        style: { fontSize: '13px', fontFamily: 'inherit' },
        x: { show: true },
        y: {
          formatter: (val: number) =>
            `€ ${val.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        },
        marker: { show: false },
      },
      legend: { show: false },
    };
  }

  private buildDonutOptions(items: { name: string; balance: number; color: string }[]): DonutChartOptions {
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
      labels: items.map(i => i.name),
      colors: items.map(i => i.color),
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

  private buildChartOptions(
    labels: string[],
    values: (number | null)[],
    projection: NetWorthProjection | null,
  ): ChartOptions {
    const hasProjection = projection !== null && values.some(v => v !== null);

    const allLabels = hasProjection ? [...labels, projection!.label] : labels;
    const historicalValues = hasProjection ? [...values, null] : values;

    const projectionValues: (number | null)[] = hasProjection
      ? new Array(allLabels.length).fill(null)
      : [];

    if (hasProjection) {
      let lastNonNullIdx = -1;
      for (let i = values.length - 1; i >= 0; i--) {
        if (values[i] !== null) { lastNonNullIdx = i; break; }
      }
      if (lastNonNullIdx !== -1) {
        projectionValues[lastNonNullIdx] = values[lastNonNullIdx];
        projectionValues[allLabels.length - 1] = projection!.amount;
      }
    }

    const series: ApexAxisChartSeries = [
      { name: 'Patrimonio', type: 'area', data: historicalValues as number[] },
      ...(hasProjection ? [{ name: 'Proiezione', type: 'line', data: projectionValues as number[] }] : []),
    ];

    return {
      series,
      chart: {
        type: 'line',
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
      colors: hasProjection ? ['#6366f1', '#a78bfa'] : ['#6366f1'],
      stroke: {
        curve: 'smooth',
        width: hasProjection ? [3, 3] : [3],
        lineCap: 'round',
        dashArray: hasProjection ? [0, 4] : [0],
      },
      dataLabels: { enabled: false },
      markers: {
        size: hasProjection ? [0, 5] : [0],
        colors: hasProjection ? ['#6366f1', '#a78bfa'] : ['#6366f1'],
        strokeColors: '#ffffff',
        strokeWidth: 2,
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
        categories: allLabels,
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
      legend: {
        show: hasProjection,
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '12px',
        fontFamily: 'inherit',
        fontWeight: 500,
        labels: { colors: '#6b7280' },
        markers: { width: 8, height: 8, radius: 4, offsetX: -2 },
        itemMargin: { horizontal: 12, vertical: 0 },
        onItemClick: { toggleDataSeries: false },
        onItemHover: { highlightDataSeries: false },
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
