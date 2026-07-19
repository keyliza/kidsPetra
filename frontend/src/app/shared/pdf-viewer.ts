import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IconComponent } from './icon';
import { downloadUrl, embedUrl } from './pdf-url';

export interface PdfTarget {
  title: string;
  url: string;
}

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm p-1.5 sm:p-6"
         role="dialog" aria-modal="true" [attr.aria-label]="target().title"
         (click)="onBackdrop($event)">
      <div class="mx-auto flex w-full max-w-5xl flex-1 flex-col overflow-hidden rounded-xl sm:rounded-3xl bg-white shadow-2xl"
           (click)="$event.stopPropagation()">
        <header class="flex items-center gap-1 sm:gap-3 border-b border-orange-100 bg-brand-50 px-2 py-1 sm:px-6 sm:py-3">
          <app-icon name="file" [size]="22" class="text-brand-600 shrink-0 hidden sm:block" />
          <h2 class="min-w-0 flex-1 truncate font-display text-[11px] font-bold text-ink sm:text-lg">{{ target().title }}</h2>
          <a [href]="download()" target="_blank" rel="noopener"
             class="inline-flex size-6 sm:size-auto sm:px-3 sm:py-1.5 items-center justify-center rounded-full bg-white text-brand-600 ring-1 ring-orange-200 transition hover:bg-brand-50"
             title="Descargar PDF">
            <app-icon name="download" [size]="12" class="sm:hidden" />
            <app-icon name="download" [size]="18" class="hidden sm:block" />
            <span class="hidden sm:inline">Descargar</span>
          </a>
          <a [href]="target().url" target="_blank" rel="noopener"
             class="inline-flex size-6 sm:size-auto sm:px-3 sm:py-1.5 items-center justify-center rounded-full bg-white text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
             title="Abrir en pestaña nueva">
            <app-icon name="external-link" [size]="12" class="sm:hidden" />
            <app-icon name="external-link" [size]="18" class="hidden sm:block" />
            <span class="hidden sm:inline">Abrir</span>
          </a>
          <button type="button" (click)="close.emit()" aria-label="Cerrar"
                  class="inline-flex size-6 sm:size-9 items-center justify-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 hover:text-ink">
            <app-icon name="x" [size]="12" class="sm:hidden" />
            <app-icon name="x" [size]="20" class="hidden sm:block" />
          </button>
        </header>
        <iframe [src]="safe()" class="w-full flex-1 border-0" [title]="target().title"></iframe>
      </div>
    </div>
  `,
  host: { '(document:keydown.escape)': 'close.emit()' },
})
export class PdfViewerComponent {
  private sanitizer = inject(DomSanitizer);
  target = input.required<PdfTarget>();
  close = output<void>();

  safe = computed<SafeResourceUrl>(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl(this.target().url)));
  download = computed(() => downloadUrl(this.target().url));

  onBackdrop(_: MouseEvent): void {
    this.close.emit();
  }
}
