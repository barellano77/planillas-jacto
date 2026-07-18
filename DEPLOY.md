# Desplegar el backend (modo bundled)

La app ya está lista para "modo bundled": el APK carga el frontend empaquetado
y llama a un backend publicado en internet. Esta guía deja ese backend
funcionando en Railway (recomendado) o en Render + TiDB Cloud (alternativa
gratis, pero con dos servicios en vez de uno).

El repo ya incluye `Dockerfile` y `.dockerignore` — ambas plataformas lo
detectan solas, no hace falta configurar nada de build.

---

## Opción A — Railway (recomendada, todo en un solo proyecto)

Railway permite tener el backend Node y la base MySQL en el mismo proyecto,
conectados automáticamente. Tiene un trial de 30 días con $5 de crédito
gratis (no pide tarjeta para arrancar el trial). Pasado eso, el plan Hobby
arranca en USD 5/mes. Para esta app (un servicio chico + una base MySQL
chica) ese consumo suele entrar cómodo dentro de ese margen.

1. Entrá a https://railway.com → **Login** → creá cuenta (podés usar GitHub).
2. **New Project → Deploy from GitHub repo**. Si el proyecto todavía no está
   en GitHub, subilo primero:
   ```bash
   git init
   git add .
   git commit -m "Planillas Jacto"
   git remote add origin https://github.com/TU-USUARIO/planillas-jacto.git
   git push -u origin main
   ```
   (también se puede arrastrar el zip directo con **Deploy from local
   directory**, si tu cuenta lo ofrece).
3. Railway detecta el `Dockerfile` solo y arranca el build.
4. Dentro del mismo proyecto: **+ New → Database → Add MySQL**. Railway crea
   la base y te da automáticamente una variable `DATABASE_URL`.
5. En el servicio del backend (no en la base) → pestaña **Variables**:
   agregá `DATABASE_URL` referenciando la de MySQL: escribí `${{MySQL.DATABASE_URL}}`
   (Railway autocompleta esta referencia al tipear `${{`).
6. Andá a **Settings → Networking → Generate Domain** para conseguir la URL
   pública (algo como `https://planillas-jacto-production.up.railway.app`).
7. Esperá a que termine el deploy (pestaña **Deployments**) y probá:
   ```bash
   curl https://TU-URL.up.railway.app/api/login -X POST \
     -H "Content-Type: application/json" \
     -d '{"username":"Admin","password":"Admin3030"}'
   ```
   Si devuelve un `token`, el backend y la base ya están funcionando.
   **Iniciá sesión y cambiá esa contraseña por defecto** desde el panel de
   usuarios de la app.

---

## Opción B — Render (web service) + TiDB Cloud (MySQL gratis)

Render no ofrece MySQL administrado (solo Postgres), así que la base va en
un servicio aparte, compatible con MySQL y con capa gratuita real.

1. **Base de datos:** entrá a https://tidbcloud.com → creá cuenta → **Create
   Cluster** → plan **Serverless** (gratis). Copiá el connection string
   (incluye usuario, contraseña, host, puerto 4000) y armá la URL con este
   formato:
   ```
   mysql://USUARIO:CONTRASEÑA@HOST:4000/DBNAME?ssl={"rejectUnauthorized":true}
   ```
2. **Backend:** entrá a https://render.com → **New → Web Service** → conectá
   tu repo de GitHub.
3. Render detecta el `Dockerfile` automáticamente (Runtime: Docker).
4. En **Environment** agregá la variable `DATABASE_URL` con el connection
   string de TiDB del paso 1.
5. Plan **Free** para probar (se "duerme" tras 15 min sin uso — la primera
   petición después de eso tarda ~30-60s en responder) o **Starter** si
   necesitás que esté siempre activo.
6. Deploy. Render te da una URL tipo `https://planillas-jacto.onrender.com`.
   Probala igual que en la Opción A con el `curl` de login.

---

## Después de tener la URL (cualquiera de las dos opciones)

1. En tu proyecto local, editá `.env`:
   ```
   VITE_API_BASE_URL=https://TU-URL-DEL-BACKEND
   ```
2. Compilá la APK en modo bundled:
   ```bash
   npm run android:sync
   npm run android:open
   ```
3. En Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
   (o `./gradlew assembleDebug` para probar; `assembleRelease` firmada para
   distribuir — ver la guía de la respuesta anterior).

La app ahora va a cargar el frontend empaquetado en el APK y va a hablar con
tu backend real en cada acción (login, guardar planilla, catálogo, PDF, QR).

## Nota de seguridad

El usuario admin por defecto es `Admin` / `Admin3030` (se crea solo la
primera vez que arranca el servidor, tanto con MySQL como en memoria).
**Cambiá esa contraseña apenas tengas el backend andando**, desde la sección
de usuarios dentro de la app (solo visible para el rol admin).
