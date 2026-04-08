// ...existing code...
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { Profile, ProfileService } from '../../../services/profile.service';

interface PhoneCountryOption {
  name: string;
  dialCode: string;
  flag: string;
}

const PHONE_COUNTRIES: PhoneCountryOption[] = [
  { name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  { name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
];

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
})
export class ProfilePageComponent implements OnInit {
  readonly defaultCountryCode = '+91';
  readonly phoneCountries = PHONE_COUNTRIES;
  showOldPassword = false;
  showNewPassword = false;
  profile: Profile | null = null;
  loading = false;
  savingProfile = false;
  changingPassword = false;
  bootstrappingAdmin = false;
  editForm: FormGroup;
  passwordForm: FormGroup;
  avatarUploading = false;

  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private notification: NotificationService,
    private fb: FormBuilder,
    private router: Router,
  ) {
    this.editForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      phoneCountryCode: [
        this.defaultCountryCode,
        [Validators.pattern(/^\+\d{1,4}$/)],
      ],
      phoneNumber: ['', [Validators.pattern(/^\d{10}$/)]],
      address: [''],
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

  get selectedPhoneCountry(): PhoneCountryOption {
    const selectedDialCode =
      this.editForm.get('phoneCountryCode')?.value || this.defaultCountryCode;

    return (
      this.phoneCountries.find(
        (country) => country.dialCode === selectedDialCode,
      ) || this.phoneCountries[0]
    );
  }

  loadProfile() {
    this.loading = true;
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        const phoneParts = this.parsePhone(profile.phone);
        this.editForm.patchValue({
          email: profile.email,
          fullName: profile.fullName || '',
          phoneCountryCode: phoneParts.countryCode,
          phoneNumber: phoneParts.phoneNumber,
          address: profile.address || '',
        });
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
    const { email, fullName, address } = this.editForm.value;
    this.savingProfile = true;
    this.profileService
      .updateProfile({
        email,
        fullName,
        phone: this.buildPhoneValue(),
        address,
      })
      .subscribe({
        next: (profile) => {
          this.notification.success('Profile updated');
          this.profile = profile;
          const phoneParts = this.parsePhone(profile.phone);
          this.editForm.patchValue({
            email: profile.email,
            fullName: profile.fullName || '',
            phoneCountryCode: phoneParts.countryCode,
            phoneNumber: phoneParts.phoneNumber,
            address: profile.address || '',
          });
        },
        error: () => this.notification.error('Failed to update profile'),
        complete: () => {
          this.savingProfile = false;
        },
      });
  }

  private parsePhone(phone?: string | null): {
    countryCode: string;
    phoneNumber: string;
  } {
    if (!phone) {
      return {
        countryCode: this.defaultCountryCode,
        phoneNumber: '',
      };
    }

    const digits = phone.replace(/\D/g, '');
    if (digits.length <= 10) {
      return {
        countryCode: this.defaultCountryCode,
        phoneNumber: digits.slice(-10),
      };
    }

    const candidateCountryCode = `+${digits.slice(0, -10)}`;
    const matchedCountry = this.phoneCountries.find(
      (country) => country.dialCode === candidateCountryCode,
    );

    return {
      countryCode: matchedCountry?.dialCode || this.defaultCountryCode,
      phoneNumber: digits.slice(-10),
    };
  }

  private buildPhoneValue(): string | null {
    const phoneNumber = String(
      this.editForm.get('phoneNumber')?.value ?? '',
    ).replace(/\D/g, '');

    if (!phoneNumber) {
      return null;
    }

    const countryCode = String(
      this.editForm.get('phoneCountryCode')?.value || this.defaultCountryCode,
    ).replace(/[^\d+]/g, '');

    return `${countryCode}${phoneNumber}`;
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

  claimInitialAdminAccess(): void {
    if (this.bootstrappingAdmin) {
      return;
    }

    this.bootstrappingAdmin = true;

    this.authService
      .bootstrapAdmin()
      .pipe(
        switchMap((response) => {
          this.authService.saveToken(response);
          return this.profileService.getProfile();
        }),
      )
      .subscribe({
        next: () => {
          this.notification.success(
            'Admin access is now active for this account.',
            'Admin',
          );
          this.bootstrappingAdmin = false;
          this.router.navigate(['/admin']);
        },
        error: (error) => {
          const message =
            error?.error?.message ||
            'Unable to claim admin access for this account.';
          this.notification.error(message, 'Admin');
          this.bootstrappingAdmin = false;
        },
      });
  }
  demoPromoteToAdmin(): void {
    this.notification.success(
      'Demo: User promoted to admin (mock action).',
      'Demo Promote',
    );
    // Here you would call a real promote endpoint or mock the effect for demo purposes.
  }
}
