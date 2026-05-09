import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Goal } from '../models/goal.model';

@Injectable({ providedIn: 'root' })
export class GoalService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getGoals(): Observable<Goal[]> {
    return this.http.get<Goal[]>(`${this.apiUrl}/goals`);
  }

  getGoalsByAccount(accountId: number): Observable<Goal[]> {
    return this.http.get<Goal[]>(`${this.apiUrl}/accounts/${accountId}/goals`);
  }

  createGoal(
    accountId: number,
    payload: { name: string; target: number },
  ): Observable<Goal> {
    return this.http.post<Goal>(
      `${this.apiUrl}/accounts/${accountId}/goals`,
      payload,
    );
  }

  updateGoal(
    id: number,
    payload: { name?: string; target?: number; completedAt?: Date | null },
  ): Observable<Goal> {
    return this.http.patch<Goal>(`${this.apiUrl}/goals/${id}`, payload);
  }

  deleteGoal(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/goals/${id}`);
  }
}
