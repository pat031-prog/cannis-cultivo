# Cannis · Módulo de Cultivo — Especificación de Build

> Documento de especificación para construir la app completa en **Claude Code**.
> Versión 1.0 · Stack-agnóstico en la visión, opinado en la implementación.
> Idea fuerza: **cultivation intelligence con UX de app de consumidor.** El mercado tiene software de cultivo potente pero feo (ERP industrial). Acá la apuesta es que el jardinero abra la app con el mismo placer con que abre una app de calorías, y que el director tenga el análisis de desvíos que ninguna herramienta del rubro hace bien.

---

## 0. Cómo usar este documento con Claude Code

1. Poné este `.md` en la raíz del repo como referencia maestra (no como `CLAUDE.md`; ver §10).
2. Construí **por fases** (§9). No le pidas a Claude Code "armá toda la app". Pedile la Fase 1 entera, validá, y seguís.
3. Arrancá por el **modelo de datos** (§3) y la **autenticación + RBAC** (§2). Todo lo demás cuelga de ahí.
4. El `CLAUDE.md` raíz debe contener las convenciones (§10), no el spec entero — este documento es la fuente, el `CLAUDE.md` es el resumen operativo.

---

## 1. Visión y diferencial

**Qué es:** una app de gestión de cultivo de cannabis medicinal que conecta *plan estándar → ejecución diaria → desvíos → resultado*, con trazabilidad completa de **semilla a paciente** unificando códigos INASE.

**Para quién:** una operación de cultivo real (carpas + equipo de trabajo + un director de cultivo tipo Tabaré + responsable de trazabilidad/compliance).

**El diferencial, en una línea:** las apps líderes (Trym, AROYA, Pulse) te *muestran* datos; nosotros *cerramos el loop* — la plantilla del plan define qué se espera cada día, el registro diario captura qué pasó, y el desvío sale solo de la resta. Esa diferencia es el activo analítico.

**Las dos cosas que la app tiene que lograr sí o sí:**
- Bajar la fricción del día a día del jardinero (el cuestionario diario deja de ser un formulario y se vuelve un checklist con taps).
- Darle al director el informe de desvíos sin que nadie cargue data extra.

---

## 2. Perfiles de usuario (RBAC) — núcleo de la app

La app abre con **selección de perfil** (o login que resuelve el rol). Cada rol tiene una pantalla de aterrizaje distinta y permisos distintos. Tres roles core + uno opcional.

### 2.1 Jardinero / Operario
El que labura las carpas todos los días (el equipo de Tabaré).
- **Aterriza en:** Modo Hoy (§4.1).
- **Ve:** solo los lotes/carpas que tiene asignados.
- **Hace:** completa tareas del día con taps, registra desvíos rápidos, saca fotos, ve el estado en vivo de su carpa.
- **No puede:** editar plantillas, ver el informe analítico completo, gestionar usuarios, ver trazabilidad de otros lotes.
- **Prioridad de diseño:** máxima. Cero fricción, mobile-first, usable parado frente a la planta, idealmente offline-tolerante.

### 2.2 Director de cultivo (Tabaré)
El responsable agronómico. Diseña los planes, supervisa, analiza.
- **Aterriza en:** Dashboard general (todas las carpas, semáforo de estado, desvíos del día).
- **Ve:** todo — todos los lotes, sensores en vivo, informe nerd completo, plantillas, equipo.
- **Hace:** crea/edita/clona plantillas de plan, asigna lotes a carpas y a jardineros, revisa desvíos, exporta informes, ajusta el plan de un lote en curso.
- **No necesita:** gestión de usuarios ni la capa legal de trazabilidad (puede verla, no administrarla).
- **Prioridad de diseño:** densidad de información, análisis, vista "nerd".

### 2.3 Administrador / Trazabilidad
El dueño de la operación / responsable de compliance.
- **Aterriza en:** Panel de trazabilidad + administración.
- **Ve:** todo, más la cadena semilla→paciente, códigos INASE, usuarios.
- **Hace:** gestiona usuarios y roles, administra códigos INASE y la cadena de trazabilidad, genera exports legales, configura carpas/ubicaciones, da de alta genéticas y madres.
- **Prioridad de diseño:** integridad de datos, exportabilidad, auditabilidad.

