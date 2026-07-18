import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api';
import { Section, SectionInput } from '../../../core/models';
import { IconComponent } from '../../../shared/icon';

interface SectionForm extends SectionInput {
  id: number | null;
}

const ICONS = ['scroll', 'book-open', 'gift', 'egg', 'flame', 'sparkles', 'heart', 'baby', 'users', 'grid'];

@Component({
  selector: 'app-sections-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, IconComponent],
  templateUrl: './sections-admin.html',
})
export class SectionsAdminComponent {
  private api = inject(ApiService);

  readonly icons = ICONS;
  sections = signal<Section[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  form = signal<SectionForm | null>(null);

  constructor() {
    this.reload();
  }

  private reload(): void {
    this.loading.set(true);
    this.api.getSections().subscribe((s) => { this.sections.set(s); this.loading.set(false); });
  }

  newSection(): void {
    const order = Math.max(0, ...this.sections().map((s) => s.displayOrder)) + 1;
    this.form.set({ id: null, name: '', color: '#F97316', icon: 'book-open', codePrefix: '', displayOrder: order });
  }
  editSection(s: Section): void {
    this.form.set({ id: s.id, name: s.name, color: s.color, icon: s.icon, codePrefix: s.codePrefix, displayOrder: s.displayOrder });
  }
  closeForm(): void {
    this.form.set(null);
    this.error.set(null);
  }
  patch<K extends keyof SectionForm>(key: K, value: SectionForm[K]): void {
    const f = this.form();
    if (f) this.form.set({ ...f, [key]: value });
  }

  save(): void {
    const f = this.form();
    if (!f || !f.name.trim() || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    const payload: SectionInput = {
      name: f.name.trim(), color: f.color, icon: f.icon,
      codePrefix: f.codePrefix?.trim() || undefined, displayOrder: f.displayOrder,
    };
    const req = f.id == null ? this.api.createSection(payload) : this.api.updateSection(f.id, payload);
    req.subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.reload(); },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.title ?? 'No se pudo guardar la sección.');
      },
    });
  }

  remove(s: Section): void {
    if (!confirm(`¿Eliminar la sección «${s.name}»?`)) return;
    this.api.deleteSection(s.id).subscribe({
      next: () => this.reload(),
      error: (err) => alert(err?.error?.title ?? 'No se pudo eliminar.'),
    });
  }
}
