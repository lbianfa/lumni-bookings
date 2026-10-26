# Lumni Bookings

> Versión en inglés: [`README.md`](README.md)

App de reservas de salas para un coworking: los clientes cotizan y reservan salas, los administradores gestionan las reservas y un asistente con IA guía a los clientes durante la reserva.

Los requisitos están resumidos en [`CONTEXT.es.md`](CONTEXT.es.md) (fuente: guía de la prueba técnica, Partes 1 y 2).

> Estado: en progreso. Construido hasta ahora en el frontend ([`lumni-bookings-spa`](lumni-bookings-spa)) y la API ([`lumni-bookings-api`](lumni-bookings-api)): inicio de sesión (D-19, D-20) y la cotización de salas (CONTEXT §1.1, D-21, D-22) y el flujo de reserva en 3 pasos (CONTEXT §1.2, D-23–D-25). Siguen la vista de administración, el correo de confirmación y el asistente. Este README registra las decisiones hasta ahora; la sección "Garantías" se completa a medida que se construye cada parte.

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React + TypeScript (Vite, TanStack Router, Query, Form, Table) |
| Backend | NestJS 12 + TypeScript, ejecutado en local y desplegado con Prisma Composer |
| Base de datos | PostgreSQL |
| ORM / migraciones | Prisma ORM 8 (lo que no modela, como el exclusion constraint de D-05, va en las migraciones como operaciones `rawSql`) |
| Proveedor de IA | Pendiente (P-01) |
| Correo | Resend, detrás de un puerto `EmailSender` (D-10) |
| Tareas en segundo plano | `@nestjs/schedule`: una tarea programada dentro del proceso que procesa el outbox de correos (D-08) |

## Decisiones tomadas

Los requisitos que la guía establece explícitamente son especificaciones y están en [`CONTEXT.es.md`](CONTEXT.es.md), no aquí.

