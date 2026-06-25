# RedNorte Frontend

Front orientado a pruebas para la plataforma de gestión de listas de espera
hospitalarias **RedNorte**.

Provee una interfaz visual organizada **por historia de usuario** que permite
validar end-to-end los microservicios del backend, mostrando códigos HTTP,
DTOs reales, transiciones del State Pattern y manejo de errores.

> Proyecto académico — Fullstack III · Sección 001D · DuocUC · 2026
> Instructor: Alejandro Sepúlveda
> Equipo: Hernán Briceño · Vicente Carrasco · Franco Reyes · José Valdés

---

## Stack técnico

- **Vite** 8 (dev server + build)
- **React** 19
- **TypeScript** 5.9
- **Tailwind CSS** 4 (con `@tailwindcss/vite`)
- **Axios** para llamadas HTTP al BFF

---

## Arquitectura

```
Front (este repo)
    │
    ▼  HTTP (CORS)
BFF Gateway  (Spring Cloud Gateway MVC)
    │
    ├──► MS Lista de Espera     ◄── MySQL
    ├──► MS Portal Pacientes
    └──► MS Notificaciones      ◄── RabbitMQ
```

El front nunca habla directamente con los microservicios, todo pasa por el BFF
en `http://localhost:8090`.

---

## Historias de usuario implementadas

| HU | Rol | Descripción | Endpoint principal |
|----|-----|-------------|--------------------|
| **HU-09** | Médico | Listar especialidades activas | `GET /lista-espera/especialidades` |
| **HU-01** | Médico | Registrar solicitud con priorización automática | `POST /lista-espera/solicitudes` |
| **HU-02** | Médico | Consultar lista de espera con filtros y detalle | `GET /lista-espera/solicitudes` |
| **HU-03** | Médico | Cambiar estado de una solicitud (State Pattern) | `PATCH /lista-espera/solicitudes/{id}/estado` |
| **HU-08** | Paciente | Consultar mis solicitudes usando mi RUT | `GET /portal-pacientes/solicitudes` |

Cada panel cubre **tanto casos felices como casos negativos** (404, 400, 422),
con códigos HTTP visibles para facilitar la evaluación.

> Las HU-04, HU-05, HU-06 y HU-07 quedan fuera del alcance: dependen del
> MS Reasignación que no se construyó en este semestre.

---

## Estructura del proyecto

```
src/
├── api/                       Clientes HTTP organizados por dominio
│   ├── client.ts              axios + ApiResult<T> + safeRequest()
│   ├── especialidades.ts      Catálogo de especialidades
│   ├── solicitudes.ts         CRUD de solicitudes
│   ├── portal.ts              Endpoints del Portal Pacientes
│   └── tipos-vulnerabilidad.ts  Catálogo hardcodeado (no hay endpoint backend)
│
├── components/                Componentes reutilizables
│   ├── Layout.tsx             Sidebar + área principal
│   └── EscenarioCard.tsx      Card de escenario con badge HTTP esperado/real
│
├── paneles/                   Un archivo por HU
│   ├── HU09_Especialidades.tsx
│   ├── HU01_RegistrarSolicitud.tsx
│   ├── HU02_ConsultarLista.tsx
│   ├── HU03_CambiarEstado.tsx
│   └── HU08_PortalPaciente.tsx
│
├── types/
│   └── api.ts                 Tipos espejo de los DTOs del backend
│
├── utils/
│   └── transiciones.ts        State Pattern: mapa de transiciones válidas
│
├── App.tsx                    Registra paneles en el Layout
├── main.tsx                   Entry point de React
└── index.css                  Tailwind + clase .input reutilizable
```

---

## Cómo levantar el proyecto

### Pre-requisitos

