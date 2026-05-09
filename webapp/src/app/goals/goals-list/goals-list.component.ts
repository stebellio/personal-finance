import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AccountService } from '../../core/services/account.service';
import { GoalService } from '../../core/services/goal.service';
import { Account } from '../../core/models/account.model';
import { Goal } from '../../core/models/goal.model';

interface GoalRow {
  goal: Goal;
  account: Account | undefined;
  currentAmount: number;
  progressPct: number;
  isCompleted: boolean;
}

type ModalMode = 'create' | 'edit';
type GoalFilter = 'all' | 'active' | 'completed';

@Component({
  selector: 'app-goals-list',
  templateUrl: './goals-list.component.html',
  styleUrls: ['./goals-list.component.less'],
})
export class GoalsListComponent implements OnInit {
  rows: GoalRow[] = [];
  accounts: Account[] = [];
  loading = true;
  error: string | null = null;

  filter: GoalFilter = 'all';
  readonly filters: { value: GoalFilter; label: string }[] = [
    { value: 'all', label: 'Tutti' },
    { value: 'active', label: 'Attivi' },
    { value: 'completed', label: 'Completati' },
  ];

  isModalOpen = false;
  modalMode: ModalMode = 'create';
  editingGoalId: number | null = null;

  formData: {
    accountId: number | null;
    name: string;
    target: number | null;
  } = { accountId: null, name: '', target: null };

  saving = false;
  saveError: string | null = null;

  deleteConfirmRow: GoalRow | null = null;
  deleting = false;
  deleteError: string | null = null;

  constructor(
    private readonly goalService: GoalService,
    private readonly accountService: AccountService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  trackByGoalId(_: number, row: GoalRow): number {
    return row.goal.id;
  }

  get filteredRows(): GoalRow[] {
    if (this.filter === 'all') return this.rows;
    if (this.filter === 'active') return this.rows.filter(r => !r.isCompleted);
    return this.rows.filter(r => r.isCompleted);
  }

  get activeCount(): number {
    return this.rows.filter(r => !r.isCompleted).length;
  }

  get completedCount(): number {
    return this.rows.filter(r => r.isCompleted).length;
  }

  setFilter(value: GoalFilter): void {
    this.filter = value;
  }

  openCreateModal(): void {
    if (!this.accounts.length) return;
    this.modalMode = 'create';
    this.editingGoalId = null;
    this.formData = {
      accountId: this.accounts[0].id,
      name: '',
      target: null,
    };
    this.saveError = null;
    this.isModalOpen = true;
  }

  openEditModal(row: GoalRow): void {
    this.modalMode = 'edit';
    this.editingGoalId = row.goal.id;
    this.formData = {
      accountId: row.goal.accountId,
      name: row.goal.name,
      target: row.goal.target,
    };
    this.saveError = null;
    this.isModalOpen = true;
  }

  closeModal(): void {
    if (this.saving) return;
    this.isModalOpen = false;
  }

  submitForm(): void {
    const name = this.formData.name.trim();
    if (!name) {
      this.saveError = 'Il nome è obbligatorio.';
      return;
    }
    const target = this.formData.target;
    if (target === null || isNaN(target) || target <= 0) {
      this.saveError = 'Il target deve essere un numero maggiore di zero.';
      return;
    }
    if (this.modalMode === 'create') {
      if (!this.formData.accountId) {
        this.saveError = 'Seleziona un conto.';
        return;
      }
      this.submitCreate(this.formData.accountId, name, target);
    } else {
      this.submitEdit(name, target);
    }
  }

  private submitCreate(accountId: number, name: string, target: number): void {
    this.saving = true;
    this.saveError = null;
    this.goalService
      .createGoal(accountId, { name, target })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.isModalOpen = false;
          this.loadData();
        },
        error: () => {
          this.saveError = 'Impossibile creare l\'obiettivo. Riprova più tardi.';
        },
      });
  }

  private submitEdit(name: string, target: number): void {
    this.saving = true;
    this.saveError = null;
    this.goalService
      .updateGoal(this.editingGoalId!, { name, target })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.isModalOpen = false;
          this.loadData();
        },
        error: () => {
          this.saveError = 'Impossibile aggiornare l\'obiettivo. Riprova più tardi.';
        },
      });
  }

  openDeleteConfirm(row: GoalRow): void {
    this.deleteConfirmRow = row;
    this.deleteError = null;
  }

  closeDeleteConfirm(): void {
    if (this.deleting) return;
    this.deleteConfirmRow = null;
  }

  confirmDelete(): void {
    if (!this.deleteConfirmRow) return;
    this.deleting = true;
    this.deleteError = null;
    this.goalService
      .deleteGoal(this.deleteConfirmRow.goal.id)
      .pipe(finalize(() => (this.deleting = false)))
      .subscribe({
        next: () => {
          this.deleteConfirmRow = null;
          this.loadData();
        },
        error: () => {
          this.deleteError = 'Impossibile eliminare l\'obiettivo. Riprova più tardi.';
        },
      });
  }

  private loadData(): void {
    this.loading = true;
    this.error = null;
    forkJoin({
      goals: this.goalService.getGoals(),
      accounts: this.accountService.getAccounts(),
    })
      .pipe(
        catchError(() => {
          this.error = 'Impossibile caricare gli obiettivi. Riprova più tardi.';
          return of({ goals: [] as Goal[], accounts: [] as Account[] });
        }),
        finalize(() => (this.loading = false)),
      )
      .subscribe(({ goals, accounts }) => {
        this.accounts = accounts;
        const accountById = new Map<number, Account>();
        accounts.forEach(a => accountById.set(a.id, a));
        this.rows = goals.map(goal => this.toRow(goal, accountById.get(goal.accountId)));
      });
  }

  private toRow(goal: Goal, account: Account | undefined): GoalRow {
    const currentAmount = account?.balance ?? 0;
    const target = goal.target > 0 ? goal.target : 1;
    const ratio = currentAmount / target;
    const progressPct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
    const isCompleted = currentAmount >= goal.target;
    return { goal, account, currentAmount, progressPct, isCompleted };
  }
}
