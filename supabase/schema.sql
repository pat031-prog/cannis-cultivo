-- Scheme SQL for Cannis Módulo de Cultivo
-- Base de datos: PostgreSQL (Supabase)

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. ENTIDADES PRINCIPALES Y SEGURIDAD (RBAC)
-- ==========================================

-- Tabla: usuario
CREATE TABLE IF NOT EXISTS usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('jardinero', 'director', 'admin', 'auditor')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: genetica
CREATE TABLE IF NOT EXISTS genetica (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    banco VARCHAR(100),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('indica', 'sativa', 'hibrida', 'ruderalis')),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: ubicacion
CREATE TABLE IF NOT EXISTS ubicacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sala VARCHAR(50) NOT NULL,            -- ej. "Sala A", "Sector Norte"
    zona VARCHAR(50),                     -- ej. "Fila 1", "Mesa 2"
    posicion VARCHAR(50),                 -- ej. "Carpa 3"
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('carpa', 'sala_madres', 'secado', 'deposito')),
    capacidad INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: madre (Planta madre, fuente de clones)
CREATE TABLE IF NOT EXISTS madre (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) UNIQUE NOT NULL,    -- ej. "M-KUSH-01"
    genetica_id UUID NOT NULL REFERENCES genetica(id) ON DELETE CASCADE,
    ubicacion_id UUID NOT NULL REFERENCES ubicacion(id),
    fecha_alta DATE NOT NULL DEFAULT CURRENT_DATE,
    estado VARCHAR(50) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'retirada')),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: fenotipo (Una madre puede tener varios registros de fenotipo)
CREATE TABLE IF NOT EXISTS fenotipo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    madre_id UUID NOT NULL REFERENCES madre(id) ON DELETE CASCADE,
    morfologia TEXT,
    aroma TEXT,
    ciclo_dias INT CHECK (ciclo_dias > 0),
    rendimiento_estimado INT,             -- gramos por planta estimado
    observaciones TEXT,
    fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE
);

-- ==========================================
-- 2. PLANTILLA DE PLAN (EL ESTÁNDAR)
-- ==========================================

-- Tabla: plantilla_plan
CREATE TABLE IF NOT EXISTS plantilla_plan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    genetica_id UUID REFERENCES genetica(id) ON DELETE SET NULL,
    duracion_semanas INT NOT NULL DEFAULT 8 CHECK (duracion_semanas > 0),
    version INT NOT NULL DEFAULT 1,
    autor_id UUID REFERENCES usuario(id) ON DELETE SET NULL,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: plantilla_dia
CREATE TABLE IF NOT EXISTS plantilla_dia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plantilla_id UUID NOT NULL REFERENCES plantilla_plan(id) ON DELETE CASCADE,
    semana INT NOT NULL CHECK (semana >= 1),
    dia INT NOT NULL CHECK (dia BETWEEN 1 AND 7),
    fase VARCHAR(50) NOT NULL CHECK (fase IN ('propagacion', 'vegetativo', 'pre_floracion', 'floracion', 'lavado', 'secado')),
    UNIQUE (plantilla_id, semana, dia)
);

-- Tabla: plantilla_accion
CREATE TABLE IF NOT EXISTS plantilla_accion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plantilla_dia_id UUID NOT NULL REFERENCES plantilla_dia(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('riego', 'fertilizacion', 'poda', 'defoliacion', 'medicion', 'trasplante', 'tratamiento', 'otro')),
    parametros JSONB NOT NULL DEFAULT '{}'::jsonb, -- ej: { ml_agua, ec_objetivo, ph_objetivo, fertilizante, fotoperiodo }
    obligatoria BOOLEAN DEFAULT true
);

-- ==========================================
-- 3. CULTIVO EN CURSO (LA EJECUCIÓN)
-- ==========================================

-- Tabla: lote (Un plan de cultivo en una ubicación)
CREATE TABLE IF NOT EXISTS lote (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) UNIQUE NOT NULL,   -- ej. "LOTE-2026-05A"
    plantilla_id UUID NOT NULL REFERENCES plantilla_plan(id),
    ubicacion_id UUID NOT NULL REFERENCES ubicacion(id),
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    estado VARCHAR(50) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'cosechado', 'baja')),
    responsable_id UUID REFERENCES usuario(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: especimen (Planta individual)
CREATE TABLE IF NOT EXISTS especimen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) UNIQUE NOT NULL,   -- ej. "ESP-2026-001"
    lote_id UUID NOT NULL REFERENCES lote(id) ON DELETE CASCADE,
    madre_id UUID REFERENCES madre(id) ON DELETE SET NULL,
    precinto_id VARCHAR(100),              -- se enlazará con la tabla precinto
    ubicacion_id UUID NOT NULL REFERENCES ubicacion(id),
    estado VARCHAR(50) NOT NULL DEFAULT 'viva' CHECK (estado IN ('viva', 'baja', 'cosechada')),
    fecha_alta DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: precinto (Dispositivo físico de trazabilidad)
