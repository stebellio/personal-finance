import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../../environments/environment";
import {User} from "../core/models/user.model";
import {jwtDecode} from "jwt-decode";

interface LoginResponse {
  access_token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private _user: User | null = null;

  constructor(private http: HttpClient) {
    this.loadUserFromToken();
  }

  get user(): User | null {
    return this._user;
  }

  login(email: string, password: string): Observable<any> {
    return new Observable(observer => {
      this.http.post(`${this.apiUrl}/auth/login`, { email, password })
          .subscribe({
            next: (response: any) => {
              localStorage.setItem('token', response.access_token);
              this.loadUserFromToken();
              observer.next(response);
            },
            error: (err) => observer.error(err)
          });
    });
  }

  register(email: string, password: string, name?: string) {
    return this.http.post(`${this.apiUrl}/auth/register`, { email, password, name });
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
    this._user = null;
  }

  private loadUserFromToken(): void {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<User>(token);
        this._user = {
          id: decoded.id,
          email: decoded.email,
        }
      } catch {
        this._user = null;
      }
    }
  }
}