### 2.4 (Opcional) Auditor / Regulador — solo lectura
Acceso de solo-lectura a la trazabilidad y a los informes, sin tocar nada. Útil si en algún momento un ente externo (REPROCANN, autoridad provincial) necesita ver la cadena. Se puede dejar para fase posterior.

### 2.5 Matriz de permisos (resumen)

| Capacidad | Jardinero | Director | Admin |
|---|:---:|:---:|:---:|
| Modo Hoy / completar tareas | ✅ (sus carpas) | ✅ | ✅ |
| Registrar desvíos | ✅ | ✅ | ✅ |
| Ver sensores en vivo | ✅ (sus carpas) | ✅ (todas) | ✅ |
| Informe / análisis de desvíos | — | ✅ | ✅ |
| Crear/editar plantillas | — | ✅ | ✅ |
| Asignar lotes y jardineros | — | ✅ | ✅ |
| Alta de genéticas / madres | — | ✅ | ✅ |
| Trazabilidad semilla→paciente | — | 👁️ ver | ✅ |
| Códigos INASE | — | 👁️ ver | ✅ |
| Gestión de usuarios/roles | — | — | ✅ |
| Exports legales | — | ✅ | ✅ |

> Implementación: RBAC con **Row Level Security (RLS) de Postgres**. El rol vive en el JWT del usuario; las policies filtran por rol y por asignación de lote. Esto evita lógica de permisos duplicada en el frontend.

---

## 3. Modelo de datos

El backbone. Todo cuelga de la relación **Plantilla → Lote → Registro diario → Desvío**, con la cadena de trazabilidad cruzando transversal.

### 3.1 Entidades principales

**`usuario`** — id, nombre, email, `rol` (enum: jardinero | director | admin | auditor), activo, created_at.

**`genetica`** — id, nombre, banco, tipo (enum: indica | sativa | hibrida | ruderalis), notas. *La cepa.*

**`madre`** — id, codigo (único), genetica_id → genetica, ubicacion_id → ubicacion, fecha_alta, estado (enum: activa | retirada), notas. *Planta madre, fuente de clones.*

**`fenotipo`** — id, madre_id → madre, morfologia, aroma, ciclo_dias, rendimiento_estimado, observaciones, fecha_registro. *Una madre puede tener varios registros de fenotipo en el tiempo.*

**`ubicacion`** — id, sala, zona, posicion, tipo (enum: carpa | sala_madres | secado | deposito), capacidad. *Las carpas viven acá.*

### 3.2 Plantilla de plan (el "estándar")

**`plantilla_plan`** — id, nombre, genetica_id (opcional), duracion_semanas, version, autor_id, activa. *El plan editable y clonable.*

**`plantilla_dia`** — id, plantilla_id → plantilla_plan, semana, dia, fase (enum: propagacion | vegetativo | pre_floracion | floracion | lavado | secado). *Una fila por día del ciclo.*

**`plantilla_accion`** — id, plantilla_dia_id → plantilla_dia, tipo (enum: riego | fertilizacion | poda | defoliacion | medicion | trasplante | tratamiento | otro), `parametros` (JSONB), obligatoria (bool).
- Ejemplo de `parametros` para riego/fertilización:
  ```json
  { "ml_agua": 500, "ec_objetivo": 1.8, "ph_objetivo": 6.0,
    "fertilizante": "Base A+B", "dosis_ml_l": 2.5, "fotoperiodo": "18/6" }
  ```

### 3.3 Cultivo en curso (la "ejecución")

**`lote`** — id, codigo (único), plantilla_id → plantilla_plan, ubicacion_id → ubicacion (carpa), fecha_inicio, estado (enum: activo | cosechado | baja), responsable_id → usuario. *Instancia: una plantilla aplicada a una carpa con fecha de arranque.*

**`especimen`** — id, codigo, lote_id → lote, madre_id → madre, precinto_id → precinto, ubicacion_id → ubicacion, estado (enum: viva | baja | cosechada), fecha_alta. *Cada planta individual.*

**`precinto`** — id, color (enum: verde | amarillo | azul | rojo | …), letra, codigo_completo (ej. `VERDE-A`, generated), categoria, especimen_id → especimen, estado. *La parte física. Color → categoría/fase, letra → identificador único.*

### 3.4 Registro diario y desvíos (el activo analítico)

**`registro_diario`** — id, lote_id → lote, fecha, autor_id → usuario, completado (bool). *Cabecera del día.*

