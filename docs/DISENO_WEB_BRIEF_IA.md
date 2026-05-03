# Brief de diseño visual — El Cronista de las Sombras (Nexo)

Documento para **otras IAs o diseñadores**: contexto del producto, tokens actuales, patrones de UI y rutas de código. Repo: **Next.js 16 + React 19 + Tailwind CSS v4** (`el-cronista-de-las-sombras`).

---

## 1. Producto y tono

- **Fantasía:** mesa digital inspirada en *Vampire: The Masquerade* V5 (fandom, no licencia oficial). Idioma principal: **español (Chile / latino)**.
- **Fantasía visual:** *gothic-punk urbano*, terminal CRT, “SchreckNet”, sensación de interfaz clandestina sobre fondo casi negro.
- **No es:** app corporativa clara; se busca **atmósfera**, legibilidad con bajo contraste deliberado en zonas secundarias.
- **Superficies principales:** login (`SchreckNetLogin`), hub de personajes (`ProfileHub`), CODEX / chargen (`CharacterCreation`), **Nexo** (chat + manifestar dados + paneles laterales), **Centro de Mandos** (`NarratorCommandCenter`, sólo narrador/operador).

---

## 2. Stack técnico (relevante para UI)

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, componentes cliente `"use client"` donde hace falta estado |
| Estilos | **Tailwind CSS v4** vía `@import "tailwindcss"` en `app/globals.css` + `@theme inline` |
| PostCSS | `@tailwindcss/postcss` (`postcss.config.mjs`) |
| Animación | **Framer Motion** (`motion`, `AnimatePresence`) en login, lista hub, stream |
| Fuentes | `next/font/google`: **Inter**, **JetBrains Mono**, **Space Grotesk** (`app/layout.tsx`) |

Variables CSS de fuentes en `html`: `--font-inter`, `--font-jetbrains`, `--font-grotesk`.

---

## 3. Paleta y tokens CSS (`app/globals.css`)

### Variables `:root`

| Token | Valor | Uso típico |
|-------|--------|------------|
| `--void` | `#050505` | Fondo base / “vacío” |
| `--terminal` | `#39ff14` | Acento verde terminal, bordes Schreck, hilo “principal” |
| `--blood` | `#8b0000` | Sangre / alerta / botones destructivos |
| `--crimson` | `#9f1239` | Acento rojo vino (disrupción, bordes) |
| `--neon` | `#c026d3` | Magenta neón (procesando, acentos secundarios) |
| `--paper` | `#1a1a1f` | Superficies tipo papel oscuro |
| `--background` | `var(--void)` | Alias |
| `--foreground` | `#e2e8f0` | Texto base body |

### Tailwind `@theme inline`

- `--color-background` / `--color-foreground` enlazados a lo anterior.
- `--font-sans` → Inter; `--font-mono` → JetBrains Mono.

### Acentos por clan (CODEX / header Nexo)

Definidos en `lib/character.ts` → `CLAN_ACCENTS` (hex por `ClanId`): Ventrue dorado apagado, Nosferatu verde musgo, Brujah óxido, Toreador malva, Malkavian cian, Gangrel tierra, Tremere azul, thin_blood teal, Caitiff gris, other verde.

### Hilos narrativos (chips en stream)

`lib/narrativeStrands.ts` → `STRAND_ACCENT`:

- `principal`: `var(--terminal)`
- `paralela`: `#a78bfa` (violeta)
- `vivo`: `#f59e0b` (ámbar)

---

## 4. Clases globales reutilizables (`app/globals.css`)

| Clase | Efecto |
|--------|--------|
| `.crt-wrap` | Capa fija de **ruido SVG** + **scanlines** animadas (`crt-scan` 9s); `isolation: isolate` |
| `.techno-grid` | Rejilla 28×28px líneas blancas muy suaves |
| `.codex-dot-grid` | Puntos sobre `#050505` (pantalla CODEX) |
| `.sharp-border-inner` | Borde verde terminal muy suave + sombra interior |
| `.terminal-panel` | Panel degradado oscuro + borde terminal + sombra sangre |
| `.glow-terminal` | `text-shadow` verde |
| `.narrador-bubble` | Bloque narrador: borde izquierdo terminal, gradiente gris |
| `.gothic-title` | Space Grotesk + tracking negativo + sombra magenta |
| `.nexo-gothic-shell` | Shell del stream: gradiente 165deg, radio 1rem, borde zinc |
| `.nexo-stream-panel` | Radio mínimo (2px) |
| `.cronista-out-text` | Texto **MANIFESTAR** (Cronista): gradiente clip en texto verde-azul |
| `.ravenous-frame` | Estado hambre extrema: borde fijo rojo + pulso saturación |
| `.fibonacci-whisper` | Texto casi invisible hasta hover (easter egg UI) |
| `.verdict-hit` / `.verdict-miss` / `.verdict-beast` | Colores resultado tirada |

