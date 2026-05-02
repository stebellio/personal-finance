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
}