**`registro_accion`** — id, registro_diario_id → registro_diario, plantilla_accion_id → plantilla_accion (nullable, si fue una acción extra fuera de plan), tipo, `parametros_real` (JSONB, misma forma que el plan), hecha (bool), hora, notas, foto_url.

> **Cómo sale el desvío:** se compara `registro_accion.parametros_real` contra `plantilla_accion.parametros`. El JSONB con la misma forma hace que el diff sea trivial. Tres tipos de desvío: `no_realizada` (la tarea del plan no se hizo), `parametro_distinto` (se hizo con valores diferentes — ej. EC 2.2 vs 1.8 esperado), `extra` (se hizo algo que no estaba en el plan). El desvío puede ser una **vista materializada** o calcularse on-the-fly; arrancá con vista, optimizá después.

**`desvio`** (vista o tabla materializada) — registro_accion_id, tipo_desvio, campo, valor_esperado, valor_real, magnitud, fecha. *Lo que alimenta el informe nerd.*

### 3.5 Sensores (tiempo real)

**`lectura_sensor`** — id, ubicacion_id → ubicacion (carpa), sensor_tipo (enum: temp | humedad | vpd | co2 | luz | temp_sustrato | humedad_sustrato), valor, unidad, timestamp. *Serie temporal — candidata a TimescaleDB / hypertable o particionado por fecha.*

### 3.6 Trazabilidad semilla → paciente

**`inase_semilla`** — id, codigo_inase (único), genetica_id → genetica, proveedor, fecha_ingreso, cantidad. *Origen legal.*

**`evento_trazabilidad`** — id, especimen_id (o lote_id), tipo (enum: alta | germinacion | trasplante | movimiento | tratamiento | cosecha | secado | baja | entrega), fecha, autor_id, datos (JSONB). *Log inmutable de la vida de cada planta.*

**`cosecha`** — id, lote_id → lote, fecha, peso_humedo, peso_seco, merma, notas.

**`entrega_paciente`** — id, cosecha_id → cosecha, paciente_ref (REPROCANN u otra ref anonimizada), cantidad, fecha. *El último eslabón de la cadena.*

> La cadena completa: `inase_semilla → especimen (precinto) → lote → cosecha → entrega_paciente`, con `evento_trazabilidad` registrando cada salto. Desde el escaneo de un precinto físico tenés que poder ver toda la cadena hacia atrás (origen INASE) y hacia adelante (a qué cosecha/paciente fue).

---

## 4. Pantallas (information architecture)

### 4.1 Modo Hoy — *(rol: jardinero, también director/admin)*
La pantalla estrella. Referencia UX: **apps de calorías** (anillo de progreso, "completar el día") + **Trym** (tareas pre-cargadas del plan).
- Una **tarjeta por carpa asignada**, con un **anillo de progreso**: "Carpa 3 — 4 de 6 tareas".
- Tocás la carpa → lista de tareas del día (vienen del plan, ya cargadas).
- Cada tarea: tap para completar. Si hubo desvío, un gesto rápido abre un ajuste mínimo (ej. "regué con EC 2.2 en vez de 1.8") — **no un formulario en blanco**, sino el valor esperado pre-rellenado que el jardinero corrige.
- Foto opcional con un tap.
- Al completar todo: feedback de "día cerrado" (la sensación de hábito de las calorie apps).
- **Esto reemplaza el cuestionario diario de Tabaré.** Las tareas del plan SON el cuestionario.

### 4.2 En Vivo — *(rol: todos, scope según permisos)*
Sensores de las carpas en tiempo real. Referencia UX: **Pulse Grow**.
- Una **tarjeta de número grande** por métrica: VPD, temp, humedad, CO₂.
- Cada tarjeta muestra el **valor actual + el rango objetivo del plan + un sparkline** de las últimas horas.
- Color por estado: verde (en rango), ámbar (al borde), rojo (fuera). El rango objetivo lo define la fase actual del plan.

### 4.3 Informe / Vista Nerd — *(rol: director, admin)*
El análisis. Referencia UX: el **timeline de Grow with Jane** convertido en plan-vs-real, + el cruce de datos de **AROYA**.
- **Timeline del ciclo**: lo planeado en gris, lo ejecutado encima en color, los desvíos resaltados.
- Tablero de desvíos: filtrable por tipo, por carpa, por fecha.
- Gráficos de EC/pH/nutrientes reales vs objetivo a lo largo del ciclo.
- Cruce con sensores: superponer eventos ambientales sobre la línea del plan.

