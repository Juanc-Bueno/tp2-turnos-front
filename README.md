# Programación IV — Sistema de turnos (front-end de clientes)

Interfaz web para que los clientes de una peluquería / centro de estética reserven y gestionen sus
turnos. Consume la API Rails del repositorio de back-end (`tp1-turnos`).

| | |
|---|---|
| Temática | Turnos online para una peluquería / centro de estética |
| Integrantes | Fernando Sarquis · Juan Cruz Bueno |
| Modalidad | Grupo (2 personas) |
| Autor del back-end original | Fernando Sarquis (TP 1) |
| Responsables | Back-end: Fernando Sarquis · Front-end: Juan Cruz Bueno |
| Framework | Vue 3 + Vite, JavaScript, Vue Router |
| Back-end | Repositorio `tp1-turnos` (Ruby on Rails): <https://github.com/Ferxxo-sar/tp1-turnos> |
| Contrato de la API | [`docs/API.md`](https://github.com/Ferxxo-sar/tp1-turnos/blob/main/docs/API.md) en el repositorio del back-end |
| Deploy | No realizado |

El back-office (`/admin`) sigue siendo el de Rails; este front es solo para clientes.

## Funcionalidades

| Pantalla | Ruta | Acceso |
|---|---|---|
| Inicio: profesionales (búsqueda) y servicios (filtro por categoría y búsqueda) | `/` | Público |
| Horarios libres de un profesional por día | `/profesionales/:id` | Público |
| Ingresar | `/ingresar` | Solo sin sesión |
| Crear cuenta | `/registro` | Solo sin sesión |
| Reservar: servicios, profesional, fecha y horarios según la duración | `/reservar` | Cliente |
| Mis turnos: próximos e historial | `/mis-turnos` | Cliente |
| Detalle del turno, cancelar | `/mis-turnos/:id` | Cliente |
| Reprogramar turno | `/mis-turnos/:id/reprogramar` | Cliente |
| Mi perfil: datos y cambio de contraseña | `/perfil` | Cliente |

Experiencia de usuario:

- Estados de carga, vacío y error en cada pantalla que consulta la API, con botón **Reintentar**.
- Validación de formularios antes de enviar y errores de la API mostrados debajo de cada campo.
- Botones deshabilitados mientras hay un envío en curso (no hay envíos repetidos).
- Avisos de confirmación ("Turno reservado", "Turno cancelado", etc.).
- Si el token vence o se invalida, se cierra la sesión local y se pide ingresar de nuevo, volviendo
  después a la página donde estaba.
- Navegable con teclado: enlace "Saltar al contenido", foco al cambiar de pantalla, pestañas con
  flechas, etiquetas en todos los campos y `aria-invalid`/`aria-describedby` en los errores.
- Diseño adaptable a pantallas chicas. Usa el mismo sistema visual que las vistas de Rails
  (`src/assets/base.css` es una copia de los estilos del back-end).

## Requisitos

- Node.js 20 o superior (probado con Node 24.15 y npm 11.12).
- El back-end corriendo (por defecto en `http://localhost:3000`) con su base preparada y los seeds
  cargados. Ver el README del back-end.

## Instalación y ejecución

```bash
npm install
cp .env.example .env.local   # opcional: ajustar la URL de la API
npm run dev                  # http://localhost:5173
```

Variables de entorno (`.env.example`, sin secretos):

| Variable | Por defecto | Descripción |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000/api/v1` | URL base de la API Rails |
| `VITE_BUSINESS_NAME` | `Estudio Turnos` | Nombre del negocio en el encabezado |

El origen del front (`http://localhost:5173`) tiene que estar permitido en la variable
`CORS_ORIGINS` del back-end; ya está incluido por defecto.

### Usuarios de prueba

Los crea `bin/rails db:seed` en el back-end:

| Rol | Email | Contraseña | Dónde |
|---|---|---|---|
| Cliente | `juan@mail.com` | `cliente123` | Este front (`/ingresar`) |
| Administrador | `admin@turnos.test` | `admin1234` | Back-office Rails (`http://localhost:3000/admin`) |

También se puede crear un cliente nuevo desde `/registro`.

## Pruebas y compilación

```bash
npm test          # Vitest + Vue Test Utils (jsdom)
npm run build     # compilación de producción en dist/
npm run preview   # sirve dist/ para probarlo
```

Las pruebas montan la aplicación completa con el router y simulan las respuestas de la API
reemplazando `fetch` (la demostración integrada usa la API real):

| Archivo | Qué prueba |
|---|---|
| `tests/login.spec.js` | Login correcto (guarda el token y vuelve a la página pedida), credenciales inválidas (muestra el error de la API), validación local y bloqueo del doble envío |
| `tests/booking.spec.js` | Reserva completa (petición enviada y redirección al detalle), horario tomado por otro cliente (error `422` por campo y refresco de horarios), validación local y reintento si falla la carga |
| `tests/screens.spec.js` | Cada pantalla con datos simulados: filtro por categoría, horarios de un profesional, profesional inexistente, pestañas de mis turnos, cancelar con confirmación, reprogramar, perfil (guardado y error de contraseña), token vencido y 404 |
| `tests/api-client.spec.js` | Token solo en rutas protegidas, cierre de sesión ante `401`, error de red legible, formato de fechas |

## Estructura

```
src/
  api/client.js        fetch + manejo de errores (ApiError) y token
  api/index.js         una función por endpoint de la API
  stores/session.js    sesión del cliente (token y datos, persistidos en localStorage)
  stores/toast.js      avisos de confirmación/error
  composables/         useAsync (carga/error/reintento) y useForm (validación y envío)
  components/          piezas reutilizables (estados, selector de horarios, turno, etc.)
  views/               una vista por pantalla
  router/index.js      rutas y guardas de sesión
  utils/               formato de fechas y montos, validaciones
tests/                 pruebas automatizadas
```

### Decisiones

- **Sin librería de estado**: la sesión es un objeto reactivo de Vue; alcanza para este alcance.
- **Horas del local**: la API devuelve fechas con huso `-03:00`; se muestran tal cual vienen para que
  un navegador en otra zona horaria no las corra.
- **Horarios según duración**: al elegir servicios, el front pide la disponibilidad con
  `service_ids[]` y solo ofrece horarios donde entra el turno completo. Si el horario elegido deja de
  estar libre, se descarta.
