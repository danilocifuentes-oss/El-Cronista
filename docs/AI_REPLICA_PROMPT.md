# PROYECTO SERENO / El Cronista de las Sombras — prompt de réplica para IA

Copia la sección **A** en otro chat con una IA de código. Usa la sección **B** como referencia compacta. La sección **C** es mapa de archivos del repo real.

---

## A) Prompt maestro (pegar en otra IA)

```
Eres un desarrollador front-end. Debes replicar o extender una app Next.js llamada "El Cronista de las Sombras" / PROYECTO SERENO (fan work V:tM V5, no oficial).

STACK (fijar versiones o equivalentes cercanas):
- Next.js 16 (App Router), React 19, TypeScript 5
- Tailwind CSS 4 (@import "tailwindcss" en globals.css)
- framer-motion para animaciones de login y listas
- Sin backend obligatorio: persistencia en localStorage

FLUJO DE LA APP (3 fases):
1) LOGIN: pantalla CRT/terminal. Usuario introduce "cifrado de sangre" (string); si coincide con la constante del cliente, pasa a fase 2 o 3. Si hay ficha guardada con nombre, va al NEXO; si no, a CREACIÓN.
   - Placeholder input: ID_SANGRE
   - Pista visible siempre bajo el input: "1, 1, 2, 3..."
   - Error: DENEGADO en rojo
   - Botón principal: ACCEDER (con borde terminal y shimmer opcional)
2) CHARGEN: ficha V5 "Sereno" con validación en cliente (lib sereno): atributos 1–4 con spread 4,3,3,3,2,2,2,1 sobre 9 stats; habilidades 0–3 según modo jack/specialist; disciplinas 0–2 según clan; Caitiff/Otro eligen 3 disciplinas del pool. Campos: nombre, clan (dropdown), antitribu (checkbox: prefijo [A] solo en la opción del clan SELECCIONADO en el select), concepto, generación (neonato/ancilla), resonancia, humanidad, PS derivado de generación. Botón sellar archiva ficha y bloquea edición salvo narrador.
3) NEXO: layout tres columnas en desktop: panel estado (salud, WP, hambre con HUD fijo esquina superior derecha = 5 círculos), flujo narrativo (chat/log), panel cónclave demo; bloque "Manifestar voluntad" con select atributo + habilidad (lista SERENO_SKILLS), DF solo narrador, botón EJECUTAR: tirada V5 pool = atributo+habilidad, dados de hambre = min(pool, nivel hambre), dificultad configurable. Intervalo Mnemósine: cada N minutos (default 60) hambre +1 hasta máximo 5; persistido en meta local. Hambre 5: marco visual "rabioso" (ravenous). Overlay narrador para tiradas forzadas (frenesí / enardecimiento).

ESTÉTICA (globals):
- Fondo oscuro (#050505), terminal verde #39ff14, sangre #8b0000
- crt-wrap: ruido + líneas scan; terminal-panel + sharp-border-inner; techno-grid; glow-terminal; narrador-bubble; ravenous-frame cuando hambre>=5

PERSISTENCIA (localStorage):
- cronista-sheet-v1: CharacterSheet JSON
- cronista-meta-v1: sheetLocked, lastFamineTickAt, famineIntervalMinutes
- cronista-xplog-v1, cronista-narrator (flags narrador)

TAREAS COMUNES: mantener Types en lib/character + lib/sereno alineados; no romper normalizeCharacterSheet al añadir campos; tiradas en lib/dice (pool V5 estándar con dados normales vs hambre).
```

---

## B) Especificación técnica mínima (tablas)

### Dependencias NPM

| Paquete        | Versión aprox |
|----------------|---------------|
| next           | 16.2.x        |
| react / dom    | 19.2.x        |
| typescript     | 5.x           |
| tailwindcss    | 4.x           |
| framer-motion  | 12.3x         |

### Rutas Next

| Ruta | Contenido        |
|------|------------------|
| `/`  | `CronistaApp`    |

### Claves localStorage

| Clave               | Propósito          |
|---------------------|---------------------|
| `cronista-sheet-v1` | Ficha personaje    |
| `cronista-meta-v1`  | Reloj / candado    |
| `cronista-xplog-v1` | Bitácora texto     |

### Constantes de sesión (`lib/sessionMeta.ts`)

| Nombre           | Valor / rol |
|------------------|-------------|
| `BLOOD_CIPHER`   | `112358` (acceso cliente; no es seguridad real) |
| intervalo hambre default | 60 min |

### Componentes principales (`components/`)

| Archivo                 | Rol |
|-------------------------|-----|
| `CronistaApp.tsx`       | Fases, intervalo hambre, layout nexus |
| `SchreckNetLogin.tsx`   | Login CRT, ACCEDER |
| `CharacterCreation.tsx` | Chargen V5 + sellado |
| `CharacterStatusPanel.tsx` | Salud, WP, hambre (texto + slider MJ) |
| `NarrativeFlow.tsx`     | Log + compositor |
| `ManifestWill.tsx`      | EJECUTAR + tirada |
| `HungerHud.tsx`         | 5 círculos fijos |
| `ForcedDestinyOverlay.tsx` | Tiradas forzadas |
| `ConclavePanel.tsx`     | Lista demo |
| `AdminConsole.tsx`      | MJ: amenaza, intervalo, narrador |
| `DotTrack.tsx`          | Puntos ●/○ |

### Lógica (`lib/`)

| Archivo        | Rol |
|----------------|-----|
| `character.ts` | Tipos, CLAN_ACCENTS, emptySheet, normalize |
| `sereno.ts`    | Validación spread, disciplinas por clan, SERENO_SKILLS |
| `dice.ts`      | `rollPoolV5`, resumen narrador |
| `sessionMeta.ts` | Meta + XP log |
| `narrativeApi.ts` | Stub IA narrador (opcional) |

---

## C) Instrucciones para la IA analista

1. **Orden de lectura sugerido:** `app/page.tsx` → `CronistaApp.tsx` → `lib/character.ts` → `lib/sereno.ts` → `lib/dice.ts` → `components/ManifestWill.tsx`.
2. **No asumir servidor:** toda la mecánica debe funcionar offline salvo la llamada opcional a `askCronista`.
3. **Cambios de reglas V5:** editar solo `lib/sereno.ts` y reflejar en UI (`CharacterCreation`, selects de `ManifestWill`).
4. **Cambios visuales CRT:** casi todo está en `app/globals.css` + clases utilitarias citadas en sección A.

---

*Fan work. No afiliado a White Wolf / Paradox. Personajes y sistema V5 son propiedad de sus titulares.*
