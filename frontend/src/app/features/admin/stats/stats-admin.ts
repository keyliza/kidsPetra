import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ApiService } from '../../../core/api';
import { Stats } from '../../../core/models';
import { IconComponent } from '../../../shared/icon';

@Component({
  selector: 'app-stats-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './stats-admin.html',
})
export class StatsAdminComponent {
  private api = inject(ApiService);

  stats = signal<Stats | null>(null);
  loading = signal(true);

  constructor() {
    this.api.getStats().subscribe((s) => { this.stats.set(s); this.loading.set(false); });
  }

  /** Porcentaje de archivos presentes sobre el total esperado en una sección. */
  fillPct(fileCount: number, missingCount: number): number {
    const total = fileCount + missingCount;
    return total === 0 ? 0 : Math.round((fileCount / total) * 100);
  }
}
