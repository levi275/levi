# Guía recomendada de package/fork Baileys para Ruby-Hoshino-Bot

Esta guía está pensada para **este repositorio** (plugins con mensajes interactivos, botones, pairing code, subbots y features legacy comunes en forks).

## 1) Opción recomendada (equilibrio compatibilidad/estabilidad)

### `@whiskeysockets/baileys` en fork mantenido tipo `Ruby-Baileys` (actual del repo)
- Es la opción más segura cuando ya dependes de APIs y parches de comunidad.
- Menor riesgo de romper plugins de botones/interactive.
- Ideal para mantener soporte de comandos existentes sin refactor masivo.

## 2) Opción oficial upstream (más limpia, puede romper parches)

### `@whiskeysockets/baileys` oficial
- Mejor baseline de mantenimiento general.
- Puede requerir ajustes en plugins que dependen de formatos/parches no estándar.
- Úsalo si quieres converger a estándar y aceptar trabajo de migración.

## 3) Forks comunitarios (solo con validación previa)

- Útiles para features específicas (por ejemplo, formatos de interactive parcheados).
- Riesgo: mantenimiento irregular y cambios rompientes sin aviso.
- Recomendado solo si pasas el smoke test de este repo y pruebas en grupo real.

---

## Criterio de selección para ESTE bot

Antes de cambiar package, el fork debe pasar:

1. Import ESM/CJS sin errores en Node actual.
2. Exposición de símbolos usados por el repo (`proto`, `useMultiFileAuthState`, `makeCacheableSignalKeyStore`, `fetchLatestBaileysVersion`, `DisconnectReason`, etc.).
3. Compatibilidad de utilidades de mensajes (`generateWAMessageFromContent`, `prepareWAMessageMedia`, `generateWAMessageContent`, etc.).
4. Estabilidad en subbots (pairing + reconexión) bajo carga.

---

## Recomendación final

Para evitar romper funciones (botones, padrino code, plugins interactivos y subbots):

- Mantén el fork actual como **base estable**.
- Ejecuta el smoke test (`npm run test:baileys`) cuando evalúes otro fork.
- Solo migra si el nuevo fork pasa smoke test + prueba real de 24-48h.

