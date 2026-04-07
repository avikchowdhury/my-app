import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotificationService } from '../../../services/notification.service';
import { Profile, ProfileService } from '../../../services/profile.service';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
})
export class ProfilePageComponent implements OnInit {
  showOldPassword = false;
  showNewPassword = false;
  profile: Profile | null = null;
  loading = false;
  savingProfile = false;
  changingPassword = false;
  editForm: FormGroup;
  passwordForm: FormGroup;
  avatarUploading = false;

  constructor(
    private profileService: ProfileService,
    private notification: NotificationService,
    private fb: FormBuilder,
  ) {
    this.editForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
    this.passwordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit() {
    this.loadProfile();
  }

  get avatarInitials(): string {
    const email = this.profile?.email?.trim() || '';
    return email ? email.slice(0, 2).toUpperCase() : 'AI';
  }

  loadProfile() {
    this.loading = true;
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.editForm.patchValue({ email: profile.email });
        this.loading = false;
      },
      error: () => {
        this.notification.error('Failed to load profile');
        this.loading = false;
      },
    });
  }

  saveProfile() {
    if (this.editForm.invalid || this.savingProfile) return;
    const email = this.editForm.value.email;
    this.savingProfile = true;
    this.profileService.updateProfile(email).subscribe({
      next: (profile) => {
        this.notification.success('Profile updated');
        this.profile = profile;
        this.editForm.patchValue({ email: profile.email });
      },
      error: () => this.notification.error('Failed to update profile'),
      complete: () => {
        this.savingProfile = false;
      },
    });
  }

  changePassword() {
    if (this.passwordForm.invalid || this.changingPassword) return;
    const { oldPassword, newPassword } = this.passwordForm.value;
    this.changingPassword = true;
    this.profileService.changePassword(oldPassword, newPassword).subscribe({
      next: () => {
        this.notification.success('Password changed');
        this.passwordForm.reset();
      },
      error: () => this.notification.error('Failed to change password'),
      complete: () => {
        this.changingPassword = false;
      },
    });
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.avatarUploading = true;
    this.profileService.uploadAvatar(file).subscribe({
      next: (res) => {
        this.notification.success('Avatar updated');
        if (this.profile) this.profile.avatarUrl = res.avatarUrl;
        this.avatarUploading = false;
      },
      error: () => {
        this.notification.error('Failed to upload avatar');
        this.avatarUploading = false;
      },
    });
  }
}
