import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { AgeGroup, Lesson, Section } from './models';

interface StaticData {
  sections: Section[];
  ageGroups: AgeGroup[];
  lessons: Lesson[];
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // Load and cache the static JSON file
  private cache$ = this.http.get<StaticData>('/data.json').pipe(
    shareReplay(1)
  );

  getSections(): Observable<Section[]> {
    return this.cache$.pipe(map((data) => data.sections));
  }

  getAgeGroups(): Observable<AgeGroup[]> {
    return this.cache$.pipe(map((data) => data.ageGroups));
  }

  getLessons(opts: { section?: number; age?: number; q?: string } = {}): Observable<Lesson[]> {
    return this.cache$.pipe(
      map((data) => {
        let list = data.lessons;
        if (opts.section != null) {
          list = list.filter((l) => l.sectionId === opts.section);
        }
        if (opts.age != null) {
          list = list.filter((l) => l.files.some((f) => f.ageGroupId === opts.age && f.url));
        }
        if (opts.q) {
          const query = opts.q.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
          list = list.filter((l) =>
            l.title.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').includes(query)
          );
        }
        return list;
      })
    );
  }
}
