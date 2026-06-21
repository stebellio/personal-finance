import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Account } from '../models/account.model';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAccounts(): Observable<Account[]> {
    return this.http
      .get<Account[]>(`${this.apiUrl}/accounts`)
  }

  createAccount(payload: { name: string; description?: string; balance?: number; type?: string; createdAt?: string }): Observable<number> {
    return this.http.post<number>(`${this.apiUrl}/accounts`, payload);
  }

  updateAccount(id: number, payload: { name: string; description?: string; type?: string; createdAt?: string }): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/accounts/${id}`, payload);
  }

  deleteAccount(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/accounts/${id}`);
  }
}
