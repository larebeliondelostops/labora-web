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

## Incluye

- Landing publica
- Flujo de autenticacion base
- Dashboard y casos
- Pantallas principales del MVP
- Base visual responsive
- Cliente API centralizado
