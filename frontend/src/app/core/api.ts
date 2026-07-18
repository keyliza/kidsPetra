import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AgeGroup, ImportResult, Lesson, LessonFileInput, LessonInput,
  Section, SectionInput, Stats,
} from './models';

/** Base de la API. Mismo origen: en dev vía proxy, en producción vía nginx. */
export const API_BASE = '/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // ── Público ──
  getSections(): Observable<Section[]> {
    return this.http.get<Section[]>(`${API_BASE}/sections`);
  }

  getAgeGroups(): Observable<AgeGroup[]> {
    return this.http.get<AgeGroup[]>(`${API_BASE}/age-groups`);
  }

  getLessons(opts: { section?: number; age?: number; q?: string } = {}): Observable<Lesson[]> {
    let params = new HttpParams();
    if (opts.section != null) params = params.set('section', opts.section);
    if (opts.age != null) params = params.set('age', opts.age);
    if (opts.q) params = params.set('q', opts.q);
    return this.http.get<Lesson[]>(`${API_BASE}/lessons`, { params });
  }

  // ── Secciones (admin) ──
  createSection(input: SectionInput): Observable<Section> {
    return this.http.post<Section>(`${API_BASE}/sections`, input);
  }
  updateSection(id: number, input: SectionInput): Observable<Section> {
    return this.http.put<Section>(`${API_BASE}/sections/${id}`, input);
  }
  deleteSection(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/sections/${id}`);
  }

  // ── Lecciones (admin) ──
  createLesson(input: LessonInput): Observable<Lesson> {
    return this.http.post<Lesson>(`${API_BASE}/lessons`, input);
  }
  updateLesson(id: number, input: LessonInput): Observable<Lesson> {
    return this.http.put<Lesson>(`${API_BASE}/lessons/${id}`, input);
  }
  deleteLesson(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/lessons/${id}`);
  }
  reorderLessons(items: { id: number; displayOrder: number }[]): Observable<void> {
    return this.http.put<void>(`${API_BASE}/lessons/reorder`, items);
  }

  // ── Archivos por edad (admin) ──
  upsertFile(lessonId: number, input: LessonFileInput): Observable<Lesson> {
    return this.http.put<Lesson>(`${API_BASE}/lessons/${lessonId}/files`, input);
  }
  deleteFile(lessonId: number, ageGroupId: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/lessons/${lessonId}/files/${ageGroupId}`);
  }

  // ── Stats e importación (admin) ──
  getStats(): Observable<Stats> {
    return this.http.get<Stats>(`${API_BASE}/stats`);
  }
  import(text: string, dryRun: boolean): Observable<ImportResult> {
    return this.http.post<ImportResult>(`${API_BASE}/import`, { text, dryRun });
  }
}
