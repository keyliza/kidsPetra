import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api';
import { AgeGroup, Lesson, LessonFile, Section } from '../../core/models';
import { IconComponent } from '../../shared/icon';
import { PdfTarget, PdfViewerComponent } from '../../shared/pdf-viewer';

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

@Component({
  selector: 'app-catalog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, IconComponent, PdfViewerComponent],
  templateUrl: './catalog.html',
})
export class CatalogComponent {
  private api = inject(ApiService);

  sections = signal<Section[]>([]);
  ageGroups = signal<AgeGroup[]>([]);
  private lessons = signal<Lesson[]>([]);
  loading = signal(true);
  error = signal(false);

  query = signal('');
  selectedSection = signal<number | null>(null);
  selectedAge = signal<number | null>(null);
  viewerTarget = signal<PdfTarget | null>(null);

  private isMobile = matchMedia('(max-width: 767px)');

  filtered = computed<Lesson[]>(() => {
    const q = normalize(this.query().trim());
    const section = this.selectedSection();
    const age = this.selectedAge();
    return this.lessons().filter((l) => {
      if (section != null && l.sectionId !== section) return false;
      if (age != null && !l.files.some((f) => f.ageGroupId === age && f.url)) return false;
      if (q && !normalize(l.title).includes(q)) return false;
      return true;
    });
  });

  totalLessons = computed(() => this.lessons().length);

  constructor() {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(false);
    let pending = 3;
    const done = () => {
      if (--pending === 0) {
        this.loading.set(false);
        this.checkDeepLink();
      }
    };
    const fail = () => { this.error.set(true); this.loading.set(false); };

    this.api.getSections().subscribe({ next: (s) => { this.sections.set(s); done(); }, error: fail });
    this.api.getAgeGroups().subscribe({ next: (a) => { this.ageGroups.set(a); done(); }, error: fail });
    this.api.getLessons().subscribe({ next: (l) => { this.lessons.set(l); done(); }, error: fail });
  }

  private checkDeepLink(): void {
    const params = new URLSearchParams(window.location.search);
    const lessonIdStr = params.get('lesson');
    const fileIdStr = params.get('file');
    if (lessonIdStr && fileIdStr) {
      const lessonId = parseInt(lessonIdStr, 10);
      const fileId = parseInt(fileIdStr, 10);
      const lesson = this.lessons().find((l) => l.id === lessonId);
      if (lesson) {
        const file = lesson.files.find((f) => f.id === fileId && f.url);
        if (file) {
          this.viewerTarget.set({ title: `${lesson.title} · ${file.ageGroupName}`, url: file.url! });
        }
      }
    }
  }

  toggleSection(id: number): void {
    this.selectedSection.update((cur) => (cur === id ? null : id));
  }
  toggleAge(id: number): void {
    this.selectedAge.update((cur) => (cur === id ? null : id));
  }
  clearFilters(): void {
    this.selectedSection.set(null);
    this.selectedAge.set(null);
    this.query.set('');
  }

  /** Archivos con URL, ordenados por edad, para una lección. */
  availableFiles(lesson: Lesson): LessonFile[] {
    return lesson.files.filter((f) => f.url);
  }

  openFile(lesson: Lesson, file: LessonFile): void {
    if (!file.url) return;
    if (this.isMobile.matches) {
      window.open(file.url, '_blank', 'noopener');
      return;
    }
    this.viewerTarget.set({ title: `${lesson.title} · ${file.ageGroupName}`, url: file.url });
  }

  shareFile(lesson: Lesson, file: LessonFile, event: MouseEvent): void {
    event.stopPropagation();
    if (!file.url) return;

    const shareUrl = `${window.location.origin}${window.location.pathname}?lesson=${lesson.id}&file=${file.id}`;

    if (navigator.share) {
      navigator.share({
        title: `${lesson.title} - ${file.ageGroupName}`,
        text: `Lección bíblica: ${lesson.title} (${file.ageGroupName})`,
        url: shareUrl
      }).catch((err) => {
        console.log('Error sharing:', err);
      });
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('¡Enlace de compartir copiado al portapapeles!');
      }).catch((err) => {
        console.error('Error al copiar al portapapeles:', err);
      });
    }
  }

  closeViewer(): void {
    this.viewerTarget.set(null);
  }

  sectionById(id: number): Section | undefined {
    return this.sections().find((s) => s.id === id);
  }
}
