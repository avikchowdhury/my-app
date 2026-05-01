import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  AiAssistantService,
  AppNotification,
} from '../services/ai-assistant.service';
import { AuthService } from '../services/auth.service';
import {
  CountryPreference,
  LocalePreferenceService,
  SupportedCountryCode,
} from '../services/locale-preference.service';
import { QuickAddExpenseDialogComponent } from './quick-add-expense-dialog.component';
import { Profile, ProfileService } from '../services/profile.service';
import { UserManualService } from '../services/user-manual.service';

interface NavigationItem {
  label: string;
  labelKey: string;
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
    {
      label: 'Dashboard',
      labelKey: 'nav.dashboard',
      path: '/dashboard',
      icon: 'dashboard',
    },
    {
      label: 'Receipts',
      labelKey: 'nav.receipts',
      path: '/receipts',
      icon: 'receipt_long',
    },
    {
      label: 'Budgets',
      labelKey: 'nav.budgets',
      path: '/budgets',
      icon: 'savings',
    },
    {
      label: 'Categories',
      labelKey: 'nav.categories',
      path: '/categories',
      icon: 'category',
    },
    {
      label: 'Insights',
      labelKey: 'nav.insights',
      path: '/insights',
      icon: 'auto_awesome',
    },
    {
      label: 'Forecast',
      labelKey: 'nav.forecast',
      path: '/forecast',
      icon: 'insights',
    },
    {
      label: 'Profile',
      labelKey: 'nav.profile',
      path: '/profile',
      icon: 'manage_accounts',
    },
    {
      label: 'Admin',
      labelKey: 'nav.admin',
      path: '/admin',
      icon: 'admin_panel_settings',
      adminOnly: true,
    },
  ];

  @ViewChild('notifPanelHost')
  notifPanelHost?: ElementRef<HTMLElement>;

  profile: Profile | null = null;
  notifications: AppNotification[] = [];
  notifPanelOpen = false;
  manualDownloading = false;
  selectedCountry: CountryPreference;
  private readonly subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private router: Router,
    private aiService: AiAssistantService,
    private userManualService: UserManualService,
    private dialog: MatDialog,
    public localePreference: LocalePreferenceService,
  ) {
    this.selectedCountry = this.localePreference.currentPreference;
  }

  ngOnInit(): void {
    this.subscription.add(
      this.profileService.profile$.subscribe((profile) => {
        this.profile = profile;
      }),
    );
    this.subscription.add(
      this.localePreference.preference$.subscribe((preference) => {
        this.selectedCountry = preference;
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

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    if (!this.notifPanelOpen) {
      return;
    }

    const target = event.target as Node | null;
    if (!target || this.notifPanelHost?.nativeElement.contains(target)) {
      return;
    }

    this.closeNotifPanel();
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    this.closeNotifPanel();
  }

  notifIcon(type: string): string {
    if (type === 'budget') return 'account_balance_wallet';
    if (type === 'anomaly') return 'trending_up';
    if (type === 'subscription') return 'autorenew';
    return 'notifications';
  }

  downloadManual(): void {
    if (this.manualDownloading) return;
    this.manualDownloading = true;
    this.userManualService
      .downloadPdf()
      .finally(() => (this.manualDownloading = false));
  }

  openQuickAdd(): void {
    const dialogRef = this.dialog.open(QuickAddExpenseDialogComponent, {
      width: '720px',
      maxWidth: '96vw',
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((saved) => {
      if (saved) {
        this.loadNotifications();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  get avatarInitials(): string {
    const email = this.profile?.email?.trim() || '';
    return email ? email.slice(0, 2).toUpperCase() : 'ET';
  }

  get visibleNavigation(): NavigationItem[] {
    const isAdmin =
      this.profile?.role?.toLowerCase() === 'admin' ||
      this.authService.isAdmin();

    return this.navigation.filter((item) => !item.adminOnly || isAdmin);
  }

  trackCountry(_index: number, country: CountryPreference): string {
    return country.code;
  }

  countryFlag(code: SupportedCountryCode): string {
    return this.localePreference.getFlagIcon(code);
  }

  changeCountry(code: SupportedCountryCode): void {
    this.localePreference.setCountry(code);
  }

  logout(): void {
    this.profileService.clearProfile();
    this.authService.clearToken();
    this.router.navigate(['/auth/login']);
  }
}
