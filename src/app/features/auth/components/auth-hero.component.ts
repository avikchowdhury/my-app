import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-auth-hero',
  templateUrl: './auth-hero.component.html',
  styleUrls: ['./auth-hero.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthHeroComponent {
  @Input() mode: 'login' | 'register' = 'login';
}
