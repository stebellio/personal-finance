import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Closure } from '../models/closure.model';

@Injectable({ providedIn: 'root' })
export class ClosureService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getClosures(year: number, month: number): Observable<Closure[]> {
    const params = new HttpParams()
      .set('year', year)
      .set('month', month);
    return this.http.get<Closure[]>(`${this.apiUrl}/closures`, { params });
  }

  createClosure(
    accountId: number,
    data: { year: number; month: number; amount: number; note?: string },
  ): Observable<Closure> {
    return this.http.post<Closure>(
      `${this.apiUrl}/accounts/${accountId}/closures`,
      data,
    );
  }

  updateClosure(
    id: number,
    data: { amount?: number; note?: string | null },
  ): Observable<Closure> {
    return this.http.patch<Closure>(`${this.apiUrl}/closures/${id}`, data);
  }

  deleteClosure(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/closures/${id}`);
  }
}
