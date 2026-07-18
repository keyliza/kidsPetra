export interface AgeGroup {
  id: number;
  name: string;
  code: string;
  minAge: number;
  displayOrder: number;
}

export interface Section {
  id: number;
  name: string;
  slug: string;
  color: string;
  icon: string;
  codePrefix: string;
  displayOrder: number;
  lessonCount: number;
}

export interface LessonFile {
  id: number;
  ageGroupId: number;
  ageGroupName: string;
  ageGroupCode: string;
  url: string | null;
}

export interface Lesson {
  id: number;
  sectionId: number;
  sectionName: string;
  sectionColor: string;
  number: number;
  title: string;
  displayOrder: number;
  files: LessonFile[];
}

export interface User {
  id: number;
  email: string;
  role: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  user: User;
}

export interface SectionStat {
  sectionId: number;
  sectionName: string;
  color: string;
  lessonCount: number;
  fileCount: number;
  missingCount: number;
}

export interface AgeMissing {
  ageGroupId: number;
  ageGroupName: string;
  missingCount: number;
}

export interface Stats {
  totalLessons: number;
  totalFiles: number;
  totalSections: number;
  bySection: SectionStat[];
  missingByAge: AgeMissing[];
}

export interface ImportRowResult {
  source: string;
  ok: boolean;
  sectionPrefix: string | null;
  number: number | null;
  ageCode: string | null;
  message: string;
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  lessonsCreated: number;
  rows: ImportRowResult[];
}

// Payloads de escritura
export interface SectionInput {
  name: string;
  slug?: string;
  color: string;
  icon: string;
  codePrefix?: string;
  displayOrder: number;
}

export interface LessonInput {
  sectionId: number;
  number: number;
  title: string;
  displayOrder: number;
}

export interface LessonFileInput {
  ageGroupId: number;
  url?: string | null;
}