| ID | Decisión | Justificación | Fuente |
|----|----------|---------------|--------|
| D-01 | Los artefactos técnicos (código, documentación, textos de la UI) se escriben en inglés. La documentación en inglés es la fuente de verdad; los archivos `*.es.md` son traducciones al español que se mantienen sincronizadas con ella. | Una sola convención en todo el repositorio; las traducciones hacen accesible la documentación sin crear dos versiones que compitan. | Decisión propia |
| D-02 | Las reglas de negocio usan `America/Bogota` (UTC-5, sin horario de verano); las fechas se almacenan como `timestamptz`. | El coworking opera en Colombia; la Parte 3 reporta por mes en hora de Colombia. | Guía + supuesto |
| D-03 | No hay tiempo de margen entre reservas consecutivas. | La guía no lo menciona; se puede agregar después como configuración de la sala. | Supuesto |
| D-04 | Solo las reservas `confirmed` y `completed` bloquean un horario. `draft` y `cancelled` no. | Los borradores no son compromisos; la disponibilidad se vuelve a verificar al confirmar. | Guía + supuesto |
| D-05 | La doble reserva se impide en la base de datos con un exclusion constraint (`btree_gist`) sobre sala + rango horario para los estados que bloquean. | Una verificación solo a nivel de aplicación deja una ventana de carrera entre "verificar" e "insertar". | Decisión propia |
| D-06 | La confirmación es idempotente: actualización condicional `WHERE status = 'draft'`. Una confirmación repetida devuelve la reserva ya confirmada. El precio se congela en `booking_lines` al confirmar y nunca se recalcula después. | Cumple "no se duplica, no se recalcula". | Decisión propia |
| D-07 | El correo de confirmación usa un outbox transaccional: la fila del outbox se inserta en la misma transacción que la confirmación, con `UNIQUE(booking_id, type)`. | Una sola fila de outbox por reserva confirmada, incluso con una doble confirmación concurrente; confirmar nunca espera al envío. | Decisión propia |
| D-08 | El outbox lo procesa una tarea de `@nestjs/schedule` dentro del proceso, que toma las filas pendientes con `FOR UPDATE SKIP LOCKED` y aplica espera exponencial ante fallos. | El estado vive en Postgres, así que los correos pendientes sobreviven a reinicios; no se necesita infraestructura extra (Redis); es seguro con más de una instancia. | Decisión propia |
| D-09 | Cada correo se genera una sola vez, al crear la fila del outbox, y se guarda en ella (destinatario, asunto, cuerpo). Cada intento envía ese contenido guardado con la clave de idempotencia `booking-confirmation/<booking_id>`. | Con la misma clave y un contenido idéntico, Resend devuelve la respuesta original sin volver a enviar (ventana de 24 h): un reintento tras una respuesta perdida nos dice con certeza si el correo salió, y nunca lo duplica. | Decisión propia |
| D-10 | El envío de correos pasa por un puerto `EmailSender` con dos adaptadores: Resend cuando `RESEND_API_KEY` está configurada, y un adaptador local (guarda el correo sin enviarlo) en caso contrario. La vista del administrador lista el outbox (destinatario, asunto, estado, intentos, último error) y muestra el contenido guardado del correo. | El proyecto corre sin credenciales, y se cumple el "que se pueda ver qué correos salieron" de la guía sin importar el proveedor. | Decisión propia |
| D-11 | Las reglas del asistente con IA se aplican en código, no solo en el prompt: el modelo solo recibe una lista permitida de herramientas (cotizar, consultar disponibilidad, crear borrador); el id del cliente sale de la sesión, nunca del modelo; no existen herramientas de confirmar/cancelar; toda salida del modelo se valida contra un esquema. | Un prompt injection no puede otorgar capacidades que el modelo nunca tuvo. | Decisión propia |
| D-12 | `rooms` incluye un campo `capacity`. | El asistente debe poder atender pedidos como "una sala para 6 personas". | Supuesto |
| D-13 | El dinero se almacena como `numeric(14,2)` en COP, y los montos conservan sus centavos: los porcentajes nunca se redondean. | Alineado con el esquema de referencia de la Parte 3, que la guía marca como opcional para nuestro modelo; sin redondeo, el desglose siempre suma exactamente el total. | Decisión propia |
| D-14 | Los servicios adicionales tienen un precio fijo por reserva: proyector COP 30.000, servicio de café COP 25.000. | La guía no los define; un precio fijo mantiene simple el paso 3 (sin cantidades ni número de personas). | Decisión propia |
| D-15 | El descuento por duración y el recargo de sábado aplican solo a la base de la sala. Los servicios se suman a su precio fijo: `total = base − descuento + recargo + servicios`. | Los servicios no dependen de la duración ni del día, así que descontarlos o recargarlos no tiene sentido de negocio. | Decisión propia |
| D-16 | Una tarea de `@nestjs/schedule` pasa las reservas `confirmed` a `completed` cuando ya pasó `ends_at`. | Sin pasos manuales para el administrador; reutiliza el planificador que ya se usa para los correos (D-08). | Decisión propia |
| D-17 | Solo el administrador puede cancelar una reserva, siempre con un motivo. Los clientes no pueden cancelar. | La guía solo describe la cancelación desde la vista del administrador. | Decisión propia |
| D-18 | Los borradores nunca se eliminan. Un borrador guarda su precio cotizado y cuándo se cotizó (`quoted_at`). Se puede confirmar si ese precio coincide con el que resulta de recalcular con la tarifa actual de la sala y los precios actuales de los servicios; si los precios cambiaron, solo mientras la cotización tenga menos de dos semanas, y se respeta el precio cotizado. En otro caso, el cliente debe volver a cotizar. | Conserva todo el historial; una cotización es válida por dos semanas, y después solo mientras los precios no hayan cambiado. | Decisión propia |
| D-19 | Las sesiones usan un JWT firmado por la API y guardado en una cookie httpOnly, `SameSite=Lax` (`Secure` en producción), válida por 8 horas. La SPA llama a la API bajo `/api` en el mismo origen (proxy de Vite en desarrollo), así que no hay CORS. Las contraseñas se guardan como hashes bcrypt (`bcryptjs`, costo 12). Un email incorrecto y una contraseña incorrecta devuelven el mismo `401`. | JavaScript no puede leer el token, así que un XSS no puede robarlo; la API sigue sin estado. El logout borra la cookie, pero un token no se puede revocar antes de que expire. | Decisión propia |
| D-20 | Dos usuarios demo sembrados: `customer@lumni.test` (cliente) y `admin@lumni.test` (administrador), ambos con la contraseña `lumni-demo`. La página de login ofrece botones demo de un clic que los usan. | La guía pide dos usuarios sembrados; credenciales fijas y documentadas hacen que la demo funcione sin configuración. | Decisión propia |
| D-21 | Un horario que ya empezó no se puede cotizar ni reservar; no hay límite hacia adelante. La página de cotización ofrece solo horas de inicio dentro del horario de apertura de ese día y, para hoy, solo las que aún no pasaron. "Ahora" sale de un reloj en `America/Bogota` (D-02). | La guía no lo dice; reservar en el pasado no tiene sentido de negocio, y un límite hacia adelante sería una regla inventada. | Decisión propia |
| D-22 | Doce salas sembradas: `Room S1`–`Room S5` pequeñas (capacidad 4), `Room M1`–`Room M4` medianas (capacidad 8), `Room L1`–`Room L3` grandes (capacidad 16), cada una con la tarifa por hora de su tamaño. `pnpm db:seed` las crea o restablece por nombre. | Suficientes salas por tamaño para ejercitar la disponibilidad y la búsqueda por capacidad del asistente (D-12). | Decisión propia |
| D-23 | Cada usuario cliente tiene exactamente un registro de cliente (`users.customer_id`). El paso 1 de la reserva se precarga con él y al guardar el paso se actualiza; cada reserva lo referencia. Los correos se guardan sin espacios y en minúsculas, igual que al iniciar sesión, así que se rechaza un correo que ya usa otro cliente aunque cambien las mayúsculas. El usuario administrador no tiene cliente y no puede reservar. | Los clientes no vuelven a escribir sus datos en cada reserva, y `customers.email` sigue siendo único como en el esquema de la Parte 3. | Decisión propia |
| D-24 | Una reserva se muestra a las personas como `BK-<id de la reserva>`. No hay un número de referencia aparte. | El id ya es único e inmutable; un segundo identificador agregaría una columna y una secuencia sin ninguna regla detrás. | Decisión propia |
| D-25 | Guardar el paso 2 (sala y horario) o el paso 3 (servicios) de un borrador vuelve a verificar y cotizar la reserva con las reglas de la cotización (CONTEXT §1.1, D-21) y los precios actuales de los servicios, guarda el desglose en `booking_lines` y actualiza `quoted_at`. Un paso solo se puede guardar después de los anteriores, y solo mientras la reserva es un borrador. El paso 3 es opcional ("Optional. Add them now or skip this step" en el diseño): un borrador se puede confirmar una vez guardado el paso 2, sin servicios. | El borrador siempre muestra el precio con el que se confirmaría; una vez confirmada, sus líneas no se vuelven a escribir, y eso es lo que compara D-18. | Decisión propia |
## Decisiones pendientes