### 4.4 Plantillas — *(rol: director, admin)*
- Lista de plantillas, clonar, versionar.
- Editor semana × día: cada celda define las acciones esperadas (riego, fertilización, etc.) con sus parámetros.
- Aplicar plantilla → crear lote nuevo.

### 4.5 Trazabilidad — *(rol: admin, lectura director/auditor)*
- Buscador por precinto / código de espécimen / lote.
- Vista de cadena: semilla (INASE) → espécimen → lote → cosecha → paciente, con el log de eventos.
- Exports legales.

### 4.6 Madres y genéticas — *(rol: director, admin)*
- Catálogo de madres con sus fenotipos.
- Alta de genéticas, vinculación con código INASE.

### 4.7 Administración — *(rol: admin)*
- Usuarios y roles, carpas/ubicaciones, configuración general.

---

## 5. Stack técnico recomendado

Pensado para tu workflow (React/TS, Vercel/GitHub) y para que un solo dev lo mantenga.

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui. **PWA** (el jardinero la usa en el celu en la carpa).
- **Backend + DB:** **Supabase** (Postgres + Auth + RLS + Realtime). RLS resuelve el RBAC de §2 sin lógica duplicada. Realtime empuja las lecturas de sensores a la pantalla En Vivo.
- **Charts:** Recharts (rápido) o visx (más control) para la vista nerd.
- **Offline / local-first:** para el Modo Hoy con conectividad dudosa en la carpa → TanStack Query con persistencia en IndexedDB + mutaciones optimistas en el MVP. Si querés ir full local-first después: PowerSync o ElectricSQL sobre el mismo Postgres.
- **Sensores / IoT:** broker MQTT (Mosquitto en la Raspberry de la carpa) → bridge a Postgres vía edge function/webhook → Realtime al cliente. **Reutilizá la arquitectura del Pampa Control Center** (agente → API → dashboard → serie temporal); es prácticamente el mismo pipeline de telemetría que ya armaste.
- **Serie temporal:** si el volumen de `lectura_sensor` crece, TimescaleDB (extensión de Postgres) o particionado por fecha.
- **Deploy:** Vercel (front) + Supabase (managed). GitHub para CI.

> Alternativa si preferís Python en el backend: Django REST + Postgres, pero perdés RLS/Realtime fáciles y sumás trabajo. Para un MVP de un dev, Supabase gana.

---

## 6. Sistema de diseño y referencias UX

Los patrones concretos a robar, por app pionera:

- **Modo Hoy** ← apps de calorías (anillo de progreso, quick-add, "cerrar el día") + **Trym** (tarea pre-cargada del plan, el operario confirma/ajusta, nunca crea desde cero).
- **En Vivo** ← **Pulse Grow** (tarjeta de número gigante + rango objetivo + sparkline, color por estado).
- **Vista Nerd** ← **Grow with Jane** (timeline vertical scrolleable del ciclo) reinterpretado como plan-vs-real + **AROYA** (cruce de datos ambientales con resultados).
- **Trazabilidad** ← **Canix / seed-to-sale** (cadena navegable desde un código).

**Tokens de diseño sugeridos:**
- Color por **fase de cultivo**: propagación/vegetativo (verdes), floración (ámbar/morado), lavado/secado (neutros). Consistente con el color de los precintos.
- Estados: verde = en plan / en rango, ámbar = al borde / desvío menor, rojo = desvío grave / fuera de rango.
- Mobile-first. Tipografía grande en Modo Hoy (uso con guantes/sol). Densidad alta en vista nerd.

---

## 7. Sensores / IoT (detalle)

```
Raspberry Pi (carpa) → sensores [temp, humedad, VPD, CO2, sustrato]
   │  publica MQTT
   ▼
Mosquitto broker  →  bridge (edge function / pequeño servicio Node)
   │  inserta en Postgres (lectura_sensor)
   ▼
Supabase Realtime  →  pantalla "En Vivo" (suscripción por carpa)
```
- VPD se puede calcular en el bridge a partir de temp + humedad, o publicarlo ya calculado.
- Los rangos objetivo de cada métrica salen de la **fase actual del plan** del lote en esa carpa → así el color de la tarjeta es relativo al plan, no a un fijo.

