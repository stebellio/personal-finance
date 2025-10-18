import { Component } from '@angular/core';
import {AuthService} from "../../auth/auth.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less']
})
export class HomeComponent {
  constructor(private readonly authService: AuthService, private readonly router: Router) {
    console.log(this.authService.user);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
