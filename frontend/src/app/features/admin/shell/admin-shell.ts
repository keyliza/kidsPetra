import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth';
import { IconComponent } from '../../../shared/icon';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './admin-shell.html',
})
export class AdminShellComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  user = this.auth.user;
  isAdmin = this.auth.isAdmin;

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/admin']);
  }
}
