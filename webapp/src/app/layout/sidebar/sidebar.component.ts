import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const STORAGE_KEY = 'sidebar-collapsed';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.less'],
})
export class SidebarComponent {
  readonly groups: NavGroup[] = [
    {
      items: [{ label: 'Dashboard', icon: 'dashboard', route: '/home' }],
    },
    {
      label: 'Finanziario',
      items: [
        { label: 'Conti', icon: 'wallet', route: '/accounts' },
        { label: 'Obiettivi', icon: 'target', route: '/goals' },
        { label: 'Transazioni', icon: 'receipt', route: '/expenses' },
      ],
    },
    {
      label: 'Immobiliare',
      items: [{ label: 'Proprietà', icon: 'building', route: '/properties' }],
    },
  ];

  collapsed = localStorage.getItem(STORAGE_KEY) === 'true';

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

  toggle(): void {
    this.collapsed = !this.collapsed;
    localStorage.setItem(STORAGE_KEY, String(this.collapsed));
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
