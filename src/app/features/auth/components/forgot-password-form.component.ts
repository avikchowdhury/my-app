import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

const passwordsMatch: ValidatorFn = (
  group: AbstractControl,
): ValidationErrors | null => {
  const pw = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { mismatch: true } : null;
};

@Component({
  selector: 'app-forgot-password-form',
  templateUrl: './forgot-password-form.component.html',
  styleUrls: ['./forgot-password-form.component.scss'],
})
export class ForgotPasswordFormComponent {
  step: 1 | 2 = 1;

  emailForm: FormGroup;
  resetForm: FormGroup;

  loading = false;
  errorMessage = '';
  successMessage = '';
  showNewPassword = false;
  developmentToken = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.resetForm = this.fb.group(
      {
        token: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordsMatch },
    );
  }

  sendCode(): void {
    if (this.emailForm.invalid || this.loading) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.forgotPassword(this.emailForm.value.email).subscribe({
      next: (res) => {
        this.developmentToken = res.developmentToken ?? '';
        this.step = 2;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage =
          err.error?.message || 'Something went wrong. Try again.';
        this.loading = false;
      },
    });
  }

  resetPassword(): void {
    if (this.resetForm.invalid || this.loading) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { token, newPassword } = this.resetForm.value;
    this.authService
      .resetPassword(this.emailForm.value.email, token, newPassword)
      .subscribe({
        next: () => {
          this.successMessage = 'Password updated! Redirecting to login…';
          this.loading = false;
          setTimeout(() => this.router.navigate(['/auth/login']), 2000);
        },
        error: (err) => {
          this.errorMessage =
            err.error?.message ||
            'Reset failed. Check your code and try again.';
          this.loading = false;
        },
      });
  }

  goBack(): void {
    this.step = 1;
    this.errorMessage = '';
    this.successMessage = '';
    this.resetForm.reset();
  }
}
