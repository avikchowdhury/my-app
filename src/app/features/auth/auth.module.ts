import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { AuthPageComponent } from './auth-page.component';
import { AuthRoutingModule } from './auth-routing.module';
import { AuthHeroComponent } from './components/auth-hero.component';
import { ForgotPasswordFormComponent } from './components/forgot-password-form.component';
import { LoginFormComponent } from './components/login-form.component';
import { RegisterFormComponent } from './components/register-form.component';

@NgModule({
  declarations: [
    AuthPageComponent,
    AuthHeroComponent,
    LoginFormComponent,
    RegisterFormComponent,
    ForgotPasswordFormComponent,
  ],
  imports: [SharedModule, AuthRoutingModule],
})
export class AuthModule {}
