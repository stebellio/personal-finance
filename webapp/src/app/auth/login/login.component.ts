import { Component } from '@angular/core';
import {AuthService} from "../auth.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less']
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';

  constructor(private readonly authService: AuthService, private readonly router: Router) {
  }

  login() {
    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error = err.error.message;
      }
    })
  }

  logout(): void {
    localStorage.removeItem('token');
  }
}
