# Balances Diálisis App

Aplicación web en Angular para gestionar balances de fluidos, signos vitales y medicación de pacientes en tratamiento de diálisis peritoneal. Provee herramientas para el equipo médico desde la captura diaria hasta la generación de reportes calculados con exportación en PDF y flujo seguro de autenticación.

## Tabla de contenido
- [Tecnologías](#tecnologías)
- [Características principales](#características-principales)
- [Arquitectura funcional](#arquitectura-funcional)
- [Requisitos previos](#requisitos-previos)
- [Configuración](#configuración)
- [Scripts disponibles](#scripts-disponibles)
- [Variables y endpoints](#variables-y-endpoints)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Pruebas y verificación](#pruebas-y-verificación)
- [Convenciones clave](#convenciones-clave)

## Tecnologías
- Angular 17 (standalone components + Angular Material)
- RxJS para composición de flujos asíncronos
- SCSS con gradientes y blur para la identidad visual
- JSEncrypt para cifrar credenciales antes de llegar al backend
- Servicios REST expuestos por el backend en `https://api-sistema-ecuaciones-production-3ffb.up.railway.app`

## Características principales
- **Autenticación segura:** login con cifrado asimétrico, expiración por inactividad y cierre de sesión global.
- **Gestión de pacientes:** altas, edición inline y asignación de tipos de bolsa (bag types) por usuario médico.
- **Detalle del paciente:** CRUD de balances de fluidos, registro histórico respetando ventanas horarias activas, paneles de líquidos extra, signos vitales y medicamentos.
- **Balance calculado:** vista analítica que resume hasta 15 balances, permite descargar PDF o enviarlo por correo.
- **Notificaciones y confirmaciones:** snackbars consistentes para feedback y confirmaciones de borrado.
- **Acciones globales:** botones reutilizables para cerrar sesión y actualizar contraseña visibles en todas las pantallas autenticadas.
- **Actualización de contraseña:** formulario dedicado que cifra contraseña actual/nueva, invalida la sesión y obliga a reautenticarse.

## Arquitectura funcional
```mermaid
flowchart TD
	subgraph UI[Angular UI]
		A[Auth Screens]
		B[Dashboard]
		C[Patient Detail]
		D[Reports]
	end

	subgraph Core[Core Services]
		S1[AuthService]
		S2[UserService]
		S3[PatientService]
		S4[FluidBalanceService]
		S5[Extra/Vital/Medicine Services]
		S6[CalculatedFluidBalanceService]
	end

	subgraph API[Backend REST]
		R1[/api/auth]
		R2[/api/users]
		R3[/api/patients]
		R4[/api/fluid-balances]
	end

	A -->|login/logout| S1 --> R1
	A -->|register/update pwd| S2 --> R2
	B -->|list/create| S3 --> R3
	C -->|balances CRUD| S4 --> R4
	C -->|panels| S5 --> R3
	D -->|calculated| S6 --> R4
```

## Requisitos previos
- Node.js 18 LTS o superior
- npm 9+
- Backend disponible en `https://api-sistema-ecuaciones-production-3ffb.up.railway.app` (o ajustar servicios)

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
| Script           | Descripción                                      |
|------------------|--------------------------------------------------|
| `npm start`      | `ng serve` con recarga en vivo.                  |
| `npm run build`  | Compila en modo producción.                      |
| `npm test`       | Ejecuta unit tests (si existen) vía Karma/Jasmine. |
| `npm run lint`   | (Configurable) Ejecuta linters cuando se añadan. |

## Variables y endpoints
- Todos los servicios usan rutas absolutas (`https://api-sistema-ecuaciones-production-3ffb.up.railway.app`). Ajusta estas URLs dentro de `src/app/core/service/*.ts` si necesitas apuntar a otro host.
- El JWT se almacena en `localStorage` bajo la llave `token`. `Utility.decodeToken` se encarga de leer `userId` para asociar datos al médico autenticado.

## Estructura del proyecto
```
src/
 ├─ app/
 │   ├─ core/               # Servicios comunes, guardias, interceptores
 │   ├─ features/
 │   │   ├─ auth/           # Login, registro, recuperación y cambio de contraseña
 │   │   └─ dashboard/      # Dashboard principal y vistas hijas (detalle paciente)
 │   └─ shared/             # Componentes reutilizables, modelos, utilidades
 ├─ assets/
 └─ styles.scss            # Estilos globales & Material theme overrides
```

## Pruebas y verificación
- **Unit tests:** `npm test` (agregar specs según se vaya ampliando el alcance).
- **Lint:** asegúrate de mantener formato y convenciones de Angular/TypeScript (TSLint/ESLint según configuración futura).
- **Manuales críticos:**
	1. Login/Logout + expiración automática.
	2. CRUD de pacientes y paneles de detalle.
	3. Registro de balances para fechas pasadas respetando horarios activos.
	4. Generación/envío de balances calculados.
	5. Flujo de actualización de contraseña (cifrado + cierre de sesión forzado).

## Convenciones clave
- **Cifrado:** cualquier contraseña se cifra con JSEncrypt usando la llave pública expuesta por `/api/auth/public-key` antes de enviarse.
- **Feedback:** evita `window.confirm`; usa `SnackbarService` (éxito/error) o `snackBar.confirm()` para confirmaciones.
- **Botones globales:** `app-logout-button` y `app-update-password-button` deben estar presentes en todas las pantallas protegidas.
- **Diseño:** se mantiene el tema oscuro con gradientes y bordes redondeados; los nuevos componentes deben seguir esta identidad visual.

---
