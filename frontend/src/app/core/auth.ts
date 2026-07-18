import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_BASE } from './api';
import { AuthResult, User } from './models';

const ACCESS_KEY = 'pk_access';
const REFRESH_KEY = 'pk_refresh';
const USER_KEY = 'pk_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private accessToken = signal<string | null>(localStorage.getItem(ACCESS_KEY));
  readonly user = signal<User | null>(readUser());

  readonly isAuthenticated = computed(() => this.accessToken() !== null);
  readonly isAdmin = computed(() => this.user()?.role === 'Admin');

  getAccessToken(): string | null {
    return this.accessToken();
  }

  login(email: string, password: string): Observable<AuthResult> {
    return this.http.post<AuthResult>(`${API_BASE}/auth/login`, { email, password })
      .pipe(tap((r) => this.store(r)));
  }

  refresh(): Observable<AuthResult> {
    const refreshToken = localStorage.getItem(REFRESH_KEY) ?? '';
    return this.http.post<AuthResult>(`${API_BASE}/auth/refresh`, { refreshToken })
      .pipe(tap((r) => this.store(r)));
  }

  logout(): void {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (refreshToken) {
      this.http.post(`${API_BASE}/auth/logout`, { refreshToken }).subscribe({ error: () => {} });
    }
    this.clear();
  }

  private store(r: AuthResult): void {
    localStorage.setItem(ACCESS_KEY, r.accessToken);
    localStorage.setItem(REFRESH_KEY, r.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(r.user));
    this.accessToken.set(r.accessToken);
    this.user.set(r.user);
  }

  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this.accessToken.set(null);
    this.user.set(null);
  }
}

function readUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}
