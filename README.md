# Tiza · Plataforma Educativa Interactiva

Reconstrucción mejorada de las **páginas públicas** de [tiza.appsline.com.mx](https://tiza.appsline.com.mx/).

El código original se perdió, así que se recuperó todo lo posible del sitio en producción (HTML, bundle de
JavaScript y CSS compilados): rutas, textos, datos, lógica de los juegos, logo, favicon y endpoints de la API.
Después se reescribió con código limpio y se mejoró el diseño, la accesibilidad, el rendimiento y la
experiencia en celulares y tabletas.

---

## Páginas incluidas

| Ruta | Página |
| --- | --- |
| `/` | Biblioteca Pública de Actividades (búsqueda, filtros, orden y paginación) |
| `/actividad/memorama` | 🎮 Memoria de Vocales |
| `/actividad/matematicas` · `/math-practice` | 🧮 Práctica de Matemáticas |
| `/actividad/ordenar-oraciones` · `/actividad/espanol` | 📝 Ordenar Oraciones |
| `/juegos/nave` | 🚀 Batalla Espacial Matemática |
| `/juegos/tamagochi` | 🐶 Mascota Virtual (Tamagochi) |
| `/login` | Inicio de sesión y recuperación de contraseña |
| `/ayuda` | Centro de Ayuda (preguntas frecuentes) — **nueva** |
| `/actividades`, `/clasificacion`, `/aula`, `/privacidad`, `/terminos`, `/contacto` | Página «Próximamente» (en el sitio original estos enlaces quedaban en blanco) |
| cualquier otra | Página 404 — **nueva** |

Las rutas alternativas del sitio original (`/math-practice`, `/actividad/espanol`) se conservan para que los
enlaces que ya compartieron los maestros sigan funcionando.

> **Importante:** los paneles privados (`/admin/*` y `/maestro/*`) **no** forman parte de esta reconstrucción.
> Por ahora muestran una página temporal de «mantenimiento» después de iniciar sesión. Si se publica esta versión
> tal cual, los maestros y administradores no tendrán sus paneles hasta reconstruirlos.

## Principales mejoras

**Generales**
- Diseño renovado con la identidad de Tiza (logo original, tipografías redondeadas *Fredoka* y *Nunito*,
  ilustraciones nuevas en el estilo del logo).
- Menú para celulares (el original ocultaba la navegación en pantallas pequeñas) y menú «Juegos» accesible con
  teclado y pantalla táctil.
- Carga por página: el inicio descarga ~117 KB (gzip) y cada actividad se descarga solo al visitarla.
- Accesibilidad: HTML semántico, navegación con teclado, etiquetas para lectores de pantalla, foco visible,
  respeto de «reducir movimiento».
- SEO: título, descripción y URL canónica por página, Open Graph, `sitemap.xml` (el original apuntaba a uno
  que no existía) y `robots.txt`.
- `.htaccess` para cPanel: corrige el **error 404 al abrir o recargar `/login`** y otras rutas, y agrega caché
  y compresión.
- Seguridad: se eliminó el usuario/contraseña de respaldo que el sitio original tenía escrito en el código del
  navegador (`admin` / `CHANGE_THIS_PASSWORD`). Ahora el acceso depende solo de la API.

**Biblioteca**
- Búsqueda que ignora acentos y mayúsculas, filtros con contador por categoría, pestañas de orden que sí
  funcionan y botón «Cargar Más Aventuras» real.
- Se corrigió el contador («Viendo 6 de 142» mostraba 9 tarjetas): ahora refleja los resultados reales.
- Los juegos (Nave y Mascota) aparecen también en la biblioteca; las actividades sin juego aún se marcan como
  «Próximamente».

**Actividades y juegos**
- *Memoria de Vocales*: ahora se empareja la **vocal con su imagen** (A ↔ 🐝 Abeja), como promete la descripción;
  se corrigió la «A» que usaba 🍎. Voz en español, mayúsculas/minúsculas, cronómetro, estrellas y récord.
- *Práctica de Matemáticas*: las 4 operaciones (el original solo mostraba suma y resta), retroalimentación
  inmediata, racha, cronómetro en vivo y se corrigieron los colores de nivel que no se aplicaban.
- *Ordenar Oraciones*: arrastrar y soltar que funciona en tabletas y celulares, palabras repetidas, botón
  «Comprobar» con la respuesta correcta y «Escuchar oración».
- *Batalla Espacial*: misma mecánica, pero el juego ya no se acelera en pantallas de 120/144 Hz, no empieza
  solo, tiene niveles, récord, controles táctiles mantenidos y gráficos/sonidos sin archivos externos.
- *Mascota Virtual*: se conserva el progreso guardado por el sitio original, se arreglaron las orejas del gato
  (eran invisibles) y el loro (no tenía rasgos), preguntas que crecen con el nivel, sin restas negativas,
  nombre personalizado y mucho mejor rendimiento.
- Actividades asignadas por maestros: mismos parámetros de URL y mismos endpoints de resultados, pero ahora con
  aviso de envío y botón «Reintentar» si falla.

## Tecnologías

- [React 19](https://react.dev/) + [React Router 8](https://reactrouter.com/)
- [Vite 8](https://vite.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/) (el mismo framework de estilos del sitio original)
- [dnd-kit](https://dndkit.com/) para arrastrar y soltar · [Lucide](https://lucide.dev/) para íconos
- [Vitest](https://vitest.dev/) para pruebas · ESLint

## Requisitos

- Node.js **22.22 o superior** (o Node 24 LTS)

## Uso

```bash
npm install          # instalar dependencias
npm run dev          # servidor de desarrollo en http://localhost:5173
npm run build        # compilar para producción (carpeta dist/)
npm run preview      # probar la versión compilada
npm run lint         # revisar el código
npm test             # ejecutar las pruebas
```

### Variables de entorno

Copia `.env.example` a `.env` si necesitas cambiar la URL de la API:

```
VITE_API_URL=https://tiza-api.appsline.com.mx/api
```

- En **producción**, si no se define, se usa `https://tiza-api.appsline.com.mx/api` (la misma del sitio original).
- En **desarrollo**, si no se define, las peticiones pasan por el proxy de Vite (`/api`) para evitar CORS.

## Publicar en cPanel

1. Ejecuta `npm run build`.
2. Sube **el contenido** de la carpeta `dist/` (no la carpeta) a `public_html/` (o a la carpeta del subdominio).
3. Verifica que se haya subido el archivo oculto `.htaccess` (en el Administrador de archivos activa
   «Mostrar archivos ocultos»). Es el que permite abrir directamente `/login`, `/juegos/nave`, etc.
4. Abre `https://tiza.appsline.com.mx/login` y recarga la página: ya no debe aparecer el error 404.

## Enlaces para maestros

**Matemáticas** (`/actividad/matematicas` o `/math-practice`):

| Parámetro | Ejemplo | Descripción |
| --- | --- | --- |
| `nivel` | `facil`, `medio`, `dificil`, `experto` (también `easy`, `medium`, `hard`) | Nivel inicial |
| `operaciones` | `suma,resta,multiplicacion,division` | Operaciones seleccionadas |
| `cantidad` | `20` | Número de ejercicios |
| `questions` | JSON con `num1`, `num2`, `operation`, `symbol`, `answer` | Preguntas fijas: pide el nombre y envía resultados |
| `activity_id` | `12` | Identificador de la actividad en la API |

**Ordenar Oraciones** (`/actividad/ordenar-oraciones` o `/actividad/espanol`):

| Parámetro | Ejemplo | Descripción |
| --- | --- | --- |
| `oraciones` o `sentences` | `["El sol brilla","Mi gato duerme"]` (JSON) | Oraciones propias: pide el nombre y envía resultados |
| `activity_id` | `7` | Identificador de la actividad en la API |

## API utilizada

Base: `https://tiza-api.appsline.com.mx/api`

| Método | Endpoint | Uso |
| --- | --- | --- |
| `POST` | `/auth/login` | Inicio de sesión (`{ email, password }` → `data.user`, `data.access_token`) |
| `POST` | `/password/request-code` | Enviar código de recuperación |
| `POST` | `/password/verify-code` | Verificar el código de 6 dígitos |
| `POST` | `/password/reset` | Guardar la nueva contraseña |
| `POST` | `/actividades/matematicas/respuestas` | Resultados de matemáticas |
| `POST` | `/actividades/espanol/respuestas` | Resultados de Ordenar Oraciones |

La sesión se guarda con las mismas claves del sitio original (`tiza_user`, `tiza_token`) y el progreso de la
mascota con `mascota_ia_profile_v1`, así que nadie pierde su sesión ni su mascota al publicar esta versión.

## Estructura

```
public/                 Archivos estáticos (.htaccess, favicons, manifest, sitemap, robots, og-image)
src/
  assets/               Logo original e ilustraciones
  components/           Layout (encabezado, pie), tarjetas de actividades y componentes de UI
  context/              Sesión del usuario
  data/                 Catálogo de actividades, vocales, oraciones y secciones
  games/                Motor de la nave espacial y dibujo/lógica de la mascota
  hooks/                Título de página, cronómetro, envío de resultados
  lib/                  API, utilidades, generador de operaciones, sonidos, voz, confeti
  pages/                Una página por ruta
  __tests__/            Pruebas automáticas
```

Para editar contenido:
- Actividades de la biblioteca → `src/data/activities.js`
- Vocales del memorama → `src/data/vowels.js`
- Oraciones por defecto → `src/data/sentences.js`

## Pendientes sugeridos

- Reconstruir los paneles privados de administrador y maestro (encuestas, grupos, reportes, actividades).
- Reemplazar `src/assets/logo.jpg` por el logo original en alta resolución (el recuperado mide 200 px de ancho).
- Redactar el contenido de Privacidad, Términos y Contacto.
- Implementar las actividades marcadas como «Próximamente».
