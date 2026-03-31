# Balances Diálisis App

Aplicación web en Angular para gestionar balances de fluidos, signos vitales y medicación de pacientes en tratamiento de diálisis peritoneal. Provee herramientas para el equipo médico desde la captura diaria hasta la generación de reportes calculados con exportación en PDF, flujo seguro de autenticación por roles y gestión de suscripciones mediante Stripe.

## Tabla de contenido
- [Tecnologías](#tecnologías)
- [Características principales](#características-principales)
- [Control de acceso por rol](#control-de-acceso-por-rol)
- [Arquitectura funcional](#arquitectura-funcional)
- [Rutas](#rutas)
- [Servicios core](#servicios-core)
- [Requisitos previos](#requisitos-previos)
- [Configuración](#configuración)
- [Scripts disponibles](#scripts-disponibles)
- [Variables y endpoints](#variables-y-endpoints)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Pruebas y verificación](#pruebas-y-verificación)
- [Convenciones clave](#convenciones-clave)

## Tecnologías
- Angular 19 (standalone components + Angular Material 19)
- RxJS 7.8 para composición de flujos asíncronos
- TypeScript 5.7
- SCSS con gradientes y blur para la identidad visual
- `jsencrypt` 3.5 para cifrar credenciales con RSA antes de llegar al backend
- Stripe (integración vía redirección al payment gateway del backend)
- Servicios REST expuestos por el backend en `https://gestor-balance-dialisis-production.up.railway.app`

## Características principales

### Autenticación y sesión
- Login con cifrado asimétrico RSA (llave pública vía `/api/auth/public-key`).
- Expiración automática: aviso de snackbar 60 segundos antes de vencer y cierre forzado al expirar (gestionado por `SessionTimerService`).
- Interceptor JWT adjunta `Authorization: Bearer` a cada petición protegida; ante `401` cierra sesión y redirige a `/login`.
- Logout dual: invalida el token en el backend (`/api/auth/logout`) y limpia `localStorage`.
- Registro de nuevos usuarios médicos (ADMIN) con contraseña cifrada.
- Recuperación de contraseña por correo electrónico.

### Control de acceso por rol
- Roles: **ADMIN** y **PATIENT** (decodificados desde el JWT).
- `RoleGuard` protege cada ruta según los roles permitidos.
- Los pacientes solo pueden ver su propio detalle; el guard valida que el `patientId` de la ruta coincida con el userId del token (previene acceso cruzado).
- `NoAuthGuard` redirige usuarios ya autenticados fuera de las pantallas públicas según su rol.

### Gestión de pacientes (ADMIN)
- Listado paginado de pacientes asignados al médico autenticado.
- Alta de paciente con nombre, edad, tipo de bolsa, correo y contraseña (cifrada) de acceso del paciente.
- Edición inline y eliminación con confirmación desde la tabla.
- Administración de catálogos propios de tipos de signos vitales y medicamentos (paneles embebidos en el dashboard).

### Detalle del paciente (ADMIN y PATIENT)
- **Balances de fluidos:** CRUD completo con fecha, descripción, volumen infundido y drenado. Filtro por rango de fechas. Las fechas permitidas se obtienen desde `FluidDateService` respetando ventanas horarias activas.
- **Líquidos extra:** registro diario de orina y líquido ingerido.
- **Signos vitales:** selección del tipo del catálogo + valor + fecha; historial por rango de fechas.
- **Medicamentos:** selección del medicamento del catálogo + dosis + frecuencia + fecha.

### Balance calculado y reportes
- Vista analítica que resume hasta 15 balances con `partialBalance`, `totalBalance`, `totalIngested`, `totalUrine` y `finalBalance`.
- Descarga de reporte PDF directamente desde el navegador.
- Envío del reporte PDF al correo electrónico del paciente desde el backend.

### Suscripciones y pagos (Stripe)
- Vista de selección de planes (`/dashboard/plans`) con tarjetas que muestran precio, nombre y listado de características.
- Lógica de contratación: si el usuario no tiene suscripción activa → `createPayment`; si ya tiene → `changeSubscription`; con opción de cancelar.
- Redirección al gateway de Stripe; retorno a `/payment-success` o `/payment-failure`.
- Indicador del plan activo (`PlanIndicatorButtonComponent`) visible en todas las rutas del dashboard.
- Actualización de método de pago y cancelación de suscripción desde el perfil.

### Perfil (ADMIN)
- Visualización del plan activo.
- Navegación a cambio de contraseña y selección de planes.
- Actualización de método de pago (redirige al gateway de Stripe).
- Cancelación de suscripción.

### Notificaciones globales
- Banner dismissible post-login que alerta al ADMIN sobre historial de balances obsoleto (`NotificationService`).
- Snackbars tipificados (éxito / error / info / confirmación) mediante `SnackbarService`.

## Control de acceso por rol

| Ruta | ADMIN | PATIENT | Sin sesión |
|---|---|---|---|
| `/login`, `/register`, `/recover-password` | Redirige al dashboard | Redirige a su detalle | ✓ |
| `/dashboard` | ✓ | ✗ | Redirige a `/login` |
| `/dashboard/plans` | ✓ | ✗ | Redirige a `/login` |
| `/dashboard/patient/:id` | ✓ (cualquier paciente) | ✓ (solo propio) | Redirige a `/login` |
| `/dashboard/patient/:id/.../calculated-balance` | ✓ | ✓ (solo propio) | Redirige a `/login` |
| `/profile` | ✓ | ✗ | Redirige a `/login` |
| `/update-password` | ✓ | ✓ | Redirige a `/login` |
| `/payment-success`, `/payment-failure` | ✓ | ✓ | ✓ |

## Arquitectura funcional
```mermaid
flowchart TD
    subgraph UI[Angular UI]
        A[Auth Screens]
        B[Dashboard - ADMIN]
        C[Patient Detail]
        D[Calculated Balance]
        E[Plans & Payments]
        F[Profile]
    end

    subgraph Core[Core Services]
        S1[AuthService + SessionTimer]
        S2[UserService]
        S3[PatientService]
        S4[FluidBalanceService]
        S5[Extra/Vital/Medicine Services]
        S6[CalculatedFluidBalanceService]
        S7[PlansService]
        S8[SubscriptionService]
        S9[PaymentService]
        S10[NotificationService]
    end

    subgraph API[Backend REST]
        R1[/api/auth]
        R2[/api/users]
        R3[/api/patients]
        R4[/api/fluid-balances]
        R5[/api/plans]
        R6[/api/subscriptions]
        R7[/api/payments → Stripe]
        R8[/api/notifications]
    end

    A -->|login/logout/recover| S1 --> R1
    A -->|register/update pwd| S2 --> R2
    B -->|list/create/edit/delete| S3 --> R3
    C -->|balances CRUD| S4 --> R4
    C -->|extra fluid/vitals/medicines| S5 --> R3
    D -->|calculated + PDF + email| S6 --> R4
    E -->|list plans| S7 --> R5
    E -->|check subscription| S8 --> R6
    E -->|create/change/cancel| S9 --> R7
    F -->|change cards/cancel| S9 --> R7
    B -->|login notification| S10 --> R8
```

## Rutas

| Ruta | Componente | Guards | Roles |
|---|---|---|---|
| `/login` | `LoginComponent` | `NoAuthGuard` | — |
| `/register` | `RegisterUserComponent` | `NoAuthGuard` | — |
| `/recover-password` | `RecoverPasswordComponent` | `NoAuthGuard` | — |
| `/dashboard` | `DashboardComponent` | `AuthGuard`, `RoleGuard` | ADMIN |
| `/dashboard/plans` | `PlanSelectionComponent` | `AuthGuard`, `RoleGuard` | ADMIN |
| `/dashboard/patient/:patientId` | `PatientDetailComponent` | `AuthGuard`, `RoleGuard` | ADMIN, PATIENT |
| `/dashboard/patient/:patientId/:label/calculated-balance` | `CalculatedFluidBalanceComponent` | `AuthGuard`, `RoleGuard` | ADMIN, PATIENT |
| `/profile` | `ProfileComponent` | `AuthGuard`, `RoleGuard` | ADMIN |
| `/update-password` | `UpdatePasswordComponent` | `AuthGuard` | ADMIN, PATIENT |
| `/payment-success` | `PaymentSuccessComponent` | — | — |
| `/payment-failure` | `PaymentFailureComponent` | — | — |

## Servicios core

| Servicio | Base endpoint | Descripción |
|---|---|---|
| `AuthService` | `/api/auth` | Login, logout, recuperación de contraseña, obtención de llave pública RSA, validación de expiración JWT. |
| `UserService` | `/api/users` | Registro de nuevos usuarios y actualización de contraseña cifrada. |
| `PatientService` | `/api/patients` | CRUD completo de pacientes. |
| `FluidBalanceService` | `/api/fluid-balances` | CRUD de registros de balance de fluidos por paciente y fecha. |
| `CalculatedFluidBalanceService` | `/api/fluid-balances` | Resumen analítico, descarga PDF y envío por correo. |
| `ExtraFluidService` | `/api/extra-fluids` | Registro de orina e ingesta diaria de fluidos. |
| `VitalSignService` | `/api/vital-signs` | Catálogo de tipos de signos vitales por usuario. |
| `VitalSignDetailService` | `/api/vital-signs/details` | Mediciones de signos vitales por paciente y fecha. |
| `MedicineService` | `/api/medicines` | Catálogo de medicamentos por usuario. |
| `MedicineDetailService` | `/api/medicines/details` | Asignación de medicamentos a pacientes. |
| `BagTypeService` | `/api/bag-types` | Catálogo de tipos de bolsa de diálisis (solo lectura). |
| `FluidDateService` | `/api/fluid-dates` | Fechas con ventanas horarias activas para registrar balances. |
| `PlansService` | `/api/plans` | Listado de planes de suscripción disponibles. |
| `SubscriptionService` | `/api/subscriptions` | Consulta y seguimiento del plan activo del usuario; expone `planName$` BehaviorSubject. |
| `PaymentService` | `/api/payments` | Contratar, cambiar, cancelar plan y actualizar método de pago vía Stripe. |
| `NotificationService` | `/api/notifications` | Notificación al ADMIN sobre historial de balances obsoleto; controla visibilidad del banner global. |
| `SessionTimerService` | — | Programa avisos y cierre de sesión automático basado en la expiración del JWT. |
| `SnackbarService` | — | Snackbars tipificados: éxito, error, info y confirmación (Observable). |

## Requisitos previos
- Node.js 18 LTS o superior
- npm 9+
- Backend disponible en `https://gestor-balance-dialisis-production.up.railway.app` (o ajustar servicios)

## Configuración
1. Instala dependencias
	```bash
	npm install
	```
2. Inicia el servidor de desarrollo
	```bash
	npm start
	```
	La app queda en `https://gestor-balances.rorideas.com/`.
3. (Opcional) Ejecuta `npm run build` para generar artefactos en `dist/`.

## Scripts disponibles
| Script           | Descripción                                        |
|------------------|----------------------------------------------------|
| `npm start`      | `ng serve` con recarga en vivo.                    |
| `npm run build`  | Compila en modo producción.                        |
| `npm test`       | Ejecuta unit tests vía Karma/Jasmine.              |
| `npm run lint`   | (Configurable) Ejecuta linters cuando se añadan.   |

## Variables y endpoints
- Todos los servicios usan rutas absolutas a `https://gestor-balance-dialisis-production.up.railway.app`. Ajusta estas URLs dentro de `src/app/core/service/util/utility.ts` (`getHostUrl()`) si necesitas apuntar a otro host.
- El JWT se almacena en `localStorage` bajo la llave `token`. `Utility.decodeToken` lee `userId` y `role` para controlar acceso y asociar datos al usuario autenticado.
- El rol del usuario (`ADMIN` / `PATIENT`) viene codificado en el JWT y es leído por `RoleGuard` y `NoAuthGuard` en cada navegación.

## Estructura del proyecto
```
src/
 ├─ app/
 │   ├─ core/
 │   │   ├─ guards/             # AuthGuard, NoAuthGuard, RoleGuard
 │   │   ├─ interceptors/       # jwtInterceptor (adjunta token, maneja 401)
 │   │   └─ service/
 │   │       ├─ AuthService.ts
 │   │       ├─ patientService.ts
 │   │       ├─ FluidBalanceService.ts
 │   │       ├─ CalculatedFluidBalanceService.ts
 │   │       ├─ ExtraFluidService.ts
 │   │       ├─ VitalSignService.ts / VitalSignDetailService.ts
 │   │       ├─ MedicineService.ts / MedicineDetailService.ts
 │   │       ├─ BagTypeService.ts
 │   │       ├─ FluidDateService.ts
 │   │       ├─ PlansService.ts
 │   │       ├─ SubscriptionService.ts
 │   │       ├─ PaymentService.ts
 │   │       ├─ NotificationService.ts
 │   │       ├─ session-timer.service.ts
 │   │       ├─ userService.ts
 │   │       ├─ component/snackbar.service.ts
 │   │       └─ util/utility.ts
 │   ├─ features/
 │   │   ├─ auth/               # Login, registro, recuperación y cambio de contraseña
 │   │   ├─ dashboard/          # Dashboard (ADMIN), detalle de paciente, balance calculado, selección de planes
 │   │   ├─ payments/           # PaymentSuccessComponent, PaymentFailureComponent
 │   │   └─ profile/            # ProfileComponent (ADMIN)
 │   └─ shared/
 │       ├─ components/
 │       │   ├─ logout-button/          # app-logout-button
 │       │   ├─ notification-banner/    # app-notification-banner
 │       │   ├─ plan-indicator-button/  # app-plan-indicator-button
 │       │   └─ profile-button/         # app-profile-button
 │       └─ models/                     # Interfaces TypeScript de todos los DTOs
 ├─ public/
 └─ styles.scss                         # Estilos globales & Material theme overrides
```

## Pruebas y verificación
- **Unit tests:** `npm test` (agregar specs según se vaya ampliando el alcance).
- **Lint:** mantener formato y convenciones de Angular/TypeScript.
- **Manuales críticos:**
	1. Login/Logout + expiración automática (aviso 60 s antes).
	2. Validación de acceso por rol: ADMIN ve dashboard completo; PATIENT solo su propio detalle.
	3. CRUD de pacientes, catálogos de signos vitales y medicamentos.
	4. Registro de balances respetando ventanas horarias activas.
	5. Generación y envío por correo de balances calculados (PDF).
	6. Flujo completo de suscripción: contratar → Stripe → `/payment-success`.
	7. Cambio de plan, actualización de método de pago y cancelación desde el perfil.
	8. Actualización de contraseña (cifrado RSA + cierre de sesión forzado).

## Convenciones clave
- **Cifrado:** cualquier contraseña se cifra con JSEncrypt usando la llave pública obtenida de `/api/auth/public-key` antes de enviarse al backend.
- **Roles:** leer el rol siempre desde `Utility.getUserRoleFromToken(token)`, que normaliza `PACIENTE` → `PATIENT` y soporta roles en array o string.
- **Feedback:** evita `window.confirm`; usa `SnackbarService.openSuccess/openError/openInfo` o `SnackbarService.confirm()` (devuelve `Observable<boolean>`) para confirmaciones destructivas.
- **Componentes globales:** `app-logout-button`, `app-plan-indicator-button` y `app-profile-button` deben estar presentes en todas las pantallas protegidas.
- **Pagos:** nunca navegar manualmente a `/payment-success` o `/payment-failure`; son exclusivamente destinos de retorno del gateway de Stripe.
- **Diseño:** tema oscuro con gradientes y bordes redondeados; los nuevos componentes deben seguir esta identidad visual.

---
