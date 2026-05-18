# Entrega final y centro de descargas

Modulo frontend para consultar, descargar, compartir y cerrar la entrega final de un expediente Labora.

## Rutas

- `/app/cases/:caseId/delivery`: centro de entrega.
- `/app/cases/:caseId/delivery/downloads`: descargas individuales y filtros.
- `/app/cases/:caseId/delivery/share`: creacion y revocacion de enlaces temporales.
- `/app/cases/:caseId/delivery/timeline`: trazabilidad visible.
- `/app/cases/:caseId/delivery/complement`: solicitud de complemento.
- `/app/cases/:caseId/delivery/close`: cierre controlado del caso.
- `/share/delivery/:token`: vista publica/privada de expediente compartido.

Los alias `/cases/:caseId/delivery...` redirigen a las rutas protegidas bajo `/app`.

## Estructura

- `api/delivery.types.ts`: contratos TypeScript del handoff.
- `api/delivery.api.ts`: cliente API, normalizacion de respuestas y mensajes por codigo backend.
- `hooks/useDelivery.ts`: carga, polling ligero y mutaciones.
- `components/delivery-components.tsx`: chips, tablas, timeline, estados, cards y vista de links.
- `pages/*.tsx`: pantallas conectadas a rutas.
- `utils/delivery-formatters.ts`: labels, formatos y reglas de disponibilidad.
- `utils/delivery-analytics.ts`: eventos de producto sin datos sensibles.

## Endpoints esperados

- `GET /cases/:caseId/delivery`
- `POST /cases/:caseId/delivery/download`
- `POST /delivery/files/:fileId/download`
- `POST /cases/:caseId/delivery/share-links`
- `POST /cases/:caseId/delivery/share-links/:shareLinkId/revoke`
- `POST /cases/:caseId/delivery/complement`
- `POST /cases/:caseId/delivery/close`
- `GET /cases/:caseId/delivery/events`
- `GET /share/delivery/:token`
- `POST /share/delivery/:token/files/:fileId/download`

## Notas de seguridad frontend

- Los documentos bloqueados, en revision o sin permiso no muestran descarga activa.
- La vista compartida no muestra datos personales completos ni informacion de pago.
- El enlace generado se muestra completo solo en la respuesta inmediata de creacion.
- Los eventos de analitica omiten nombres de archivo, tokens y datos personales.
