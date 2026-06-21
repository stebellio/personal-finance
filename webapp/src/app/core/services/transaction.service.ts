import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Transaction, Category } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getTransactions(from: Date, to: Date): Observable<Transaction[]> {
    const params = new HttpParams()
      .set('from', from.toISOString())
      .set('to', to.toISOString());
    return this.http.get<Transaction[]>(`${this.apiUrl}/transactions`, { params });
  }

  createTransaction(payload: { accountId: number; amount: number; date: string; note?: string; categoryId?: number }): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/accounts/${payload.accountId}/transactions`, {
      amount: payload.amount,
      date: payload.date,
      note: payload.note,
      categoryId: payload.categoryId,
    });
  }

  updateTransaction(id: number, payload: { amount?: number; date?: string; note?: string | null; accountId?: number; categoryId?: number | null }): Observable<Transaction> {
    return this.http.patch<Transaction>(`${this.apiUrl}/transactions/${id}`, payload);
  }

  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/transactions/${id}`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }
}
