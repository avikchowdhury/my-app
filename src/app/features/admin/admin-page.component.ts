import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AdminOverview, AdminUserSummary, AppUserRole } from '../../models';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { AdminService } from './admin.service';

type AdminUserFilter = 'all' | 'admins' | 'needs-setup' | 'recent';

interface AdminTrackingCard {
  label: string;
  value: number;
  hint: string;
  icon: string;
  tone: 'default' | 'positive' | 'warning';
}

interface AdminWatchlistItem {
  user: AdminUserSummary;
  reasons: string[];
}

interface AdminWorkspaceSignal {
  label: string;
  value: string;
  detail: string;
  icon: string;
  tone: 'default' | 'positive' | 'warning';
}

interface AdminRecommendation {
  title: string;
  detail: string;
  tone: 'default' | 'positive' | 'warning';
}

@Component({
  selector: 'app-admin-page',
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.scss'],
})
export class AdminPageComponent implements OnInit {
  overview: AdminOverview | null = null;
  users: AdminUserSummary[] = [];
  loading = false;
  updatingUserId: number | null = null;
  searchText = '';
  activityFilter: AdminUserFilter = 'all';
  readonly currentUserId = this.authService.getUserId();

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private notification: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadAdminWorkspace();
  }

  loadAdminWorkspace(): void {
    this.loading = true;

    forkJoin({
      overview: this.adminService.getOverview(),
      users: this.adminService.getUsers(),
    }).subscribe({
      next: ({ overview, users }) => {
        this.overview = overview;
        this.users = users;
        this.loading = false;
      },
      error: () => {
        this.notification.error(
          'Failed to load the admin workspace.',
          'Admin',
        );
        this.loading = false;
      },
    });
  }

  handleRoleChange(event: { userId: number; role: AppUserRole }): void {
    if (this.updatingUserId) {
      return;
    }

    this.updatingUserId = event.userId;
    this.adminService.updateUserRole(event.userId, event.role).subscribe({
      next: () => {
        this.notification.success('User role updated.', 'Admin');
        this.updatingUserId = null;
        this.loadAdminWorkspace();
      },
      error: (error) => {
        const message =
          error?.error?.message || 'Failed to update the selected user role.';
        this.notification.error(message, 'Admin');
        this.updatingUserId = null;
      },
    });
  }

  setActivityFilter(filter: AdminUserFilter): void {
    this.activityFilter = filter;
  }

  exportUsersCsv(): void {
    if (!this.filteredUsers.length) {
      return;
    }

    const rows = [
      [
        'User ID',
        'Email',
        'Role',
        'Receipts',
        'Budgets',
        'Categories',
        'Last Receipt',
        'Watch Reasons',
      ],
      ...this.filteredUsers.map((user) => [
        String(user.id),
        user.email,
        user.role,
        String(user.receiptCount),
        String(user.budgetCount),
        String(user.categoryCount),
        user.latestReceiptAt ?? '',
        this.getWatchReasons(user).join('; '),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
      )
      .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'admin-users-export.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  get filteredUsers(): AdminUserSummary[] {
    const search = this.searchText.trim().toLowerCase();

    return this.users.filter((user) => {
      if (search && !user.email.toLowerCase().includes(search)) {
        return false;
      }

      switch (this.activityFilter) {
        case 'admins':
          return user.role === 'Admin';
        case 'needs-setup':
          return this.getWatchReasons(user).length > 0;
        case 'recent':
          return this.isRecentlyActive(user);
        case 'all':
        default:
          return true;
      }
    });
  }

  get visibleUserCountLabel(): string {
    if (this.filteredUsers.length === this.users.length) {
      return `${this.users.length} users`;
    }

    return `${this.filteredUsers.length} of ${this.users.length} users`;
  }

  get trackingCards(): AdminTrackingCard[] {
    const activeUploaders = this.users.filter((user) => user.receiptCount > 0)
      .length;
    const budgetReadyUsers = this.users.filter((user) => user.budgetCount > 0)
      .length;
    const recentlyActiveUsers = this.users.filter((user) =>
      this.isRecentlyActive(user),
    ).length;
    const watchlistCount = this.users.filter(
      (user) => this.getWatchReasons(user).length > 0,
    ).length;

    return [
      {
        label: 'Active uploaders',
        value: activeUploaders,
        hint: 'Users who have already saved at least one receipt',
        icon: 'upload_file',
        tone: 'positive',
      },
      {
        label: 'Budget coverage',
        value: budgetReadyUsers,
        hint: 'Accounts that already created one or more budgets',
        icon: 'savings',
        tone: 'default',
      },
      {
        label: 'Recent activity',
        value: recentlyActiveUsers,
        hint: 'Users with a receipt uploaded in the last 7 days',
        icon: 'schedule',
        tone: 'positive',
      },
      {
        label: 'Needs follow-up',
        value: watchlistCount,
        hint: 'Accounts missing receipts, budgets, or category setup',
        icon: 'priority_high',
        tone: 'warning',
      },
    ];
  }

  get watchlist(): AdminWatchlistItem[] {
    return this.filteredUsers
      .map((user) => ({
        user,
        reasons: this.getWatchReasons(user),
      }))
      .filter((item) => item.reasons.length > 0)
      .sort((left, right) => right.reasons.length - left.reasons.length);
  }

  get workspaceSignals(): AdminWorkspaceSignal[] {
    const readyAccounts = this.users.filter(
      (user) =>
        user.receiptCount > 0 && user.budgetCount > 0 && user.categoryCount > 0,
    ).length;
    const dormantUsers = this.users.filter((user) => !this.isRecentlyActive(user))
      .length;
    const activeUploaders = this.users.filter((user) => user.receiptCount > 0);
    const averageReceipts = activeUploaders.length
      ? (
          activeUploaders.reduce(
            (sum, user) => sum + user.receiptCount,
            0,
          ) / activeUploaders.length
        ).toFixed(1)
      : '0.0';
    const adminCount = this.users.filter((user) => user.role === 'Admin').length;
    const adminCoverage = this.users.length
      ? `${Math.round((adminCount / this.users.length) * 100)}%`
      : '0%';

    return [
      {
        label: 'Ready accounts',
        value: `${readyAccounts}/${this.users.length || 0}`,
        detail: 'Users with receipts, budgets, and categories already configured',
        icon: 'task_alt',
        tone: readyAccounts === this.users.length ? 'positive' : 'default',
      },
      {
        label: 'Dormant users',
        value: dormantUsers.toString(),
        detail: 'Accounts without receipt activity in the last 7 days',
        icon: 'schedule_send',
        tone: dormantUsers > 0 ? 'warning' : 'positive',
      },
      {
        label: 'Admin coverage',
        value: adminCoverage,
        detail: 'Share of the workspace that can manage roles and governance',
        icon: 'admin_panel_settings',
        tone: adminCount <= 1 ? 'warning' : 'positive',
      },
      {
        label: 'Receipt depth',
        value: averageReceipts,
        detail: 'Average number of receipts among users who already upload',
        icon: 'stacked_line_chart',
        tone: 'default',
      },
    ];
  }

  get adminRecommendations(): AdminRecommendation[] {
    const adminCount = this.users.filter((user) => user.role === 'Admin').length;
    const dormantUsers = this.users.filter((user) => !this.isRecentlyActive(user))
      .length;
    const watchlistCount = this.users.filter(
      (user) => this.getWatchReasons(user).length > 0,
    ).length;

    return [
      {
        title:
          adminCount <= 1
            ? 'Add one backup admin'
            : 'Admin role coverage looks healthy',
        detail:
          adminCount <= 1
            ? 'A second admin reduces setup and access risk if one account is unavailable.'
            : 'Multiple admin accounts are already available for governance and handoff.',
        tone: adminCount <= 1 ? 'warning' : 'positive',
      },
      {
        title:
          watchlistCount > 0
            ? `Finish setup for ${watchlistCount} accounts`
            : 'No onboarding backlog right now',
        detail:
          watchlistCount > 0
            ? 'Focus first on users missing receipts, budgets, or categories so the workspace data stays useful.'
            : 'The current workspace has the basics configured across all visible users.',
        tone: watchlistCount > 0 ? 'default' : 'positive',
      },
      {
        title:
          dormantUsers > 0
            ? `Re-engage ${dormantUsers} inactive users`
            : 'Recent user activity looks strong',
        detail:
          dormantUsers > 0
            ? 'A quick reminder or onboarding follow-up could bring those accounts back into active use.'
            : 'Most accounts have uploaded receipts recently, which is a strong sign of adoption.',
        tone: dormantUsers > 0 ? 'warning' : 'positive',
      },
    ];
  }

  private isRecentlyActive(user: AdminUserSummary): boolean {
    if (!user.latestReceiptAt) {
      return false;
    }

    const lastReceiptDate = new Date(user.latestReceiptAt);
    const diffInDays =
      (Date.now() - lastReceiptDate.getTime()) / (1000 * 60 * 60 * 24);

    return diffInDays <= 7;
  }

  private getWatchReasons(user: AdminUserSummary): string[] {
    const reasons: string[] = [];

    if (user.receiptCount === 0) {
      reasons.push('No receipts uploaded');
    }

    if (user.budgetCount === 0) {
      reasons.push('No budget configured');
    }

    if (user.categoryCount === 0) {
      reasons.push('No categories configured');
    }

    return reasons;
  }
}