**Body:** `font-sans`, `bg-[var(--void)]`, `text-neutral-200` (`app/layout.tsx`).

---

## 5. Patrones Tailwind recurrentes en componentes

- **Fondos:** `bg-[#050505]`, `bg-black/40`, `bg-black/55`, `bg-neutral-950/80`.
- **Bordes:** `border-[#1a1a1a]`, `border-[#2a2a30]`, `border-white/[0.06]`, acentos con `border-[var(--terminal)]`, `border-[var(--blood)]`.
- **Tipografía UI densa:** `text-[9px]`–`text-[13px]`, `uppercase`, `tracking-[0.2em]`–`[0.35em]` en etiquetas tipo terminal.
- **Narración jugable** (stream sin modo técnico): `font-sans`, `text-[13px]`, `leading-[1.72]`, `tracking-[0.02em]` (`NarrativeFlow`).
- **Jerarquía:** títulos `font-sans` semibold; mucho UI chrome en `font-mono`.
- **Responsive:** layout Nexo con columnas en `lg:` (sidebar + stream + paneles); hub centrado `max-w-lg`.

---

## 6. Mapa de pantallas y archivos clave

| Pantalla | Archivo principal | Notas visuales |
|----------|-------------------|----------------|
| Login | `components/SchreckNetLogin.tsx` | Dígitos Fibonacci, animación boot, errores “DENEGADO” |
| Hub personajes | `components/ProfileHub.tsx` | Lista cards, `crt-wrap` + `techno-grid`, botones terminal/sangre |
| CODEX / creación | `components/CharacterCreation.tsx` | Formulario largo, `codex-dot-grid`, acento clan |
| Nexo (mesa) | `components/CronistaApp.tsx` (orquesta todo) | Header, `NarrativeFlow`, `ManifestWill`, `CharacterStatusPanel`, `SidebarMesa`, `TechnicalHud` |
| Stream chat | `components/NarrativeFlow.tsx` | Chips hilos, textarea, sugerencias |
| Tiradas | `components/ManifestWill.tsx` | Panel “Voluntad · tirada”, mono |
| Centro mando | `components/NarratorCommandCenter.tsx` | Full screen mono, rojo `#b91c1c`, pestañas CODEX/Génesis/Motor/Orquestación |
| Admin / MJ | `components/AdminConsole.tsx` | Drawer sangre |
| Digest lateral | `components/NexoChronicleDigest.tsx` | Tipografía sans suave |

**App shell:** `app/page.tsx` monta `CronistaApp`.

---

## 7. Dirección creativa sugerida (para iteración)

**Fortalezas actuales:** coherencia “terminal + gótico”, paleta acotada, acentos por clan/hilo.

**Riesgos / deuda:** mucho texto microscópico (9px); contraste WCAG puede fallar en grises; CRT + scanline puede cansar en sesiones largas; mezcla **mono + sans** sin sistema tipográfico documentado (escalas 1.25, roles h1–h4).

**Líneas de mejora posibles (sin imponer):**

1. Escala tipográfica mínima legible (p. ej. 12px cuerpo en móvil).
2. Modo “baja fatiga” (opcional): desactivar CRT o reducir opacidad scanline.
3. Design tokens en un solo objeto (spacing, radius, elevation) para alinear paneles.
4. Dark mode “más paper” (`--paper`) para tarjetas vs `--void` plano.
5. Accesibilidad: foco visible, `prefers-reduced-motion` para `crt-scan` y `ravenousPulse`.

---

## 8. Restricciones de contenido (afecta copy en UI)

- Evitar metatexto de rol (“Nexo técnico”, “tablero compartido”) en textos del **canal jugador**; números de dados y σ sí pueden mostrarse donde ya existen.
- Marca y disclaimers legales: simulación fan, no producto oficial (ver `lib/sereno.ts` / textos legales en UI si existen).

---

## 9. Cómo usar este brief en otro chat

Pegá este archivo **completo** y pedí, por ejemplo:

- “Propón un sistema de diseño (tokens + componentes) manteniendo el mood gothic-terminal.”
- “Rediseña solo `ProfileHub` y `SchreckNetLogin` en wireframes + paleta.”
- “Auditoría WCAG AA sobre `globals.css` y `NarrativeFlow`.”

Incluí siempre la ruta del repo y que el CSS central es **`app/globals.css`**.

---

*Generado a partir del código en `cronista-sombras` (rama `main`). Actualizá este doc si cambian tokens o layout mayor.*
