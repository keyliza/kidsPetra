import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api';
import { AgeGroup, Lesson, LessonInput, Section } from '../../../core/models';
import { IconComponent } from '../../../shared/icon';

interface LessonForm {
  id: number | null;
  sectionId: number;
  number: number;
  title: string;
}

@Component({
  selector: 'app-lessons-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, IconComponent],
  templateUrl: './lessons-admin.html',
})
export class LessonsAdminComponent {
  private api = inject(ApiService);

  sections = signal<Section[]>([]);
  ageGroups = signal<AgeGroup[]>([]);
  lessons = signal<Lesson[]>([]);
  loading = signal(true);
  saving = signal(false);

  sectionFilter = signal<number | null>(null);
  expandedId = signal<number | null>(null);
  form = signal<LessonForm | null>(null);
  fileDraft = signal<Record<number, string>>({});

  visible = computed(() => {
    const f = this.sectionFilter();
    const list = f == null ? this.lessons() : this.lessons().filter((l) => l.sectionId === f);
    return [...list];
  });

  constructor() {
    this.reload();
  }

  private reload(): void {
    this.loading.set(true);
    this.api.getSections().subscribe((s) => this.sections.set(s));
    this.api.getAgeGroups().subscribe((a) => this.ageGroups.set(a));
    this.api.getLessons().subscribe((l) => { this.lessons.set(l); this.loading.set(false); });
  }

  // ── Formulario de lección ──
  newLesson(): void {
    const sectionId = this.sectionFilter() ?? this.sections()[0]?.id ?? 0;
    const maxNumber = Math.max(0, ...this.lessons().filter((l) => l.sectionId === sectionId).map((l) => l.number));
    this.form.set({ id: null, sectionId, number: maxNumber + 1, title: '' });
  }
  editLesson(l: Lesson): void {
    this.form.set({ id: l.id, sectionId: l.sectionId, number: l.number, title: l.title });
  }
  closeForm(): void {
    this.form.set(null);
  }
  patchForm<K extends keyof LessonForm>(key: K, value: LessonForm[K]): void {
    const f = this.form();
    if (f) this.form.set({ ...f, [key]: value });
  }

  saveForm(): void {
    const f = this.form();
    if (!f || !f.title.trim() || this.saving()) return;
    this.saving.set(true);
    const payload: LessonInput = { sectionId: f.sectionId, number: f.number, title: f.title.trim(), displayOrder: f.number };
    const req = f.id == null ? this.api.createLesson(payload) : this.api.updateLesson(f.id, payload);
    req.subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.reloadLessons(); },
      error: () => this.saving.set(false),
    });
  }

  deleteLesson(l: Lesson): void {
    if (!confirm(`¿Eliminar la lección «${l.title}» y sus archivos?`)) return;
    this.api.deleteLesson(l.id).subscribe(() => this.reloadLessons());
  }

  // ── Reordenar dentro de la sección ──
  move(l: Lesson, dir: -1 | 1): void {
    const siblings = this.lessons()
      .filter((x) => x.sectionId === l.sectionId)
      .sort((a, b) => a.displayOrder - b.displayOrder || a.number - b.number);
    const i = siblings.findIndex((x) => x.id === l.id);
    const j = i + dir;
    if (j < 0 || j >= siblings.length) return;
    const a = siblings[i], b = siblings[j];
    const items = [{ id: a.id, displayOrder: b.displayOrder }, { id: b.id, displayOrder: a.displayOrder }];
    this.api.reorderLessons(items).subscribe(() => this.reloadLessons());
  }

  // ── Archivos por edad ──
  toggleFiles(l: Lesson): void {
    if (this.expandedId() === l.id) { this.expandedId.set(null); return; }
    const draft: Record<number, string> = {};
    for (const a of this.ageGroups()) {
      draft[a.id] = l.files.find((f) => f.ageGroupId === a.id)?.url ?? '';
    }
    this.fileDraft.set(draft);
    this.expandedId.set(l.id);
  }
  setDraft(ageId: number, url: string): void {
    this.fileDraft.set({ ...this.fileDraft(), [ageId]: url });
  }
  saveFile(lessonId: number, ageId: number): void {
    const url = (this.fileDraft()[ageId] ?? '').trim();
    this.api.upsertFile(lessonId, { ageGroupId: ageId, url: url || null }).subscribe((updated) => {
      this.replaceLesson(updated);
    });
  }
  clearFile(lessonId: number, ageId: number): void {
    this.setDraft(ageId, '');
    this.api.deleteFile(lessonId, ageId).subscribe(() => this.reloadLessons());
  }

  fileUrlFor(l: Lesson, ageId: number): string | null {
    return l.files.find((f) => f.ageGroupId === ageId)?.url ?? null;
  }
  sectionName(id: number): string {
    return this.sections().find((s) => s.id === id)?.name ?? '';
  }
  sectionColor(id: number): string {
    return this.sections().find((s) => s.id === id)?.color ?? '#94a3b8';
  }

  private reloadLessons(): void {
    this.api.getLessons().subscribe((l) => this.lessons.set(l));
  }
  private replaceLesson(updated: Lesson): void {
    this.lessons.set(this.lessons().map((l) => (l.id === updated.id ? updated : l)));
  }
}