| ID | Pregunta | Notas |
|----|----------|-------|
| P-01 | Proveedor y modelo de IA. | Libre elección; la clave va en una variable de entorno. |
| P-03 | Cómo se sirve la SPA en producción. | Es un build estático (`dist/`); el proxy de `/api` solo existe en `vite dev`. La cookie de sesión (D-19) necesita que la SPA y `/api` estén en el mismo origen. Opciones: NestJS sirve `dist/` con `@nestjs/serve-static` (un proceso, un dominio), o un reverse proxy / CDN sirve `dist/` y enruta `/api/*` a la API (deploys separados, más infraestructura). |

## Uso de IA

Este proyecto se desarrolla con ayuda de un asistente de IA. Esta sección registra para qué se usó.

- **Herramienta:** Claude (Anthropic), a través de Claude Code.
- **Alcance:** solo apoyo al desarrollo. El proveedor de IA que se use dentro de la app (asistente de reservas) es una decisión aparte, ver P-01.

| Fecha | Tarea | Resultado |
|-------|-------|-----------|
| 2026-10-25 | Leer la guía de la prueba técnica y resumir las Partes 1 y 2 en un archivo de contexto, usando la Parte 3 solo para alinear el modelo de datos. | [`CONTEXT.md`](CONTEXT.md) |
| 2026-10-25 | Redactar este README: decisiones tomadas, decisiones pendientes y el esquema de garantías. | [`README.md`](README.md) |
| 2026-10-25 | Seleccionar y auditar las skills de Claude Code para la API, y redactar sus reglas de arquitectura. | [`.claude/skills/`](.claude/skills), [`lumni-bookings-api/CLAUDE.md`](lumni-bookings-api/CLAUDE.md) |

### Skills de Claude Code

