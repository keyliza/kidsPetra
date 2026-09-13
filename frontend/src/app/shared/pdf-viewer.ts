import { ChangeDetectionStrategy, Component, computed, inject, input, OnDestroy, output, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IconComponent } from './icon';
import { downloadUrl, embedUrl, fetchUrl } from './pdf-url';

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
          <button type="button" (click)="print()" [disabled]="isPrinting()"
                  class="inline-flex size-6 sm:size-auto sm:px-3 sm:py-1.5 items-center justify-center gap-1.5 rounded-full bg-white text-brand-600 ring-1 ring-orange-200 transition hover:bg-brand-50 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Imprimir" title="Imprimir">
            @if (isPrinting()) {
              <app-icon name="refresh" [size]="12" class="animate-spin sm:hidden" />
              <app-icon name="refresh" [size]="18" class="animate-spin hidden sm:block" />
              <span class="hidden sm:inline">Preparando…</span>
            } @else {
              <app-icon name="printer" [size]="12" class="sm:hidden" />
              <app-icon name="printer" [size]="18" class="hidden sm:block" />
              <span class="hidden sm:inline">Imprimir</span>
            }
          </button>
          <a [href]="download()" target="_blank" rel="noopener"
             class="inline-flex size-6 sm:size-auto sm:px-3 sm:py-1.5 items-center justify-center gap-1.5 rounded-full bg-white text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
             aria-label="Descargar PDF" title="Descargar PDF">
            <app-icon name="download" [size]="12" class="sm:hidden" />
            <app-icon name="download" [size]="18" class="hidden sm:block" />
            <span class="hidden sm:inline">Descargar</span>
          </a>
          <a [href]="target().url" target="_blank" rel="noopener"
             class="inline-flex size-6 sm:size-auto sm:px-3 sm:py-1.5 items-center justify-center gap-1.5 rounded-full bg-white text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
             aria-label="Abrir en pestaña nueva" title="Abrir en pestaña nueva">
            <app-icon name="external-link" [size]="12" class="sm:hidden" />
            <app-icon name="external-link" [size]="18" class="hidden sm:block" />
            <span class="hidden sm:inline">Abrir</span>
          </a>
          <button type="button" (click)="close.emit()" aria-label="Cerrar"
                  class="inline-flex size-6 sm:size-9 items-center justify-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 hover:text-ink cursor-pointer">
            <app-icon name="x" [size]="12" class="sm:hidden" />
            <app-icon name="x" [size]="20" class="hidden sm:block" />
          </button>
        </header>
        @if (printError()) {
          <p role="alert" class="border-b border-red-100 bg-red-50 px-2 py-1 text-[11px] text-red-700 sm:px-6 sm:text-sm">
            No se pudo preparar la impresión. Descargá el PDF y usá Ctrl+P.
          </p>
        }
        <div class="relative w-full flex-1 min-h-0">
          <div class="absolute right-0 top-0 z-10 h-12 w-14 bg-transparent pointer-events-auto"></div>
          <iframe [src]="safe()" class="h-full w-full border-0" [title]="target().title"></iframe>
        </div>
      </div>
    </div>
  `,
  host: { '(document:keydown.escape)': 'close.emit()' },
})
export class PdfViewerComponent implements OnDestroy {
  private sanitizer = inject(DomSanitizer);

  target = input.required<PdfTarget>();
  close = output<void>();

  safe = computed<SafeResourceUrl>(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl(this.target().url)));
  download = computed(() => downloadUrl(this.target().url));

  isPrinting = signal(false);
  printError = signal(false);

  private frame?: HTMLIFrameElement;
  private blobUrl?: string;

  /** Descarga el PDF y lo manda a imprimir. */
  async print(): Promise<void> {
    if (this.isPrinting()) return;
    this.isPrinting.set(true);
    this.printError.set(false);

    try {
      const res = await fetch(fetchUrl(this.target().url));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const bytes = await res.arrayBuffer();
      // Un proxy mal configurado responde 200 con el index.html del SPA; sin esta
      // comprobacion el iframe cargaria basura y print() fallaria en silencio.
      if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') {
        throw new Error('la respuesta no es un PDF');
      }
      // Drive responde application/octet-stream; hay que re-etiquetar el blob
      // para que el visor nativo del navegador lo renderice dentro del iframe.
      const blob = new Blob([bytes], { type: 'application/pdf' });

      if (await this.shareToSystem(blob)) return;
      this.printViaFrame(blob);
    } catch (e) {
      console.error('No se pudo imprimir:', e);
      this.isPrinting.set(false);
      this.printError.set(true);
    }
  }

  /**
   * En movil ningun navegador renderiza un PDF dentro de un iframe, asi que
   * print() no tiene a que apuntar. La via nativa es la hoja de compartir del
   * sistema, que lleva "Imprimir" entre sus destinos.
   * Devuelve true si se hizo cargo; false para seguir con el iframe.
   */
  private async shareToSystem(blob: Blob): Promise<boolean> {
    if (!matchMedia('(pointer: coarse)').matches) return false;

    const name = this.target().title.replace(/\//g, '-');
    const file = new File([blob], `${name}.pdf`, { type: 'application/pdf' });
    if (!navigator.canShare?.({ files: [file] })) return false;

    try {
      await navigator.share({ files: [file] });
    } catch (e) {
      // La descarga pudo agotar la activacion de usuario que exige share():
      // en ese caso volvemos al iframe. Si solo cancelo, no hay nada que hacer.
      if ((e as Error).name !== 'AbortError') return false;
    }
    this.isPrinting.set(false);
    return true;
  }

  private printViaFrame(blob: Blob): void {
    this.release();
    this.blobUrl = URL.createObjectURL(blob);

    const frame = document.createElement('iframe');
    // Invisible pero con layout: con display:none el visor de PDF no carga.
    frame.setAttribute('style', 'position:absolute;width:0;height:0;border:0;visibility:hidden');
    frame.src = this.blobUrl;
    frame.onload = () => {
      this.isPrinting.set(false);
      try {
        frame.contentWindow!.focus();
        frame.contentWindow!.print();
      } catch {
        // Safari no permite imprimir un PDF embebido: abrirlo aparte.
        if (!window.open(this.blobUrl!, '_blank')) this.printError.set(true);
      }
    };
    document.body.appendChild(frame);
    this.frame = frame;
  }

  private release(): void {
    this.frame?.remove();
    this.frame = undefined;
    if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
    this.blobUrl = undefined;
  }

  ngOnDestroy(): void {
    this.release();
  }

  onBackdrop(_: MouseEvent): void {
    this.close.emit();
  }
}