CREATE TABLE IF NOT EXISTS precinto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    color VARCHAR(50) NOT NULL CHECK (color IN ('verde', 'amarillo', 'azul', 'rojo', 'morado', 'blanco')),
    letra CHAR(1) NOT NULL CHECK (letra ~ '^[A-Z]$'),
    codigo_completo VARCHAR(50) UNIQUE NOT NULL, -- ej. "VERDE-A-12"
    categoria VARCHAR(50),                -- ej. "Vegetativo", "Floración"
    especimen_id UUID UNIQUE REFERENCES especimen(id) ON DELETE SET NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'asignado' CHECK (estado IN ('activo', 'asignado', 'baja', 'cosechado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. REGISTROS DIARIOS Y DESVÍOS (ANÁLISIS)
-- ==========================================

-- Tabla: registro_diario (Cabecera del día para un lote)
CREATE TABLE IF NOT EXISTS registro_diario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lote_id UUID NOT NULL REFERENCES lote(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    autor_id UUID NOT NULL REFERENCES usuario(id),
    completado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (lote_id, fecha)
);

-- Tabla: registro_accion (Lo que efectivamente se hizo)
CREATE TABLE IF NOT EXISTS registro_accion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registro_diario_id UUID NOT NULL REFERENCES registro_diario(id) ON DELETE CASCADE,
    plantilla_accion_id UUID REFERENCES plantilla_accion(id) ON DELETE SET NULL, -- nullable si es una acción extra
    tipo VARCHAR(50) NOT NULL,
    parametros_real JSONB NOT NULL DEFAULT '{}'::jsonb,
    hecha BOOLEAN NOT NULL DEFAULT true,
    hora TIME NOT NULL DEFAULT CURRENT_TIME,
    notas TEXT,
    foto_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5. TELEMETRÍA (SENSORES EN TIEMPO REAL)
-- ==========================================

-- Tabla: lectura_sensor
CREATE TABLE IF NOT EXISTS lectura_sensor (
    id BIGSERIAL PRIMARY KEY,
    ubicacion_id UUID NOT NULL REFERENCES ubicacion(id) ON DELETE CASCADE,
    sensor_tipo VARCHAR(50) NOT NULL CHECK (sensor_tipo IN ('temp', 'humedad', 'vpd', 'co2', 'luz', 'temp_sustrato', 'humedad_sustrato')),
    valor NUMERIC(8, 2) NOT NULL,
    unidad VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para optimizar consultas de telemetría por tiempo y ubicación
CREATE INDEX IF NOT EXISTS idx_sensor_telemetria ON lectura_sensor(ubicacion_id, sensor_tipo, timestamp DESC);

-- ==========================================
-- 6. TRAZABILIDAD REGULATORIA (INASE)
-- ==========================================

-- Tabla: inase_semilla (Origen de semilla registrado)
CREATE TABLE IF NOT EXISTS inase_semilla (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_inase VARCHAR(100) UNIQUE NOT NULL, -- ej. "INASE-SEM-5491"
    genetica_id UUID NOT NULL REFERENCES genetica(id),
    proveedor VARCHAR(100),
    fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
    cantidad INT NOT NULL CHECK (cantidad > 0)
);

-- Tabla: evento_trazabilidad (Log inmutable de auditoría)
CREATE TABLE IF NOT EXISTS evento_trazabilidad (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    especimen_id UUID REFERENCES especimen(id) ON DELETE CASCADE,
    lote_id UUID REFERENCES lote(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('alta', 'germinacion', 'trasplante', 'movimiento', 'tratamiento', 'cosecha', 'secado', 'baja', 'entrega')),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    autor_id UUID REFERENCES usuario(id) ON DELETE SET NULL,
    datos JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: cosecha
CREATE TABLE IF NOT EXISTS cosecha (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lote_id UUID NOT NULL REFERENCES lote(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    peso_humedo NUMERIC(10, 2) NOT NULL CHECK (peso_humedo > 0),
    peso_seco NUMERIC(10, 2) CHECK (peso_seco > 0),
    merma NUMERIC(5, 2), -- porcentaje calculado en el código o trigger
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: entrega_paciente
CREATE TABLE IF NOT EXISTS entrega_paciente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cosecha_id UUID NOT NULL REFERENCES cosecha(id) ON DELETE CASCADE,
    paciente_ref VARCHAR(100) NOT NULL, -- REPROCANN anonimizado
    cantidad NUMERIC(10, 2) NOT NULL CHECK (cantidad > 0),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 7. TABLAS / VISTAS DE DESVÍOS (MATERIALIZADAS O ON-THE-FLY)
-- ==========================================

-- Vista para cálculo rápido de desvíos en tiempo real
CREATE OR REPLACE VIEW vista_desvio AS
SELECT 
    ra.id AS registro_accion_id,
    rd.lote_id,
    rd.fecha,
    ra.tipo AS accion_tipo,
    pa.id AS plantilla_accion_id,
    -- Identificar tipo de desvío
    CASE 
        WHEN NOT ra.hecha THEN 'no_realizada'
        WHEN pa.id IS NULL THEN 'extra'
        WHEN ra.parametros_real <> pa.parametros THEN 'parametro_distinto'
        ELSE 'ninguno'
    END AS tipo_desvio,
    -- Comparación en bruto de parámetros (se expande detalladamente en la aplicación)
    pa.parametros AS parametros_esperados,
    ra.parametros_real AS parametros_reales
FROM registro_accion ra
JOIN registro_diario rd ON ra.registro_diario_id = rd.id
LEFT JOIN plantilla_accion pa ON ra.plantilla_accion_id = pa.id;
