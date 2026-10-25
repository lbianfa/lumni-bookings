# Lumni Bookings

> Versión en inglés: [`README.md`](README.md)

App de reservas de salas para un coworking: los clientes cotizan y reservan salas, los administradores gestionan las reservas y un asistente con IA guía a los clientes durante la reserva.

Los requisitos están resumidos en [`CONTEXT.es.md`](CONTEXT.es.md) (fuente: guía de la prueba técnica, Partes 1 y 2).

> Estado: planificación. Existen los proyectos base del frontend ([`lumni-bookings-spa`](lumni-bookings-spa)) y de la API ([`lumni-bookings-api`](lumni-bookings-api)); todavía no hay funcionalidades. Este README registra las decisiones hasta ahora; la sección "Garantías" se completará durante la implementación.

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React + TypeScript (Vite, TanStack Router) |
| Backend | NestJS + TypeScript |
| Base de datos | PostgreSQL |
| ORM / migraciones | Prisma (lo que no modela, como el exclusion constraint de D-05, va como SQL a mano en las migraciones) |
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
## Decisiones pendientes

| ID | Pregunta | Notas |
|----|----------|-------|
| P-01 | Proveedor y modelo de IA. | Libre elección; la clave va en una variable de entorno. |
| P-02 | Datos semilla: cuántas salas hay por tamaño, sus nombres y capacidades; los dos usuarios sembrados. | |

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

Las skills del proyecto están en [`.claude/skills/`](.claude/skills) y se versionan como las copias exactas que se auditaron. [`skills-lock.json`](skills-lock.json) registra el origen y el hash del contenido de cada skill. Se instalaron con el CLI [`skills`](https://github.com/vercel-labs/skills) (`npx skills add <repo> --skill <name> -a claude-code --copy`).

| Skill | Origen | Uso |
|-------|--------|-----|
| `nestjs-best-practices` | [`Kadajett/agent-nestjs-skills`](https://github.com/Kadajett/agent-nestjs-skills) | Mecánica de NestJS: módulos, DI, pipes, guards, configuración, módulo de testing. |
| `clean-ddd-hexagonal` | [`ccheney/robust-skills`](https://github.com/ccheney/robust-skills) | Clean Architecture, DDD táctico, puertos y adaptadores. |
| `prisma-orm-setup` | [`prisma/skills`](https://github.com/prisma/skills) (oficial) | Configuración de Prisma ORM 8 y conexión a PostgreSQL. |

- **Criterios de selección:** el autor es una organización oficial o un mantenedor identificable y con trayectoria; el contenido es solo Markdown y se leyó antes de instalar; la copia instalada se comparó contra la copia auditada.
- **Las reglas del proyecto tienen prioridad:** [`lumni-bookings-api/CLAUDE.md`](lumni-bookings-api/CLAUDE.md) reemplaza a las skills cuando entran en conflicto: sin CQRS ni Event Sourcing, sin `HttpException` en el código de negocio, Prisma solo en la capa de infraestructura.
- **Actualización:** `npx skills update` descarga la última versión del autor sin compararla con el hash del lock. Revisar el diff antes de commitearlo.
- **Pendiente:** la skill `prisma-8` viene con el paquete de Prisma; se agrega con `npx prisma skills sync` cuando Prisma 8 esté instalado en la API.

## Garantías

Se completará durante la implementación, tal como lo pide la guía:

- Cómo dos confirmaciones concurrentes de la misma sala y horario terminan con un solo éxito (ver D-05).
- Cómo una confirmación repetida no se duplica ni se vuelve a cotizar (ver D-06).
- Cómo una reserva confirmada produce exactamente un correo (ver D-07 a D-10).
- Cómo el asistente ignora instrucciones que intentan cambiar sus reglas (ver D-11).
