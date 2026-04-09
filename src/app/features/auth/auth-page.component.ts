import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-auth-page',
  templateUrl: './auth-page.component.html',
  styleUrls: ['./auth-page.component.scss']
})
export class AuthPageComponent {
  readonly activeMode$ = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map(() => (this.router.url.includes('/register') ? 'register' : 'login') as 'login' | 'register'),
    startWith((this.router.url.includes('/register') ? 'register' : 'login') as 'login' | 'register')
  );

  readonly showTabs$ = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map(() => !this.router.url.includes('/forgot-password')),
    startWith(!this.router.url.includes('/forgot-password'))
  );

  constructor(private router: Router) {}
}