Cada app tiene sus propias skills en su carpeta: [`lumni-bookings-spa/.claude/skills/`](lumni-bookings-spa/.claude/skills) y [`lumni-bookings-api/.claude/skills/`](lumni-bookings-api/.claude/skills). Claude Code las carga cuando trabaja con archivos de esa app. Las skills de terceros se versionan como las copias exactas que se auditaron. El `skills-lock.json` de cada carpeta ([SPA](lumni-bookings-spa/skills-lock.json), [API](lumni-bookings-api/skills-lock.json)) registra el origen y el hash del contenido de cada skill. Se instalaron con el CLI [`skills`](https://github.com/vercel-labs/skills) (`npx skills add <repo> --skill <name> -a claude-code --copy`).

| Skill | Origen | Uso |
|-------|--------|-----|
| `nestjs-best-practices` (API) | [`Kadajett/agent-nestjs-skills`](https://github.com/Kadajett/agent-nestjs-skills) | Mecánica de NestJS: módulos, DI, pipes, guards, configuración, módulo de testing. |
| `clean-ddd-hexagonal` (API) | [`ccheney/robust-skills`](https://github.com/ccheney/robust-skills) | Clean Architecture, DDD táctico, puertos y adaptadores. |
| `prisma-8`, `prisma-composer-core-concepts`, `prisma-platform-core-concepts` (API) | Paquetes de Prisma (oficiales) | Contratos, migraciones y consultas de Prisma ORM 8; Composer y despliegue. Las copia `prisma skills sync` en cada `pnpm install`, por lo que siempre coinciden con la versión instalada. |
| `vite` (SPA) | [`antfu/skills`](https://github.com/antfu/skills) (Anthony Fu, core team de Vite) | Configuración y plugins de Vite 8. |
| `vercel-react-best-practices` (SPA) | [`vercel-labs/agent-skills`](https://github.com/vercel-labs/agent-skills) (oficial) | Rendimiento de React: re-renders, bundle y renderizado. Sus reglas de Next.js y de servidor están desactivadas en [`lumni-bookings-spa/CLAUDE.md`](lumni-bookings-spa/CLAUDE.md). |
| `tanstack` (SPA) | [`pedronauck/skills`](https://github.com/pedronauck/skills) (Pedro Nauck) | TanStack Query y Form, que todavía no traen skills oficiales. Su parte de Router queda reemplazada por las skills oficiales. |

Las skills de TanStack Router y Table son oficiales y vienen dentro de los paquetes npm de TanStack, por lo que siempre coinciden con la versión instalada. Las carga [TanStack Intent](https://github.com/TanStack/intent) (`@tanstack/intent`, dependencia de desarrollo de la SPA); `intent.skills` en [`lumni-bookings-spa/package.json`](lumni-bookings-spa/package.json) permite solo los paquetes de Router y Table, y `pnpm exec intent install` escribe las instrucciones de carga en el `CLAUDE.md` de la SPA.

- **Criterios de selección:** el autor es una organización oficial o un mantenedor identificable y con trayectoria; el contenido es solo Markdown y se leyó antes de instalar; la copia instalada se comparó contra la copia auditada.
- **Las reglas del proyecto tienen prioridad:** [`lumni-bookings-api/CLAUDE.md`](lumni-bookings-api/CLAUDE.md) reemplaza a las skills cuando entran en conflicto: sin CQRS ni Event Sourcing, sin `HttpException` en el código de negocio, Prisma solo en la capa de infraestructura. [`lumni-bookings-spa/CLAUDE.md`](lumni-bookings-spa/CLAUDE.md) hace lo mismo para el frontend.
- **Actualización:** `npx skills update` descarga la última versión del autor sin compararla con el hash del lock. Revisar el diff antes de commitearlo.

## Garantías

Se completa a medida que se construye cada parte, tal como lo pide la guía.

- **Dos clientes confirman la misma sala y horario al mismo tiempo: solo uno lo logra** (D-05). Al confirmar, la API vuelve a verificar la disponibilidad, pero la garantía es la restricción de exclusión de PostgreSQL `Booking_room_slot_excl`: dos reservas `confirmed`/`completed` de una misma sala no pueden tener rangos `[starts_at, ends_at)` superpuestos. Ambas confirmaciones pueden pasar la verificación de la aplicación; la base de datos confirma la primera y rechaza la segunda, que la API responde con `409` (`slot_taken`).
- **Una confirmación repetida no se duplica ni se vuelve a cotizar** (D-06). Confirmar cambia la fila existente del borrador (`UPDATE … WHERE status = 'draft'`); nunca inserta una reserva. La fila de la reserva se bloquea (`SELECT … FOR NO KEY UPDATE`) dentro de la transacción, así que una segunda confirmación espera a la primera, luego encuentra la reserva ya confirmada y la devuelve tal cual, sin recalcular. El precio acordado es el guardado en `total` y `booking_lines`, que no se vuelven a escribir después de confirmar.

Queda por completar:

- Cómo una reserva confirmada produce exactamente un correo (ver D-07 a D-10).
- Cómo el asistente ignora instrucciones que intentan cambiar sus reglas (ver D-11).
