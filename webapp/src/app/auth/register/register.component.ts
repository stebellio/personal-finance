import { Component } from '@angular/core';
import {AuthService} from "../auth.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.less']
})
export class RegisterComponent {
  email = '';
  password = '';
  error = '';
  success = '';

  constructor(private auth: AuthService, private router: Router) {}

  register() {
    this.auth.register(this.email, this.password).subscribe({
      next: () => {
        this.success = 'Registrazione avvenuta con successo';
        setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      },
      error: err => {
        this.error = err.error?.message || 'Errore di registrazione'
      }
    });
  }
}
