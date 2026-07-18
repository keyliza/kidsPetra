import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth';

const AUTH_FREE = ['/auth/login', '/auth/refresh'];

/** Añade el access token a las peticiones a la API y renueva la sesión una vez ante un 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isApi = req.url.startsWith('/api');
  const skip = AUTH_FREE.some((p) => req.url.includes(p));

  const withToken = () => {
    const token = auth.getAccessToken();
    return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  };

  if (!isApi || skip) {
    return next(req);
  }

  return next(withToken()).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || !auth.getAccessToken()) {
        return throwError(() => err);
      }
      // Intento único de renovación y reintento.
      return auth.refresh().pipe(
        switchMap(() => next(req.clone({ setHeaders: { Authorization: `Bearer ${auth.getAccessToken()}` } }))),
        catchError((refreshErr) => {
          auth.clear();
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
