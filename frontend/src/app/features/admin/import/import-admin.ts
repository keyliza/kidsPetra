import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api';
import { ImportResult } from '../../../core/models';
import { IconComponent } from '../../../shared/icon';

@Component({
  selector: 'app-import-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, IconComponent],
  templateUrl: './import-admin.html',
})
export class ImportAdminComponent {
  private api = inject(ApiService);

  text = signal('');
  running = signal(false);
  result = signal<ImportResult | null>(null);

  run(dryRun: boolean): void {
    if (!this.text().trim() || this.running()) return;
    this.running.set(true);
    this.result.set(null);
    this.api.import(this.text(), dryRun).subscribe({
      next: (r) => { this.result.set(r); this.running.set(false); },
      error: () => this.running.set(false),
    });
  }
}