- Node.js 20+ y npm
- El stack Docker del backend corriendo en `localhost:8090`
  (ver el repo [`rednorte-docker-test`](https://github.com/Fullstack3RedNorte/rednorte-docker-test))

### Pasos

```bash
# 1. Clonar el repo
git clone https://github.com/Fullstack3RedNorte/rednorte-frontend.git
cd rednorte-frontend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env si tu BFF no está en localhost:8090

# 4. Levantar el servidor de desarrollo
npm run dev
```

El front abre en `http://localhost:5173/`.

### Verificación rápida

1. Asegurarte de que el stack Docker está arriba:
   ```bash
   docker compose ps
   ```
2. Probar que el BFF responde:
   ```bash
   curl http://localhost:8090/bff/lista-espera/especialidades
   ```
   Debe devolver 4 especialidades.
3. Abrir `http://localhost:5173/`, ir a HU-09 → click "Ejecutar".
   Si aparece badge VERDE 200 con 4 especialidades, todo funciona.

---

## Variables de entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `VITE_BFF_URL` | URL base del BFF Gateway | `http://localhost:8090` |

Vite solo expone al frontend variables que empiezan con `VITE_`.
El archivo `.env` NO se sube al repo (está en `.gitignore`).
Usa `.env.example` como plantilla.

---

## Patrón de diseño del front

### `ApiResult<T>` — discriminated union

Todas las llamadas al BFF devuelven un `ApiResult<T>`:

```ts
type ApiResult<T> =
  | { ok: true;  data: T;     status: number }
  | { ok: false; error: string; status: number | null }
```

Esto evita usar `try/catch` en los componentes y permite renderizar el estado
de error directamente, validando con `if (result.ok)`.

### `safeRequest()` — wrapper de axios

Convierte excepciones de axios en `ApiResult` con código HTTP y mensaje:

```ts
const res = await safeRequest(() => apiClient.get('/algo'))
if (res.ok) { /* res.data */ } else { /* res.error, res.status */ }
```

### Componente `EscenarioCard<T>`

Card reutilizable que muestra:
- Código HTTP **esperado** (verde para éxito, rojo para error)
- Código HTTP **real** (verde si coincide, naranja si difiere)
- Botón "Ejecutar"
- Resultado renderizado con prop `renderExito`

Usado en HU-01 (7 escenarios) y HU-03 (6 escenarios).

---

## Decisiones de diseño documentadas

**Tipos espejo del backend en `src/types/api.ts`** — replicamos las
interfaces de los DTOs Java a mano. Costo bajo (~100 líneas), beneficio alto:
autocompletado en todos los paneles.

**`tipos-vulnerabilidad.ts` hardcodeado** — el backend no expone endpoint para
listar tipos de vulnerabilidad. Mantenemos un catálogo espejo del `data.sql`.
Documentado como deuda técnica.

**Layout por panel, no por ruta** — usamos state interno en lugar de
React Router porque cada HU es una "vista de pruebas" autocontenida.

**Lenguaje distinto para HU-08** — el portal del paciente usa frases
amigables ("Su cita:", "hace X días") y oculta detalles técnicos visibles
en HU-02 (RUT funcionario, prioridad numérica, etc.).

**State Pattern en `utils/transiciones.ts`** — el mapa de transiciones
válidas vive en un único archivo, espejo de la lógica del backend. Permite
filtrar dinámicamente las opciones del dropdown en HU-03.

---

## Scripts disponibles

```bash
npm run dev       # Servidor de desarrollo (Vite + HMR)
npm run build     # Build de producción → dist/
npm run preview   # Previsualiza el build
npm run lint      # Linter ESLint
```

---

## Deudas técnicas conocidas

Las mismas que están documentadas en el doc `Historias de Usuario v2.1` del
proyecto general. Resumen relevante al front:

- **Tipos de vulnerabilidad hardcodeados** (mencionado arriba).
- **MS Reasignación no implementado** → HU-04/05/06/07 fuera del alcance.
- **`fechaCita` enviada como string ISO sin zona horaria.** El backend acepta
  el formato `YYYY-MM-DDTHH:mm:ss` y no realiza conversión. Si en el futuro
  se trabaja con múltiples zonas horarias, hay que ajustar.

---

## Stack Docker que debe estar arriba para que el front funcione

Servicios del repo `rednorte-docker-test`:

| Servicio | Puerto | Función |
|----------|--------|---------|
| `bff-gateway` | 8090 | Punto de entrada del front |
| `ms-lista-espera` | 8085 | Gestión de solicitudes |
| `ms-portal-pacientes` | 8088 | Acceso del paciente |
| `ms-notificaciones` | 8087 | Listener RabbitMQ |
| `mysql` | 3306 | BD con 3 esquemas |
| `rabbitmq` | 5672 / 15672 | Mensajería |

Para levantar: ver README del repo `rednorte-docker-test`.
