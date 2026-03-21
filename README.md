# LinkPago

Plataforma para crear links de cobro y compartirlos por WhatsApp o Instagram. Los clientes pagan con tarjeta o transferencia vía MercadoPago.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **MongoDB** + Mongoose
- **NextAuth.js** (JWT, Credentials + Google OAuth opcional)
- **MercadoPago SDK** (pagos y suscripciones)
- **Resend** (emails transaccionales)
- **Tailwind CSS 4**

---

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## Variables de entorno

Creá un archivo `.env` en la raíz con:

```env
# Base de datos
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/?appName=ClusterName

# NextAuth
AUTH_SECRET=                # genera con: openssl rand -base64 32

# App
NEXT_PUBLIC_APP_URL=https://link-de-pago.vercel.app

# Encriptación de tokens de usuarios (AES-256-GCM)
ENCRYPTION_KEY=             # genera con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# MercadoPago (cuenta de la plataforma)
MP_ACCESS_TOKEN=            # APP_USR-... (producción) o TEST-... (sandbox)
MP_WEBHOOK_SECRET=          # secret del webhook configurado en MP Developers

# Email (Resend)
RESEND_API_KEY=             # re_...

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

> **Importante:** `ENCRYPTION_KEY` nunca debe cambiar una vez que haya usuarios con tokens guardados en la DB.

---

## URLs principales

| URL | Descripción |
|-----|-------------|
| `http://localhost:3000` | Landing / home |
| `http://localhost:3000/register` | Registro de usuarios |
| `http://localhost:3000/login` | Login |
| `http://localhost:3000/forgot-password` | Recuperar contraseña |
| `http://localhost:3000/dashboard` | Dashboard principal |
| `http://localhost:3000/links` | Gestión de links de cobro |
| `http://localhost:3000/links/new` | Crear nuevo link |
| `http://localhost:3000/transactions` | Historial de transacciones |
| `http://localhost:3000/settings` | Configuración de cuenta y MP |
| `http://localhost:3000/pay/[slug]` | Página pública de pago |
| `http://localhost:3000/opengraph-image` | Preview OG image |

---

## API Routes

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro |
| POST | `/api/auth/forgot-password` | Solicitar reset de contraseña |
| POST | `/api/auth/reset-password` | Confirmar nueva contraseña |
| GET | `/api/links` | Listar links del usuario |
| POST | `/api/links` | Crear link |
| GET | `/api/links/[id]` | Obtener link |
| PATCH | `/api/links/[id]` | Editar link |
| DELETE | `/api/links/[id]` | Desactivar link |
| GET | `/api/transactions` | Listar transacciones |
| POST | `/api/payment/create` | Crear preferencia de pago MP |
| POST | `/api/subscription/create` | Suscribirse al plan Pro |
| POST | `/api/subscription/cancel` | Cancelar plan Pro |
| PATCH | `/api/settings` | Actualizar configuración |
| POST | `/api/webhooks/mercadopago` | Webhook de MP (pagos y suscripciones) |

---

## Configurar webhook de MercadoPago

### Sandbox (desarrollo)

1. Instalá [ngrok](https://ngrok.com) y ejecutá:
   ```bash
   ngrok http 3000
   ```
2. Copiá la URL (ej: `https://abc123.ngrok-free.app`)
3. En [MP Developers](https://www.mercadopago.com.ar/developers) → tu app → **Webhooks**
4. URL: `https://abc123.ngrok-free.app/api/webhooks/mercadopago`
5. Eventos: ✅ Pagos ✅ Suscripciones
6. Copiá el **Webhook Secret** generado y pegalo en `MP_WEBHOOK_SECRET`

### Producción

Mismos pasos pero con la URL real:
```
https://link-de-pago.vercel.app/api/webhooks/mercadopago
```

---

## Planes

| Feature | Free | Pro (ARS 15.000/mes) |
|---------|------|----------------------|
| Links activos | 2 | Ilimitados |
| Marca propia | ❌ | ✅ |
| Color de marca | ❌ | ✅ |
| Código QR | ❌ | ✅ |
| Notificaciones por email | ❌ | ✅ |

---

## Deploy en Vercel

1. Importá el repo en [vercel.com](https://vercel.com)
2. Agregá todas las variables de entorno del `.env`
3. Configurá el webhook de MP con la URL de producción
4. Deploy 🚀
