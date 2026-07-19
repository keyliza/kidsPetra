const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'drive_files.csv');
const outputPath = path.join(__dirname, '..', 'public', 'data.json');

console.log('Iniciando lectura de CSV:', csvPath);

if (!fs.existsSync(csvPath)) {
  console.error(`Error: No se encontró el archivo CSV en la ruta: ${csvPath}`);
  console.log('Por favor, exporta el listado de Google Sheets como "drive_files.csv" en la carpeta "frontend/".');
  process.exit(1);
}

const content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split(/\r?\n/);
if (lines.length < 2) {
  console.error('Error: El archivo CSV está vacío o no contiene filas.');
  process.exit(1);
}

// Estructuras estáticas de configuración
const sections = [
  { id: 1, name: "Antiguo Testamento", slug: "antiguo-testamento", color: "#F97316", icon: "scroll", codePrefix: "OT", displayOrder: 1, lessonCount: 0 },
  { id: 2, name: "Nuevo Testamento", slug: "nuevo-testamento", color: "#0EA5E9", icon: "book-open", codePrefix: "NT", displayOrder: 2, lessonCount: 0 },
  { id: 3, name: "Navidad", slug: "navidad", color: "#EF4444", icon: "gift", codePrefix: "NAV", displayOrder: 3, lessonCount: 0 },
  { id: 4, name: "Pascua", slug: "pascua", color: "#8B5CF6", icon: "egg", codePrefix: "PAS", displayOrder: 4, lessonCount: 0 },
  { id: 5, name: "El Espíritu Santo", slug: "espiritu-santo", color: "#10B981", icon: "flame", codePrefix: "ES", displayOrder: 5, lessonCount: 0 },
  { id: 6, name: "Los Colores de la Navidad", slug: "los-colores-de-la-navidad", color: "#F43F5E", icon: "palette", codePrefix: "COLNAV", displayOrder: 6, lessonCount: 0 },
  { id: 7, name: "Reflexiones Lunares", slug: "reflexiones-lunares", color: "#64748B", icon: "moon", codePrefix: "REF", displayOrder: 7, lessonCount: 0 }
];

const ageGroups = [
  { id: 1, name: "Bebés (0+)", code: "B", minAge: 0, displayOrder: 1 },
  { id: 2, name: "Menores de 5", code: "M", minAge: 3, displayOrder: 2 },
  { id: 3, name: "Niños de 5 a 10", code: "N", minAge: 5, displayOrder: 3 },
  { id: 4, name: "Adolescentes", code: "A", minAge: 11, displayOrder: 4 }
];

const ageGroupIds = { "B": 1, "M": 2, "N": 3, "A": 4 };
const ageGroupNames = { "B": "Bebés (0+)", "M": "Menores de 5", "N": "Niños de 5 a 10", "A": "Adolescentes" };

// Parsear CSV de forma simple
const lessonsMap = {};
const lessonsList = [];
let fileIdCounter = 1;
let lessonIdCounter = 1;

