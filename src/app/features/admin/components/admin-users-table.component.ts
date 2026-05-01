import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AdminUserSummary, AppUserRole } from '../../../models';

@Component({
  selector: 'app-admin-users-table',
  templateUrl: './admin-users-table.component.html',
  styleUrls: ['./admin-users-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersTableComponent {
  @Input() users: AdminUserSummary[] = [];
  @Input() loading = false;
  @Input() updatingUserId: number | null = null;
  @Input() currentUserId: number | null = null;
  @Output() roleChange = new EventEmitter<{
    userId: number;
    role: AppUserRole;
  }>();

  readonly displayedColumns = ['user', 'role', 'activity', 'actions'];

  trackByUserId(_index: number, user: AdminUserSummary): number {
    return user.id;
  }

  getAvatarInitials(user: AdminUserSummary): string {
    return user.email.slice(0, 2).toUpperCase();
  }

  canManage(user: AdminUserSummary): boolean {
    return user.id !== this.currentUserId;
  }

  getNextRole(user: AdminUserSummary): AppUserRole {
    return user.role === 'Admin' ? 'User' : 'Admin';
  }

  submitRoleChange(user: AdminUserSummary): void {
    if (!this.canManage(user)) {
      return;
    }

    this.roleChange.emit({ userId: user.id, role: this.getNextRole(user) });
  }

  copyEmail(email: string): void {
    navigator.clipboard.writeText(email).catch(() => undefined);
  }
}
