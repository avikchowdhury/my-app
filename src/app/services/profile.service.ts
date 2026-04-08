import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface Profile {
  email: string;
  role: string;
  avatarUrl?: string;
  fullName?: string;
  phone?: string;
  address?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private apiUrl = '/api/profile';
  private profileSubject = new BehaviorSubject<Profile | null>(null);
  readonly profile$ = this.profileSubject.asObservable();

  constructor(private http: HttpClient) {}

  getProfile(): Observable<Profile> {
    return this.http
      .get<Profile>(this.apiUrl)
      .pipe(tap((profile) => this.profileSubject.next(profile)));
  }

  updateProfile(profileData: Partial<Profile>): Observable<Profile> {
    return this.http
      .put<Profile>(this.apiUrl, profileData)
      .pipe(tap((profile) => this.profileSubject.next(profile)));
  }

  changePassword(oldPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/change-password`, {
      oldPassword,
      newPassword,
    });
  }

  uploadAvatar(file: File): Observable<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<{ avatarUrl: string }>(`${this.apiUrl}/avatar`, formData)
      .pipe(
        tap((response) => {
          const current = this.profileSubject.value;
          if (current) {
            this.profileSubject.next({
              ...current,
              avatarUrl: response.avatarUrl,
            });
          }
        }),
      );
  }

  clearProfile(): void {
    this.profileSubject.next(null);
  }
}