// La primera línea es la cabecera: Section,LessonDir,FileName,DriveUrl
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  // Soportar comillas simples o dobles en CSV por comas
  // Ejemplo: "01 - Antiguo Testamento","01 - La creación","1 - Bebés (0+).pdf","https://..."
  const regex = /("([^"]*)"|([^,]*))(,|$)/g;
  const cols = [];
  let match;
  while ((match = regex.exec(line)) !== null) {
    let val = match[2] !== undefined ? match[2] : match[3];
    cols.push(val.trim());
    if (regex.lastIndex >= line.length || line[regex.lastIndex - 1] !== ',') {
      break;
    }
  }

  if (cols.length < 4) continue;

  const [sectionDir, lessonDir, fileName, driveUrl] = cols;

  // 1. Determinar Sección
  let sectionObj = null;
  if (/Antiguo/i.test(sectionDir)) sectionObj = sections[0];
  else if (/Nuevo/i.test(sectionDir)) sectionObj = sections[1];
  else if (/Colores/i.test(sectionDir)) sectionObj = sections[5];
  else if (/Navidad/i.test(sectionDir)) sectionObj = sections[2];
  else if (/Pascua/i.test(sectionDir)) sectionObj = sections[3];
  else if (/Esp/i.test(sectionDir)) sectionObj = sections[4];
  else if (/Lunar/i.test(sectionDir)) sectionObj = sections[6];

  if (!sectionObj) continue;

  // 2. Extraer número y título de lección
  let lessonNumber = null;
  let lessonTitle = "";

  const matchNum = lessonDir.match(/^(\d+)\s*[-_\u2013\u2014]\s*(.*)$/);
  if (matchNum) {
    lessonNumber = parseInt(matchNum[1], 10);
    lessonTitle = matchNum[2].trim();
  } else {
    lessonTitle = lessonDir.trim();
  }

  // 3. Determinar Grupo de Edad
  let ageCode = "N";
  const lowerFileName = fileName.toLowerCase();
  if (lowerFileName.includes("beb") || lowerFileName.includes("0+")) {
    ageCode = "B";
  } else if (lowerFileName.includes("menor")) {
    ageCode = "M";
  } else if (lowerFileName.includes("adolesc")) {
    ageCode = "A";
  } else if (lowerFileName.includes("niño") || lowerFileName.includes("nino") || lowerFileName.includes("5 a 10")) {
    ageCode = "N";
  } else {
    // Intentar número de archivo si es jerárquico (1, 2, 3, 4)
    const fileNumMatch = fileName.match(/^(\d+)\s*[-_\u2013\u2014]/);
    if (fileNumMatch) {
      const num = parseInt(fileNumMatch[1], 10);
      if (num === 1) ageCode = "B";
      else if (num === 2) ageCode = "M";
      else if (num === 3) ageCode = "N";
      else if (num === 4) ageCode = "A";
    }
  }

  if (lessonNumber === null) {
    // Si no está numerada, le asignamos un número temporal o autoincremental
    lessonNumber = 999; 
  }

  const key = `${sectionObj.id}_${lessonNumber}`;

  const fileObj = {
    id: fileIdCounter++,
    ageGroupId: ageGroupIds[ageCode],
    ageGroupName: ageGroupNames[ageCode],
    ageGroupCode: ageCode,
    url: driveUrl
  };

  if (!lessonsMap[key]) {
    const lessonObj = {
      id: lessonIdCounter++,
      sectionId: sectionObj.id,
      sectionName: sectionObj.name,
      sectionColor: sectionObj.color,
      number: lessonNumber,
      title: lessonTitle,
      displayOrder: lessonNumber,
      files: [fileObj]
    };
    lessonsMap[key] = lessonObj;
    lessonsList.push(lessonObj);
  } else {
    lessonsMap[key].files.push(fileObj);
  }
}

// Ordenar lecciones por seccion y número
lessonsList.sort((a, b) => {
  if (a.sectionId !== b.sectionId) {
    return a.sectionId - b.sectionId;
  }
  return a.number - b.number;
});

// Corregir lecciones no numeradas autoincrementándolas dentro de su sección
const sectionCounters = {};
lessonsList.forEach((l) => {
  if (l.number === 999) {
    if (!sectionCounters[l.sectionId]) {
      const maxNum = Math.max(...lessonsList.filter(o => o.sectionId === l.sectionId && o.number !== 999).map(o => o.number), 0);
      sectionCounters[l.sectionId] = maxNum + 1;
    }
    l.number = sectionCounters[l.sectionId]++;
    l.displayOrder = l.number;
  }
});

// Re-ordenar tras corregir números
lessonsList.sort((a, b) => {
  if (a.sectionId !== b.sectionId) {
    return a.sectionId - b.sectionId;
  }
  return a.number - b.number;
});

// Recalcular conteo por sección
sections.forEach((s) => {
  s.lessonCount = lessonsList.filter((l) => l.sectionId === s.id).length;
});

// Escribir JSON
const dataJson = {
  sections: sections,
  ageGroups: ageGroups,
  lessons: lessonsList
};

fs.writeFileSync(outputPath, JSON.stringify(dataJson, null, 2), 'utf-8');

console.log('¡JSON generado con éxito!');
console.log(` - Lecciones registradas: ${lessonsList.length}`);
console.log(` - Archivos registrados: ${fileIdCounter - 1}`);
console.log(`Escrito en: ${outputPath}`);
