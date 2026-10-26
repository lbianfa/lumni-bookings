import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { SESSION_COOKIE } from "./auth/http/session-cookie";

const DOCS_PATH = "api/docs";

// Swagger UI at /api/docs and the OpenAPI JSON at /api/docs-json; main.ts mounts them only outside production.
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle("Lumni Bookings API")
    .setDescription(
      "Room quotes and the 3-step booking flow of the Lumni coworking. Sign in with POST /api/auth/login: " +
        `the session cookie (${SESSION_COOKIE}) is then sent with every request from this page.`,
    )
    .setVersion("1.0")
    .addCookieAuth(SESSION_COOKIE)
    .build();

  SwaggerModule.setup(DOCS_PATH, app, () => SwaggerModule.createDocument(app, config));
}
