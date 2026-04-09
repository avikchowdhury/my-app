import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  AiAssistantService,
  AppNotification,
} from '../services/ai-assistant.service';
import { AuthService } from '../services/auth.service';
import { Profile, ProfileService } from '../services/profile.service';

interface NavigationItem {
  label: string;
  path: string;
  icon: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-shell',
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss'],
})
export class AppShellComponent implements OnInit, OnDestroy {
  readonly navigation: NavigationItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Receipts', path: '/receipts', icon: 'receipt_long' },
    { label: 'Budgets', path: '/budgets', icon: 'savings' },
    { label: 'Categories', path: '/categories', icon: 'category' },
    { label: 'AI Insights', path: '/insights', icon: 'auto_awesome' },
    { label: 'Forecast', path: '/forecast', icon: 'insights' },
    { label: 'Profile', path: '/profile', icon: 'manage_accounts' },
    {
      label: 'Admin',
      path: '/admin',
      icon: 'admin_panel_settings',
      adminOnly: true,
    },
  ];

  profile: Profile | null = null;
  notifications: AppNotification[] = [];
  notifPanelOpen = false;
  private readonly subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private router: Router,
    private aiService: AiAssistantService,
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.profileService.profile$.subscribe((profile) => {
        this.profile = profile;
      }),
    );

    if (this.authService.isAuthenticated()) {
      this.subscription.add(
        this.profileService.getProfile().subscribe({ error: () => undefined }),
      );
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    this.aiService.getNotifications().subscribe({
      next: (n) => {
        this.notifications = n;
      },
      error: () => undefined,
    });
  }

  get unreadCount(): number {
    return this.notifications.filter(
      (n) => n.severity === 'critical' || n.severity === 'warning',
    ).length;
  }

  toggleNotifPanel(): void {
    this.notifPanelOpen = !this.notifPanelOpen;
  }

  closeNotifPanel(): void {
    this.notifPanelOpen = false;
  }

  notifIcon(type: string): string {
    if (type === 'budget') return 'account_balance_wallet';
    if (type === 'anomaly') return 'trending_up';
    if (type === 'subscription') return 'autorenew';
    return 'notifications';
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  get avatarInitials(): string {
    const email = this.profile?.email?.trim() || '';
    return email ? email.slice(0, 2).toUpperCase() : 'AI';
  }

  get visibleNavigation(): NavigationItem[] {
    const isAdmin =
      this.profile?.role?.toLowerCase() === 'admin' ||
      this.authService.isAdmin();

    return this.navigation.filter((item) => !item.adminOnly || isAdmin);
  }

  logout(): void {
    this.profileService.clearProfile();
    this.authService.clearToken();
    this.router.navigate(['/auth/login']);
  }
}