---

## 8. Trazabilidad INASE semilla → paciente

- Cada lote nace de una `inase_semilla` (o de una madre que a su vez tiene origen INASE).
- Cada espécimen lleva un precinto físico (`COLOR-LETRA`) que es la llave de búsqueda en campo.
- Cada salto relevante genera un `evento_trazabilidad` (inmutable, append-only).
- La búsqueda por precinto devuelve la cadena completa en ambas direcciones.
- Export legal: un PDF/planilla por lote o por entrega que reconstruye toda la cadena.

> **Decisión a confirmar (ver §11):** ¿los códigos INASE ya se usan en papel hoy? Si sí, unificarlos es mapear; si no, es un sub-proyecto aparte.

---

## 9. Fases de build

### Fase 1 — MVP (el loop core)
Auth + RBAC (3 roles) · modelo de datos base · plantilla de plan · lote · **Modo Hoy** con tareas pre-cargadas · registro diario con cálculo de desvío. *Con esto solo ya entregás las dos cosas que importan: baja fricción + desvíos.*

### Fase 2 — Análisis y plantillas
Vista Nerd / informe de desvíos · editor de plantillas · catálogo de madres y fenotipos. *La data ya existe desde Fase 1; esto es visualización y edición.*

### Fase 3 — Sensores en vivo
Pipeline MQTT · pantalla En Vivo · rangos objetivo atados al plan. *Depende del hardware en las carpas.*

### Fase 4 — Trazabilidad completa
Cadena INASE semilla→paciente · eventos · exports legales. *Transversal; depende de integrar códigos externos.*

---

## 10. Estructura del repo + CLAUDE.md

```
cannis-cultivo/
├── CLAUDE.md                  # convenciones + resumen operativo (no el spec entero)
├── docs/
│   └── cannis-cultivo-app-spec.md   # este documento (fuente de verdad)
├── app/                       # Next.js App Router
│   ├── (jardinero)/hoy/
│   ├── (director)/dashboard/
│   ├── (director)/informe/
│   ├── (director)/plantillas/
│   ├── (admin)/trazabilidad/
│   └── (admin)/admin/
├── components/
├── lib/
│   ├── supabase/              # cliente, tipos generados, RLS helpers
│   └── desvios/               # lógica de comparación plan vs real
├── supabase/
│   ├── migrations/            # schema §3
│   └── policies/              # RLS por rol §2
└── ...
```

**Qué poner en el `CLAUDE.md` raíz (no este spec completo, solo lo operativo):**
- Stack y comandos (`pnpm dev`, migraciones, generación de tipos).
- Las 3 reglas de oro: (1) RBAC vive en RLS, no en el front; (2) `parametros` y `parametros_real` comparten forma JSONB; (3) los rangos objetivo de sensores salen de la fase del plan.
- Convención de nombres de tablas en español (como §3), código en inglés.
- Apuntar a `docs/cannis-cultivo-app-spec.md` para el detalle.

Si la app crece, usá `CLAUDE.md` anidados por carpeta (ej. uno en `lib/desvios/` con la lógica de comparación, uno en `supabase/` con las convenciones de migración) — la arquitectura de memoria de tres niveles de Claude Code.

---

## 11. Decisiones abiertas (cerrar con el equipo)

1. **Carga del jardinero:** ¿registra parado frente a la planta (Modo Hoy por-tarea) o todo junto al final de la jornada (por-jornada)? Define el flujo del Modo Hoy.
2. **Sensores:** ¿las carpas ya tienen hardware o el "en vivo" es a futuro? Define si la Fase 3 entra pronto o no.
3. **Códigos INASE:** ¿ya se usan en papel/planilla hoy? Define si la trazabilidad es mapeo o sub-proyecto.
4. **Genealogía de madres:** ¿una madre puede descender de otra (árbol multi-generacional) o en el MVP es plano (madre → especímenes)?
5. **Sistema de precintos:** ¿los colores y su significado ya están definidos? ¿El código es siempre `COLOR-LETRA` o `COLOR-LETRA-Nº` cuando se agotan las letras?
6. **Multi-tenant:** ¿esta app es solo para esta operación, o Cannis la quiere ofrecer a varios cultivos? Si es lo segundo, el modelo necesita una entidad `organizacion` desde el día uno.
