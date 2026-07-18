# Petra Kids — Guía de despliegue

Biblioteca de lecciones bíblicas para la **Iglesia Bíblica Petra, Matagalpa**.
Stack: **Angular 22** (Nginx) · **ASP.NET Core 10** (Web API) · **SQL Server 2022**.

---

## 1. Estructura del proyecto

```
Petra Kids/
├─ backend/                 # API ASP.NET Core 10 (Clean Architecture)
│  ├─ src/
│  │  ├─ PetraKids.Domain/          # Entidades
│  │  ├─ PetraKids.Application/     # DTOs, interfaces, mapeos
│  │  ├─ PetraKids.Infrastructure/  # EF Core, DbContext, seed, auth, importador
│  │  └─ PetraKids.Api/             # Controllers, Program.cs, config
│  └─ Dockerfile
├─ frontend/                # Angular 22 (standalone + signals + Tailwind)
│  ├─ src/app/
│  │  ├─ core/              # ApiService, AuthService, interceptor, guards
│  │  ├─ shared/            # Íconos, visor PDF
│  │  └─ features/          # catalog (público) + admin (panel)
│  ├─ nginx.conf
│  └─ Dockerfile
├─ docker-compose.yml       # frontend + api + sqlserver (+ volumen)
├─ .env.example
└─ README-DESPLIEGUE.md
```

---

## 2. Correr en local con Docker

Requisitos: Docker + Docker Compose.

```bash
cp .env.example .env          # y edita los valores (contraseñas, secreto JWT)
docker compose up -d --build
```

- Frontend: <http://localhost:8080>
- La API queda interna; el frontend la consume vía `/api` (proxy de Nginx).
- El primer arranque crea la base de datos, aplica migraciones, siembra las
  secciones/edades y crea el usuario admin (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).

Ver logs / detener:

```bash
docker compose logs -f api
docker compose down            # conserva los datos (volumen sqldata)
docker compose down -v         # BORRA también la base de datos
```

---

## 3. Correr en modo desarrollo (sin Docker)

Necesitas **.NET 10 SDK**, **Node 20+** y una instancia de **SQL Server**
(o LocalDB en Windows).

### API

```bash
cd backend
# Ajusta la cadena de conexión y el secreto en
# src/PetraKids.Api/appsettings.Development.json
dotnet watch --project src/PetraKids.Api
```

La API queda en `http://localhost:5200` (Swagger/OpenAPI en `/openapi/v1.json`).

### Frontend

```bash
cd frontend
npm install
npm start                      # ng serve en http://localhost:4200
```

El `proxy.conf.json` reenvía `/api` a `http://localhost:5200`, así que no hay
CORS en desarrollo. Si cambias el puerto de la API, actualízalo ahí.

---

## 4. Despliegue en Dokploy (VPS)

Dokploy gestiona el reverse proxy (Traefik), los dominios y el SSL por encima
de los contenedores. Pasos:

### 4.1. Subir el código

Sube este repositorio a GitHub/GitLab (o usa el despliegue por Git de Dokploy).
Asegúrate de que `.env` **no** esté en el repo (ya está en `.gitignore`).

### 4.2. Crear el proyecto

1. En Dokploy: **Create Project → Compose**.
2. **Source**: conecta el repositorio y la rama (`main`).
3. **Compose Path**: `docker-compose.yml` (raíz del repo).

### 4.3. Variables de entorno

En la pestaña **Environment** del servicio Compose, pega el contenido de
`.env.example` con tus valores reales. Imprescindibles:

| Variable         | Descripción                                              |
|------------------|----------------------------------------------------------|
| `SA_PASSWORD`    | Contraseña de SQL Server (fuerte, 8+ con símbolos).      |
| `JWT_SECRET`     | Secreto de firma JWT (**32+ caracteres** aleatorios).    |
| `ADMIN_EMAIL`    | Correo del admin inicial.                                |
| `ADMIN_PASSWORD` | Contraseña del admin inicial.                            |
| `CORS_ORIGINS`   | Dominio público del frontend (ej. `https://petrakids.petramatagalpa.com`). |

Genera el secreto JWT con: `openssl rand -base64 48`.

### 4.4. Dominio y SSL

1. En el servicio **frontend**, sección **Domains**: agrega tu dominio
   (ej. `petrakids.petramatagalpa.com`) apuntando al **puerto 80** del contenedor.
2. Activa **HTTPS / Let's Encrypt**: Dokploy emite el certificado automáticamente.
3. En tu DNS, crea un registro **A** del subdominio hacia la IP del VPS.
4. **No** publiques la API ni SQL Server: el frontend habla con la API por la red
   interna de Docker (`http://api:8080`) y la API con SQL Server (`sqlserver:1433`).

### 4.5. Desplegar

Pulsa **Deploy**. Dokploy construye las imágenes y levanta los tres servicios.
El volumen `sqldata` persiste la base de datos entre redeploys.

### 4.6. Primer ingreso

Entra a `https://tu-dominio/admin` con el `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
Desde el panel puedes crear secciones/lecciones o usar **Importar** para cargar
en masa los PDFs (una URL de Google Drive por línea).

---

## 5. Notas de operación

- **Backups**: respalda el volumen `sqldata` (o programa copias de la BD).
- **Cambiar la contraseña del admin**: actualiza `ADMIN_PASSWORD` **antes** del
  primer arranque. Si el usuario ya existe, el seed no lo sobrescribe; cambia la
  clave desde la base de datos o crea un endpoint/flujo para ello.
- **Importador**: detecta la sección por el *prefijo de código* de cada sección
  (editable en el panel), el número y la edad a partir del nombre del archivo
  (`OT01 - 0+ bebes.pdf`, `NT07 M.pdf`; B=bebés, M=menores de 5, N=niños 5–10, A=adolescentes).
- **Escalar**: para producción real considera cambiar `MSSQL_PID` a una edición
  con licencia adecuada.
