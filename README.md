# labora-web

Base inicial del frontend de Labora construida con Next.js, TypeScript y Tailwind CSS.

## Inicio rapido

1. Crear `.env.local` a partir de `.env.example`.
2. Ejecutar `npm install`.
3. Ejecutar `npm run dev`.
4. Abrir `http://localhost:3000`.

## Variables de entorno

El frontend solo usa variables publicas `NEXT_PUBLIC_*`.

```env
NEXT_PUBLIC_APP_NAME=Labora
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN=true
```

En Netlify, configurar esas mismas claves en las variables de entorno del sitio
antes de construir. No guardar secretos de Google, JWT ni archivos
`client_secret_*.json` en este repositorio.

## Cuenta y autenticacion

Rutas principales:

```txt
/registro
/login
/verificar-otp
/recuperar-contrasena
/restablecer-contrasena
/app/perfil
/app/perfil/seguridad
```

El frontend consume el backend desde `NEXT_PUBLIC_API_URL` y usa cookies HttpOnly
con `credentials: "include"`. Los servicios estan en `services/` y no guardan
tokens en `localStorage` ni `sessionStorage`.

## Consentimientos y cumplimiento

Rutas del modulo:

```txt
/app/onboarding/consentimientos
/app/onboarding/consentimientos/exito
/app/consentimientos
/app/perfil/privacidad/consentimientos
```

Endpoints consumidos:

```txt
GET /legal-documents/current
GET /users/me/consents/status
POST /consents
GET /users/me/consents
```

Los checkboxes no vienen preseleccionados y el CTA solo se habilita cuando el
usuario marca todos los consentimientos obligatorios. El guard reusable esta en
`hooks/useConsentGuard.ts`.

## Iconos Labora

Los iconos exportados estan disponibles en:

```txt
public/icons/labora/original_png
public/icons/labora/upscaled_8x_png
public/icons/labora/manifest.csv
public/icons/labora/preview_sheet.png
```

Para renderizar un icono PNG por nombre:

```tsx
import { LaboraIcon } from "@/components/ui/labora-icon";

<LaboraIcon name="desktop_sidebar_home" />
```

## Incluye

- Landing publica
- Flujo de autenticacion base
- Dashboard y casos
- Pantallas principales del MVP
- Base visual responsive
- Cliente API centralizado
