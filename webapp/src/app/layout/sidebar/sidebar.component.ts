import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.less'],
})
export class SidebarComponent {
  readonly items: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/home' },
    { label: 'Accounts', icon: 'wallet', route: '/accounts' },
    { label: 'Chiusure', icon: 'closures', route: '/closures' },
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  get userEmail(): string {
    return this.authService.user?.email ?? '';
  }

  get userInitial(): string {
    return (this.userEmail[0] ?? 'U').toUpperCase();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
