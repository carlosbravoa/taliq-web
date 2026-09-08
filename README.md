# taliq.cl — sitio público

El sitio de [taliq.cl](https://taliq.cl) tal como está publicado. HTML, CSS y
JavaScript escritos a mano: sin framework, sin build, sin dependencias. Lo que
está en este repo es exactamente lo que se sirve.

## Estructura

```
index.html              Portada
porque-taliq.html       Por qué Taliq: el argumento del diferenciador
como-funciona.html      Los seis pasos en detalle
seguridad.html          Compliance, Ley 21.719, infraestructura
planes.html             Tabla comparativa completa + preguntas de precios
candidatos.html         La experiencia de quien postula
faq.html                Preguntas frecuentes
privacidad.html         Política de privacidad
404.html                Página de error (ver más abajo: es especial)
assets/styles.css       Todos los estilos
assets/site.js          Nav, modal de demo, acordeón, reveal, aviso de cookies
assets/og-image.png     Imagen para redes sociales (1200×630)
sitemap.xml, robots.txt, favicon.ico, site.webmanifest
```

## Verlo localmente

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

El formulario de demo no va a funcionar en local: hace `POST /api/demo`, que
existe sólo en producción. Todo lo demás sí.

## Reglas que conviene no romper

Cuatro cosas del sitio parecen detalles y no lo son.

### 1. `assets/styles.css` es la única hoja de estilos externa

Cada página la enlaza en el `<head>` y **es lo que bloquea el dibujado**. Así se
mide cuánta gente lee el sitio de verdad: un navegador no puede maquetar una
página sin pedir ese archivo, y un robot que sólo descarga el HTML nunca lo pide.

Si se inserta el CSS en línea, se divide en varios archivos, se le agrega un hash
al nombre o se suma una segunda hoja externa, esa medición se rompe **en
silencio**: no falla nada, simplemente los números dejan de significar lo que
dicen. Si hay que cambiarlo, avisar antes.

### 2. `404.html` no puede pedir ningún recurso externo

Nada de `<img>`, `<script>`, hojas de estilo ni referencias a `assets/`. Todo va
en línea, incluido el favicon como `data:` URI.

El motivo es el punto anterior: el sitio recibe cientos de escaneos automáticos
por día (`/.env`, `/wp-login.php`, `/.git/config`). Si la página 404 enlazara
`styles.css`, cada uno de esos escaneos contaría como un lector y el número
subiría, que es justo la forma en que una medición rota pasa desapercibida.

Para verificarlo después de tocarla:

```bash
grep -cE '<img|<script|rel="stylesheet"|assets/' 404.html   # 0, sin contar comentarios
```

### 3. El formulario de demo tiene dos trampas para robots

En `<form id="form-demo">` hay un campo `website` escondido por CSS (`.hp`) que
una persona nunca ve y un robot sí rellena, y `site.js` envía `elapsed_ms`, el
tiempo desde que se abrió el modal. Ninguno de los dos bloquea el envío: el
servidor marca el correo como sospechoso y lo entrega igual. Si se rehace el
formulario, hay que conservar ambos.

El `POST` va a `/api/demo` con JSON. El servidor valida de nuevo todo, así que la
validación del navegador es comodidad, no seguridad.

### 4. Cada página necesita su cabecera completa

Al agregar una página:

- un solo `<h1>` (el titular de la sección `.head`; el `h1` grande es sólo del
  hero de la portada),
- `<link rel="canonical">` y `og:url` con la URL absoluta `https://taliq.cl/…`,
- `og:title`, `og:description`, `twitter:*`, favicon y manifest como en las demás,
- la entrada correspondiente en `sitemap.xml`,
- el enlace en los tres lugares del menú: nav de escritorio, `.nav-mobile` y la
  lista «Producto» del pie.

La forma más segura es copiar una página existente y reemplazar el contenido.

## Cómo funcionan las cosas

**Modal de demo.** Cualquier elemento con el atributo `data-demo` lo abre.

```html
<button class="btn btn--primary" data-demo>Agenda una demo</button>
```

**Animación de entrada.** Los elementos con clase `reveal` aparecen al entrar en
viewport vía `IntersectionObserver`, con un failsafe que los muestra igual
después de 1,2 segundos. La regla CSS está protegida por la clase `js` en el
`<html>`, así que sin JavaScript el contenido se ve normal.

**Aviso de cookies.** El sitio no usa cookies ni analítica. Lo único que guarda
es la preferencia del aviso en `localStorage`, bajo la clave `taliq-consent`.
`window.taliqConsent()` devuelve `{v, analytics, ts}`. Si algún día se agrega
analítica, tiene que activarse sólo cuando `analytics === true`, y hay que
actualizar `privacidad.html`.

**Paleta.** Custom properties en `:root` dentro de `styles.css`.

| Variable | Valor | Uso |
|---|---|---|
| `--accent` | `#0E9E8A` | Verde principal |
| `--accent-2` | `#0A7D6D` | Verde oscuro, texto sobre claro |
| `--accent-3` | `#D8F3EE` | Verde claro, fondos de ícono |
| `--warm` | `#D98A2B` | Acento cálido |
| `--ink` | `#0A1017` | Fondos oscuros |
| `--paper` | `#FCFBF9` | Fondo base |
| `--paper-2` | `#F4F2ED` | Fondo de bandas alternas |

## Decisiones de contenido

Tres cosas que están así a propósito:

- **No se menciona multiposting a portales de empleo** en ninguna página, porque
  la funcionalidad no está operativa.
- **No se citan cifras de reducción de tiempo de contratación.** Los benchmarks
  disponibles son de otras plataformas, no datos propios de Taliq.
- **El diferenciador son los criterios de evaluación**, no la velocidad de
  lectura de CVs. Casi cualquier ATS ya lee CVs con IA; lo raro es fijar qué se
  evalúa antes de que llegue el primer candidato y dejar el fundamento de cada
  puntaje a la vista. El copy dice «criterios», no «rúbrica».

## Publicar

**Hacer merge de un PR no publica nada.** El sitio se sube a S3 y se invalida la
CDN a mano desde la máquina del mantenedor, con la infraestructura documentada
aparte. Un cambio aprobado queda en línea cuando alguien corre ese paso.
