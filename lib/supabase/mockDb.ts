// Simulador de Base de Datos Local - Cannis Módulo de Cultivo
// Guarda y lee el estado de localStorage, pre-cargando datos semilla si está vacío.
import { analizarDesvio, AnalisisDesvio } from '../desvios/calculadora';

// ==========================================
// 1. INTERFACES DE DATOS (TypeScript)
// ==========================================

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'jardinero' | 'director' | 'admin' | 'auditor';
  activo: boolean;
  created_at: string;
}

export interface Genetica {
  id: string;
  nombre: string;
  banco: string;
  tipo: 'indica' | 'sativa' | 'hibrida' | 'ruderalis';
  notas: string;
}

export interface Ubicacion {
  id: string;
  sala: string;
  zona: string;
  posicion: string;
  tipo: 'carpa' | 'sala_madres' | 'secado' | 'deposito';
  capacidad: number;
}

export interface Madre {
  id: string;
  codigo: string;
  genetica_id: string;
  ubicacion_id: string;
  fecha_alta: string;
  estado: 'activa' | 'retirada';
  notas: string;
}

export interface Fenotipo {
  id: string;
  madre_id: string;
  morfologia: string;
  aroma: string;
  ciclo_dias: number;
  rendimiento_estimado: number;
  observaciones: string;
  fecha_registro: string;
}

export interface PlantillaAccion {
  id: string;
  plantilla_dia_id: string;
  tipo: 'riego' | 'fertilizacion' | 'poda' | 'defoliacion' | 'medicion' | 'trasplante' | 'tratamiento' | 'otro';
  parametros: {
    ml_agua?: number;
    ec_objetivo?: number;
    ph_objetivo?: number;
    fertilizante?: string;
    dosis_ml_l?: number;
    fotoperiodo?: string;
    temperatura_objetivo?: number;
    humedad_objetivo?: number;
    [key: string]: any;
  };
  obligatoria: boolean;
}

export interface PlantillaDia {
  id: string;
  plantilla_id: string;
  semana: number;
  dia: number;
  fase: 'propagacion' | 'vegetativo' | 'pre_floracion' | 'floracion' | 'lavado' | 'secado';
  acciones?: PlantillaAccion[];
}

export interface PlantillaPlan {
  id: string;
  nombre: string;
  genetica_id?: string;
  duracion_semanas: number;
  version: number;
  activa: boolean;
  dias?: PlantillaDia[];
}

export interface Lote {
  id: string;
  codigo: string;
  plantilla_id: string;
  ubicacion_id: string;
  fecha_inicio: string;
  estado: 'activo' | 'cosechado' | 'baja';
  responsable_id: string;
}

export interface Especimen {
  id: string;
  codigo: string;
  lote_id: string;
  madre_id?: string;
  precinto_id?: string;
  ubicacion_id: string;
  estado: 'viva' | 'baja' | 'cosechada';
  fecha_alta: string;
}

export interface Precinto {
  id: string;
  color: 'verde' | 'amarillo' | 'azul' | 'rojo' | 'morado' | 'blanco';
  letra: string;
  codigo_completo: string;
  categoria: string;
  especimen_id?: string;
  estado: 'activo' | 'asignado' | 'baja' | 'cosechado';
}

export interface RegistroAccion {
  id: string;
  registro_diario_id: string;
  plantilla_accion_id?: string | null;
  tipo: string;
  parametros_real: Record<string, any>;
  hecha: boolean;
  hora: string;
  notas?: string;
  foto_url?: string;
}

export interface RegistroDiario {
  id: string;
  lote_id: string;
  fecha: string;
  autor_id: string;
  completado: boolean;
  acciones?: RegistroAccion[];
}

export interface LecturaSensor {
  id: number;
  ubicacion_id: string;
  sensor_tipo: 'temp' | 'humedad' | 'vpd' | 'co2' | 'luz' | 'temp_sustrato' | 'humedad_sustrato';
  valor: number;
  unidad: string;
  timestamp: string;
}

export interface InaseSemilla {
  id: string;
  codigo_inase: string;
  genetica_id: string;
  proveedor: string;
  fecha_ingreso: string;
  cantidad: number;
}

export interface EventoTrazabilidad {
  id: string;
  especimen_id?: string;
  lote_id?: string;
  tipo: 'alta' | 'germinacion' | 'trasplante' | 'movimiento' | 'tratamiento' | 'cosecha' | 'secado' | 'baja' | 'entrega';
  fecha: string;
  autor_id: string;
  datos: Record<string, any>;
}

export interface Cosecha {
  id: string;
  lote_id: string;
  fecha: string;
  peso_humedo: number;
  peso_seco?: number;
  merma?: number;
  notas?: string;
}

export interface EntregaPaciente {
  id: string;
  cosecha_id: string;
  paciente_ref: string;
  cantidad: number;
  fecha: string;
}

// ==========================================
// 2. MOTOR DE ALMACENAMIENTO LOCAL Y SEEDING
// ==========================================

class MockDatabase {
  private key = 'cannis_mock_db_state';

  // Datos en memoria
  usuarios: Usuario[] = [];
  geneticas: Genetica[] = [];
  ubicaciones: Ubicacion[] = [];
  madres: Madre[] = [];
  fenotipos: Fenotipo[] = [];
  plantillas: PlantillaPlan[] = [];
  lotes: Lote[] = [];
  especimenes: Especimen[] = [];
  precintos: Precinto[] = [];
  registrosDiarios: RegistroDiario[] = [];
  lecturasSensores: LecturaSensor[] = [];
  inaseSemillas: InaseSemilla[] = [];
  eventosTrazabilidad: EventoTrazabilidad[] = [];
  cosechas: Cosecha[] = [];
  entregasPacientes: EntregaPaciente[] = [];

  constructor() {
    this.cargar();
  }

  // Carga los datos desde localStorage o crea las semillas
  cargar() {
    if (typeof window === 'undefined') return;

    const data = localStorage.getItem(this.key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        Object.assign(this, parsed);
        return;
      } catch (e) {
        console.error('Error parseando mock db', e);
      }
    }
    
    // Inicializar con semillas
    this.inicializarSemillas();
    this.guardar();
  }

  // Guarda los datos en localStorage
  guardar() {
    if (typeof window === 'undefined') return;
    
    const state = {
      usuarios: this.usuarios,
      geneticas: this.geneticas,
      ubicaciones: this.ubicaciones,
      madres: this.madres,
      fenotipos: this.fenotipos,
      plantillas: this.plantillas,
      lotes: this.lotes,
      especimenes: this.especimenes,
      precintos: this.precintos,
      registrosDiarios: this.registrosDiarios,
      lecturasSensores: this.lecturasSensores,
      inaseSemillas: this.inaseSemillas,
      eventosTrazabilidad: this.eventosTrazabilidad,
      cosechas: this.cosechas,
      entregasPacientes: this.entregasPacientes,
    };
    
    localStorage.setItem(this.key, JSON.stringify(state));
  }

  private inicializarSemillas() {
    // 1. Usuarios
    this.usuarios = [
      { id: 'usr-1', nombre: 'Tabaré (Director)', email: 'tabare@cannis.com', rol: 'director', activo: true, created_at: '2026-01-01' },
      { id: 'usr-2', nombre: 'Juan (Jardinero)', email: 'juan@cannis.com', rol: 'jardinero', activo: true, created_at: '2026-01-01' },
      { id: 'usr-3', nombre: 'Sophia (Admin/Trazabilidad)', email: 'sophia@cannis.com', rol: 'admin', activo: true, created_at: '2026-01-01' },
    ];

    // 2. Genéticas
    this.geneticas = [
      { id: 'gen-1', nombre: 'Super Kush', banco: 'Sensi Seeds', tipo: 'indica', notas: 'Crecimiento compacto, alta resina.' },
      { id: 'gen-2', nombre: 'Amnesia Haze', banco: 'Royal Queen Seeds', tipo: 'sativa', notas: 'Ciclo largo, gran estiramiento en flora.' },
      { id: 'gen-3', nombre: 'CBD Charlotte\'s Web', banco: 'CW Botanicals', tipo: 'hibrida', notas: 'Ratio CBD:THC 20:1. Uso medicinal puro.' },
    ];

    // 3. Ubicaciones
    this.ubicaciones = [
      { id: 'loc-1', sala: 'Sala A', zona: 'Fila 1', posicion: 'Carpa 1', tipo: 'carpa', capacidad: 24 },
      { id: 'loc-2', sala: 'Sala A', zona: 'Fila 1', posicion: 'Carpa 2', tipo: 'carpa', capacidad: 24 },
      { id: 'loc-3', sala: 'Sala B', zona: 'Fila 2', posicion: 'Carpa 3', tipo: 'carpa', capacidad: 48 },
      { id: 'loc-4', sala: 'Sala Madres', zona: 'Mesa Principal', posicion: 'Sala Madres 1', tipo: 'sala_madres', capacidad: 10 },
      { id: 'loc-5', sala: 'Secadero General', zona: 'Estantes A', posicion: 'Secadero 1', tipo: 'secado', capacidad: 100 },
    ];

    // 4. Planta Madre
    this.madres = [
      { id: 'mad-1', codigo: 'MADRE-KUSH-01', genetica_id: 'gen-1', ubicacion_id: 'loc-4', fecha_alta: '2026-01-10', estado: 'activa', notas: 'Fenotipo vigoroso y resistente a plagas.' },
      { id: 'mad-2', codigo: 'MADRE-AMNE-02', genetica_id: 'gen-2', ubicacion_id: 'loc-4', fecha_alta: '2026-01-20', estado: 'activa', notas: 'Gran perfil terpénico a limón.' },
    ];

    // 5. Fenotipos
    this.fenotipos = [
      { id: 'fen-1', madre_id: 'mad-1', morfologia: 'Estructura arbustiva, hojas anchas', aroma: 'Terroso, pino, hachís', ciclo_dias: 56, rendimiento_estimado: 450, observaciones: 'Excelente para clonación rápida', fecha_registro: '2026-01-15' },
      { id: 'fen-2', madre_id: 'mad-2', morfologia: 'Estirada, entrenudos largos', aroma: 'Citrico incensado', ciclo_dias: 70, rendimiento_estimado: 550, observaciones: 'Requiere tutorado fuerte', fecha_registro: '2026-01-25' },
    ];

    // 6. Semilla INASE
    this.inaseSemillas = [
      { id: 'in-1', codigo_inase: 'INASE-SEM-5491-KUSH', genetica_id: 'gen-1', proveedor: 'Distribuidora Medicinal ROU', fecha_ingreso: '2026-01-05', cantidad: 50 },
      { id: 'in-2', codigo_inase: 'INASE-SEM-8902-AMNE', genetica_id: 'gen-2', proveedor: 'Barney\'s Farm Import', fecha_ingreso: '2026-01-15', cantidad: 100 },
    ];

    // 7. Plantillas del Plan (Ciclo Estándar de 8 semanas)
    // Inicializaremos un plan estándar de 8 semanas (56 días)
    const plantilla1Id = 'plan-std-8w';
    this.plantillas = [
      {
        id: plantilla1Id,
        nombre: 'Plan Estándar Kush - 8 Semanas',
        genetica_id: 'gen-1',
        duracion_semanas: 8,
        version: 1,
        activa: true,
        dias: [],
      },
    ];

    // Llenar plantilla día por día con acciones
    const diasPlan: PlantillaDia[] = [];
    
    // Generador básico de plan
    for (let sem = 1; sem <= 8; sem++) {
      let fase: 'propagacion' | 'vegetativo' | 'pre_floracion' | 'floracion' | 'lavado' | 'secado' = 'vegetativo';
      if (sem === 1) fase = 'propagacion';
      else if (sem === 2 || sem === 3) fase = 'vegetativo';
      else if (sem === 4) fase = 'pre_floracion';
      else if (sem <= 7) fase = 'floracion';
      else fase = 'lavado';

      for (let d = 1; d <= 7; d++) {
        const diaId = `pday-s${sem}-d${d}`;
        const acciones: PlantillaAccion[] = [];

        // Acción diaria de medición ambiental
        acciones.push({
          id: `pact-med-s${sem}-d${d}`,
          plantilla_dia_id: diaId,
          tipo: 'medicion',
          parametros: {
            temperatura_objetivo: fase === 'propagacion' ? 25 : fase === 'floracion' ? 22 : 24,
            humedad_objetivo: fase === 'propagacion' ? 80 : fase === 'floracion' ? 50 : 65,
            fotoperiodo: fase === 'floracion' || fase === 'lavado' ? '12/12' : '18/6',
          },
          obligatoria: true,
        });

        // Riego o Fertilización cada 2 días
        if (d % 2 === 1) {
          const esFlora = fase === 'pre_floracion' || fase === 'floracion';
          const esLavado = fase === 'lavado';
          
          acciones.push({
            id: `pact-riego-s${sem}-d${d}`,
            plantilla_dia_id: diaId,
            tipo: esLavado ? 'riego' : (d === 1 || d === 5 ? 'fertilizacion' : 'riego'),
            parametros: {
              ml_agua: fase === 'propagacion' ? 100 : esFlora ? 800 : 500,
              ph_objetivo: esFlora ? 6.2 : 5.8,
              ec_objetivo: esLavado ? 0.2 : (fase === 'propagacion' ? 1.0 : esFlora ? 2.0 : 1.6),
              fertilizante: esLavado ? 'Ninguno (Lavado)' : (esFlora ? 'Flora Bloom A+B' : 'Veg Growth A+B'),
              dosis_ml_l: esLavado ? 0 : 2.5,
            },
            obligatoria: true,
          });
        }

        // Poda o defoliación en días específicos
        if (sem === 3 && d === 4) {
          acciones.push({
            id: `pact-poda-s${sem}-d${d}`,
            plantilla_dia_id: diaId,
            tipo: 'poda',
            parametros: { notas: 'Poda apical para fomentar ramificación.' },
            obligatoria: false,
          });
        }
        if (sem === 5 && d === 1) {
          acciones.push({
            id: `pact-defo-s${sem}-d${d}`,
            plantilla_dia_id: diaId,
            tipo: 'defoliacion',
            parametros: { notas: 'Defoliación de tercios inferiores (Lollipop).' },
            obligatoria: true,
          });
        }

        diasPlan.push({
          id: diaId,
          plantilla_id: plantilla1Id,
          semana: sem,
          dia: d,
          fase,
          acciones,
        });
      }
    }
    
    this.plantillas[0].dias = diasPlan;

    // 8. Lotes en Curso
    // Crearemos 3 lotes en distintas etapas
    this.lotes = [
      {
        id: 'lot-kush-floracion',
        codigo: 'LOTE-KUSH-FLORA-04',
        plantilla_id: plantilla1Id,
        ubicacion_id: 'loc-3', // Carpa 3
        fecha_inicio: this.obtenerFechaRelativa(-32), // Lleva 32 días de ciclo (Semana 5, Día 4)
        estado: 'activo',
        responsable_id: 'usr-2', // Asignado a Juan
      },
      {
        id: 'lot-amne-vegetativo',
        codigo: 'LOTE-AMNE-VEG-09',
        plantilla_id: plantilla1Id,
        ubicacion_id: 'loc-2', // Carpa 2
        fecha_inicio: this.obtenerFechaRelativa(-10), // Lleva 10 días de ciclo (Semana 2, Día 3)
        estado: 'activo',
        responsable_id: 'usr-2',
      },
      {
        id: 'lot-char-propagacion',
        codigo: 'LOTE-CBD-CHAR-01',
        plantilla_id: plantilla1Id,
        ubicacion_id: 'loc-1', // Carpa 1
        fecha_inicio: this.obtenerFechaRelativa(-2), // Lleva 2 días de ciclo (Semana 1, Día 2)
        estado: 'activo',
        responsable_id: 'usr-2',
      },
    ];

    // 9. Especímenes y Precintos
    // Lote Kush de floración tiene 12 plantas
    const coloresPrecinto: ('verde' | 'amarillo' | 'azul' | 'rojo' | 'morado' | 'blanco')[] = ['morado', 'amarillo', 'verde'];
    
    this.lotes.forEach((lote, lIndex) => {
      const color = coloresPrecinto[lIndex];
      const letra = String.fromCharCode(65 + lIndex); // A, B, C...
      const cantPlantas = lote.id === 'lot-kush-floracion' ? 8 : 4;

      for (let i = 1; i <= cantPlantas; i++) {
        const espId = `esp-${lote.codigo}-${i}`;
        const precintoId = `prec-${color}-${letra}-${i}`;
        const codigoCompleto = `${color.toUpperCase()}-${letra}-${String(i).padStart(3, '0')}`;

        // Crear Especimen
        this.especimenes.push({
          id: espId,
          codigo: `ESP-${lote.codigo.split('-')[1]}-${String(i).padStart(3, '0')}`,
          lote_id: lote.id,
          madre_id: lIndex === 0 ? 'mad-1' : 'mad-2',
          precinto_id: codigoCompleto,
          ubicacion_id: lote.ubicacion_id,
          estado: 'viva',
          fecha_alta: lote.fecha_inicio,
        });

        // Crear Precinto físico enlazado
        this.precintos.push({
          id: precintoId,
          color,
          letra,
          codigo_completo: codigoCompleto,
          categoria: lIndex === 0 ? 'Floración' : (lIndex === 1 ? 'Vegetativo' : 'Propagación'),
          especimen_id: espId,
          estado: 'activo',
        });
      }
    });

    // 10. Historial de Registros Diarios y Desvíos
    // Crearemos registros diarios para el Lote Kush de Floración para los últimos 10 días,
    // inyectando intencionalmente algunos desvíos realistas para alimentar los hermosos gráficos.
    const loteKush = this.lotes[0];
    const fechaInicioKush = new Date(loteKush.fecha_inicio);
    
    for (let dayOffset = 20; dayOffset <= 31; dayOffset++) {
      const fechaReg = this.formatearFecha(new Date(fechaInicioKush.getTime() + dayOffset * 24 * 60 * 60 * 1000));
      
      // Encontrar qué día del plan corresponde a este offset
      const semanaPlan = Math.floor(dayOffset / 7) + 1;
      const diaSemanaPlan = (dayOffset % 7) + 1;
      const idRegDiario = `rd-${loteKush.id}-day-${dayOffset}`;

      // Crear cabecera del registro diario
      this.registrosDiarios.push({
        id: idRegDiario,
        lote_id: loteKush.id,
        fecha: fechaReg,
        autor_id: 'usr-2', // Hecho por Juan (Jardinero)
        completado: true,
        acciones: [],
      });

      // Obtener las acciones planificadas para ese día de la plantilla
      const diaPlan = this.plantillas[0].dias?.find(d => d.semana === semanaPlan && d.dia === diaSemanaPlan);
      const accionesReg: RegistroAccion[] = [];

      diaPlan?.acciones?.forEach((pact) => {
        const parametrosReal = { ...pact.parametros };
        let notas = '';

        // INYECTAR DESVÍOS REALISTAS EN DÍAS ESPECÍFICOS
        if (pact.tipo === 'riego' || pact.tipo === 'fertilizacion') {
          if (dayOffset === 22) {
            // Desvío de pH muy alto (Grave)
            parametrosReal.ph = 6.9; // Esperado 6.2
            notas = 'El buffer de pH falló en el tanque. Se regó igual por falta de tiempo.';
          } else if (dayOffset === 25) {
            // Desvío de EC bajo (Moderado)
            parametrosReal.ec = 1.6; // Esperado 2.0
            notas = 'Se diluyó un poco más la mezcla porque las puntas de las hojas mostraban leve sobrefertilización.';
          } else if (dayOffset === 28) {
            // Desvío de cantidad de agua (Leve)
            parametrosReal.ml_agua = 950; // Esperado 800
            notas = 'Sustrato excesivamente seco, se agregaron 150ml extra por maceta.';
          } else {
            // Riego perfecto en plan
            parametrosReal.ph = pact.parametros.ph_objetivo;
            parametrosReal.ec = pact.parametros.ec_objetivo;
            parametrosReal.ml_agua = pact.parametros.ml_agua;
          }
          // Copiar otros parámetros
          parametrosReal.fertilizante = pact.parametros.fertilizante;
          parametrosReal.dosis_ml_l = pact.parametros.dosis_ml_l;
        }

        if (pact.tipo === 'medicion') {
          // Las mediciones son lo real observado
          parametrosReal.temperatura = (pact.parametros.temperatura_objetivo ?? 24) + (Math.random() * 2 - 1);
          parametrosReal.humedad = (pact.parametros.humedad_objetivo ?? 60) + (Math.random() * 8 - 4);
          parametrosReal.fotoperiodo = pact.parametros.fotoperiodo;
        }

        // Tarea omitida intencionalmente (Defoliación de la semana 5 día 1 / dayOffset 28)
        let hecha = true;
        if (pact.tipo === 'defoliacion' && dayOffset === 28) {
          hecha = false;
          notas = 'Juan no llegó con el tiempo; reprogramado para el día siguiente.';
        }

        accionesReg.push({
          id: `ra-${pact.id}-${dayOffset}`,
          registro_diario_id: idRegDiario,
          plantilla_accion_id: pact.id,
          tipo: pact.tipo,
          parametros_real: parametrosReal,
          hecha,
          hora: '09:30:00',
          notas: notas || undefined,
        });
      });

      // Si fue el día siguiente al omitido, agregar una acción de defoliación "extra" o reprogramada
      if (dayOffset === 29) {
        accionesReg.push({
          id: `ra-extra-defo-29`,
          registro_diario_id: idRegDiario,
          plantilla_accion_id: `pact-defo-s5-d1`, // apunta a la de ayer
          tipo: 'defoliacion',
          parametros_real: {},
          hecha: true,
          hora: '10:00:00',
          notas: 'Defoliación completada con éxito (reprogramada de ayer).',
        });
      }

      // Guardar acciones en el registro diario
      const idx = this.registrosDiarios.findIndex(r => r.id === idRegDiario);
      if (idx !== -1) {
        this.registrosDiarios[idx].acciones = accionesReg;
      }
    }

    // 11. Cargar lecturas de sensores virtuales en tiempo real
    this.generarSensoresSemilla();

    // 12. Cosechas y entrega semilla de pruebas pasadas
    this.cosechas = [
      {
        id: 'cos-1',
        lote_id: 'lot-kush-floracion', // es un lote activo, pero simulamos una cosecha histórica del mismo plan
        fecha: '2026-04-15',
        peso_humedo: 2540.50,
        peso_seco: 512.20,
        merma: 79.80,
        notas: 'Excelente calidad de cogollos, alta concentración de terpenos.',
      }
    ];

    this.entregasPacientes = [
      {
        id: 'ent-1',
        cosecha_id: 'cos-1',
        paciente_ref: 'REPRO-8492-AX',
        cantidad: 40.00,
        fecha: '2026-05-01',
      },
      {
        id: 'ent-2',
        cosecha_id: 'cos-1',
        paciente_ref: 'REPRO-1123-ZZ',
        cantidad: 20.00,
        fecha: '2026-05-05',
      }
    ];
  }

  // Helper: Genera lecturas de sensores para las carpas activas
  private generarSensoresSemilla() {
    this.lecturasSensores = [];
    const carpas = ['loc-1', 'loc-2', 'loc-3']; // Carpas 1, 2, 3
    const ahora = new Date();

    carpas.forEach((carpaId) => {
      // Generar serie de las últimas 24 horas (una lectura cada hora)
      for (let h = 24; h >= 0; h--) {
        const timeRead = new Date(ahora.getTime() - h * 60 * 60 * 1000);
        const timestamp = timeRead.toISOString();
        
        // Simular variación senoidal diurna de temperatura y humedad
        const horaDelDia = timeRead.getHours();
        const factorDiurno = Math.sin((horaDelDia - 6) * Math.PI / 12); // -1 a +1 (máximo a las 18hs, mínimo a las 6hs)

        let tempBase = 22.5;
        let humBase = 60;
        
        if (carpaId === 'loc-1') { tempBase = 25.0; humBase = 75; } // Propagación
        if (carpaId === 'loc-3') { tempBase = 21.0; humBase = 48; } // Floración

        const temp = tempBase + factorDiurno * 2.5 + Math.random() * 0.4;
        const hum = humBase - factorDiurno * 8 + Math.random() * 1.5;

        // Calcular VPD estimado en kPa:
        // Presión de vapor de saturación (SVP) = 0.61078 * exp((17.27 * T) / (T + 237.3))
        // Presión de vapor real (AVP) = SVP * (RH / 100)
        // VPD = SVP - AVP
        const svp = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
        const avp = svp * (hum / 100);
        const vpd = Math.max(0.1, Number((svp - avp).toFixed(2)));

        this.lecturasSensores.push(
          { id: this.lecturasSensores.length + 1, ubicacion_id: carpaId, sensor_tipo: 'temp', valor: Number(temp.toFixed(1)), unidad: '°C', timestamp },
          { id: this.lecturasSensores.length + 1, ubicacion_id: carpaId, sensor_tipo: 'humedad', valor: Number(hum.toFixed(0)), unidad: '%', timestamp },
          { id: this.lecturasSensores.length + 1, ubicacion_id: carpaId, sensor_tipo: 'vpd', valor: vpd, unidad: 'kPa', timestamp },
          { id: this.lecturasSensores.length + 1, ubicacion_id: carpaId, sensor_tipo: 'co2', valor: Number((500 + factorDiurno * 100 + Math.random() * 20).toFixed(0)), unidad: 'ppm', timestamp }
        );
      }
    });
  }

  // ==========================================
  // 3. MÉTODOS DE CONSULTA Y ESCRITURA (API)
  // ==========================================

  // Obtener lote por ID
  getLote(id: string): Lote | undefined {
    return this.lotes.find(l => l.id === id);
  }

  // Obtener todos los lotes
  getLotes(): Lote[] {
    return this.lotes;
  }

  // Obtener registros diarios para un lote
  getRegistrosDiarios(loteId: string): RegistroDiario[] {
    return this.registrosDiarios.filter(rd => rd.lote_id === loteId);
  }

  // Obtener registros de un día específico
  getRegistroDiario(loteId: string, fechaStr: string): RegistroDiario | undefined {
    return this.registrosDiarios.find(rd => rd.lote_id === loteId && rd.fecha === fechaStr);
  }

  // Crear o actualizar un registro diario (Jardinero completa checklist)
  guardarRegistroDiario(
    loteId: string,
    fechaStr: string,
    autorId: string,
    acciones: Omit<RegistroAccion, 'id' | 'registro_diario_id'>[]
  ): RegistroDiario {
    let regDiario = this.getRegistroDiario(loteId, fechaStr);
    
    if (!regDiario) {
      regDiario = {
        id: `rd-${loteId}-${fechaStr}`,
        lote_id: loteId,
        fecha: fechaStr,
        autor_id: autorId,
        completado: false,
        acciones: [],
      };
      this.registrosDiarios.push(regDiario);
    }

    const regDiarioId = regDiario.id;

    // Mapear y guardar las acciones
    const accionesGuardadas: RegistroAccion[] = acciones.map((acc, index) => ({
      id: `ra-${regDiarioId}-${index}-${Date.now()}`,
      registro_diario_id: regDiarioId,
      ...acc,
    }));

    regDiario.acciones = accionesGuardadas;
    
    // Evaluar si todas las acciones obligatorias del plan están hechas
    const lote = this.getLote(loteId);
    const plan = this.plantillas.find(p => p.id === lote?.plantilla_id);
    
    // Determinar día del ciclo
    const diaCiclo = this.calcularDiaDeCiclo(lote?.fecha_inicio || '', fechaStr);
    const semanaPlan = Math.floor((diaCiclo - 1) / 7) + 1;
    const diaSemanaPlan = ((diaCiclo - 1) % 7) + 1;

    const planDia = plan?.dias?.find(d => d.semana === semanaPlan && d.dia === diaSemanaPlan);
    const accionesObligatorias = planDia?.acciones?.filter(a => a.obligatoria) || [];

    const todasHechas = accionesObligatorias.every(pact => 
      accionesGuardadas.find(r => r.plantilla_accion_id === pact.id && r.hecha)
    );

    regDiario.completado = todasHechas;
    
    // Actualizar en el listado maestro
    const idx = this.registrosDiarios.findIndex(r => r.id === regDiarioId);
    if (idx !== -1) {
      this.registrosDiarios[idx] = regDiario;
    }

    // Registrar eventos de trazabilidad si hay acciones importantes hechas (ej. trasplante, cosecha)
    accionesGuardadas.forEach((acc) => {
      if (acc.hecha && (acc.tipo === 'trasplante' || acc.tipo === 'poda')) {
        this.registrarEventoTrazabilidad({
          lote_id: loteId,
          tipo: acc.tipo === 'trasplante' ? 'trasplante' : 'tratamiento',
          fecha: fechaStr,
          autor_id: autorId,
          datos: { notas: acc.notas, accion: acc.tipo, parametros: acc.parametros_real },
        });
      }
    });

    this.guardar();
    return regDiario;
  }

  // Obtener desvíos acumulados de un lote (para Vista Nerd / Informes)
  getDesviosLote(loteId: string): AnalisisDesvio[] {
    const lot = this.getLote(loteId);
    if (!lot) return [];
    
    const plan = this.plantillas.find(p => p.id === lot.plantilla_id);
    const registros = this.getRegistrosDiarios(loteId);
    const desviosCalculados: AnalisisDesvio[] = [];

    registros.forEach((rd) => {
      rd.acciones?.forEach((ra) => {
        // Buscar su plantilla correspondiente si existe
        const pact = plan?.dias
          ?.flatMap(d => d.acciones || [])
          .find(pa => pa.id === ra.plantilla_accion_id);

        const analisis = analizarDesvio(ra, pact, loteId, rd.fecha);
        if (analisis.tipoDesvio !== 'ninguno') {
          desviosCalculados.push(analisis);
        }
      });
    });

    return desviosCalculados.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  // Registrar un evento de trazabilidad legal
  registrarEventoTrazabilidad(evt: Omit<EventoTrazabilidad, 'id'>): EventoTrazabilidad {
    const nuevoEvt: EventoTrazabilidad = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      ...evt,
    };
    this.eventosTrazabilidad.push(nuevoEvt);
    this.guardar();
    return nuevoEvt;
  }

  // Buscar historial de trazabilidad por código de precinto o espécimen
  buscarTrazabilidadPrecinto(codigoPrecinto: string): {
    especimen: Especimen | undefined;
    precinto: Precinto | undefined;
    lote: Lote | undefined;
    genetica: Genetica | undefined;
    origenInase: InaseSemilla | undefined;
    eventos: EventoTrazabilidad[];
    cosecha: Cosecha | undefined;
    entregas: EntregaPaciente[];
  } {
    const p = this.precintos.find(pr => pr.codigo_completo.toUpperCase() === codigoPrecinto.toUpperCase());
    const esp = this.especimenes.find(e => e.id === p?.especimen_id);
    const lote = this.lotes.find(l => l.id === esp?.lote_id);
    const gen = this.geneticas.find(g => g.id === (this.madres.find(m => m.id === esp?.madre_id)?.genetica_id || lote?.plantilla_id));
    const inase = this.inaseSemillas.find(i => i.genetica_id === gen?.id);
    
    // Obtener todos los eventos relacionados
    const eventos = this.eventosTrazabilidad.filter(e => e.especimen_id === esp?.id || e.lote_id === lote?.id)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    const cos = this.cosechas.find(c => c.lote_id === lote?.id);
    const ent = this.entregasPacientes.filter(e => e.cosecha_id === cos?.id);

    return {
      especimen: esp,
      precinto: p,
      lote,
      genetica: gen,
      origenInase: inase,
      eventos,
      cosecha: cos,
      entregas: ent,
    };
  }

  // Agregar nueva planta madre
  crearMadre(mad: Omit<Madre, 'id' | 'fecha_alta' | 'estado'>): Madre {
    const nuevaMad: Madre = {
      id: `mad-${Date.now()}`,
      fecha_alta: this.formatearFecha(new Date()),
      estado: 'activa',
      ...mad,
      codigo: mad.codigo.toUpperCase()
    };
    this.madres.push(nuevaMad);
    this.guardar();
    return nuevaMad;
  }

  // Agregar nuevo registro de fenotipo para una madre
  registrarFenotipo(feno: Omit<Fenotipo, 'id' | 'fecha_registro'>): Fenotipo {
    const nuevoFeno: Fenotipo = {
      id: `feno-${Date.now()}`,
      fecha_registro: this.formatearFecha(new Date()),
      ...feno
    };
    this.fenotipos.push(nuevoFeno);
    this.guardar();
    return nuevoFeno;
  }

  // Agregar nueva genética al catálogo
  crearGenetica(gen: Omit<Genetica, 'id'>): Genetica {
    const nuevaGen: Genetica = {
      id: `gen-${Date.now()}`,
      ...gen
    };
    this.geneticas.push(nuevaGen);
    this.guardar();
    return nuevaGen;
  }

  // Agregar un lote y asignarle especímenes y precintos automáticamente
  crearLote(loteData: Omit<Lote, 'id' | 'codigo' | 'estado'>, cantPlantas: number, colorPrecinto: Precinto['color']): Lote {
    const id = `lot-${Date.now()}`;
    const codigo = `LOTE-${loteData.fecha_inicio.replace(/-/g, '').slice(2, 6)}-${String(this.lotes.length + 1).padStart(2, '0')}`;
    
    const nuevoLote: Lote = {
      id,
      codigo,
      estado: 'activo',
      ...loteData
    };
    this.lotes.push(nuevoLote);

    // Generar especímenes y precintos para este lote
    const letra = String.fromCharCode(65 + (this.lotes.length % 26)); // Letra única rotativa

    for (let i = 1; i <= cantPlantas; i++) {
      const espId = `esp-${id}-${i}`;
      const precintoId = `prec-${colorPrecinto}-${letra}-${i}-${Date.now()}`;
      const codigoCompleto = `${colorPrecinto.toUpperCase()}-${letra}-${String(i).padStart(3, '0')}`;

      this.especimenes.push({
        id: espId,
        codigo: `ESP-${codigo.split('-')[1]}-${String(i).padStart(3, '0')}`,
        lote_id: id,
        ubicacion_id: loteData.ubicacion_id,
        estado: 'viva',
        fecha_alta: loteData.fecha_inicio,
      });

      this.precintos.push({
        id: precintoId,
        color: colorPrecinto,
        letra,
        codigo_completo: codigoCompleto,
        categoria: 'Asignado',
        especimen_id: espId,
        estado: 'activo',
      });
    }

    // Registrar evento de trazabilidad inicial
    this.registrarEventoTrazabilidad({
      lote_id: id,
      tipo: 'alta',
      fecha: loteData.fecha_inicio,
      autor_id: loteData.responsable_id,
      datos: { notas: 'Inicio de lote de cultivo.', cantidad_plantas: cantPlantas, precintos_letra: letra, precintos_color: colorPrecinto },
    });

    this.guardar();
    return nuevoLote;
  }

  // Clonar y guardar una plantilla
  clonarPlantilla(plantillaId: string, nuevoNombre: string): PlantillaPlan | undefined {
    const original = this.plantillas.find(p => p.id === plantillaId);
    if (!original) return undefined;

    const clonId = `plan-${Date.now()}`;
    const clon: PlantillaPlan = {
      ...original,
      id: clonId,
      nombre: nuevoNombre,
      version: original.version + 1,
      activa: true,
      dias: original.dias?.map(d => ({
        ...d,
        id: `pday-clon-${d.semana}-${d.dia}-${Date.now()}`,
        plantilla_id: clonId,
        acciones: d.acciones?.map(a => ({
          ...a,
          id: `pact-clon-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          plantilla_dia_id: `pday-clon-${d.semana}-${d.dia}-${Date.now()}`,
        })),
      })) || [],
    };

    this.plantillas.push(clon);
    this.guardar();
    return clon;
  }

  // ==========================================
  // 4. METODOS UTILERÍA (FECHAS Y CÁLCULOS)
  // ==========================================

  // Calcula qué día de cultivo absoluto corresponde en una fecha real
  calcularDiaDeCiclo(fechaInicioStr: string, fechaActualStr: string): number {
    const inicio = new Date(fechaInicioStr);
    const actual = new Date(fechaActualStr);
    const diffTime = actual.getTime() - inicio.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays);
  }

  private obtenerFechaRelativa(daysOffset: number): string {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return this.formatearFecha(d);
  }

  private formatearFecha(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Genera lecturas de sensores actuales en vivo
  getSensoresEnVivo(ubicacionId: string): {
    temp: { actual: number; esperado: number; historico: number[] };
    humedad: { actual: number; esperado: number; historico: number[] };
    vpd: { actual: number; esperado: number; historico: number[] };
    co2: { actual: number; esperado: number; historico: number[] };
  } {
    // Regenerar para simular el paso del tiempo
    this.generarSensoresSemilla();

    const lecturas = this.lecturasSensores.filter(l => l.ubicacion_id === ubicacionId);
    
    const filterAndMap = (tipo: LecturaSensor['sensor_tipo']) => 
      lecturas.filter(l => l.sensor_tipo === tipo).sort((a, b) => a.timestamp.localeCompare(b.timestamp)).map(l => l.valor);

    const tempH = filterAndMap('temp');
    const humH = filterAndMap('humedad');
    const vpdH = filterAndMap('vpd');
    const co2H = filterAndMap('co2');

    // Encontrar el lote en esa carpa para ver los rangos esperados
    const lote = this.lotes.find(l => l.ubicacion_id === ubicacionId && l.estado === 'activo');
    const plan = this.plantillas.find(p => p.id === lote?.plantilla_id);
    const diaCiclo = lote ? this.calcularDiaDeCiclo(lote.fecha_inicio, this.formatearFecha(new Date())) : 1;
    const sem = Math.floor((diaCiclo - 1) / 7) + 1;
    const dia = ((diaCiclo - 1) % 7) + 1;

    const diaPlan = plan?.dias?.find(d => d.semana === sem && d.dia === dia);
    const medAccion = diaPlan?.acciones?.find(a => a.tipo === 'medicion');

    return {
      temp: {
        actual: tempH[tempH.length - 1] || 24,
        esperado: medAccion?.parametros.temperatura_objetivo || 24,
        historico: tempH.slice(-12), // últimas 12 horas
      },
      humedad: {
        actual: humH[humH.length - 1] || 60,
        esperado: medAccion?.parametros.humedad_objetivo || 60,
        historico: humH.slice(-12),
      },
      vpd: {
        actual: vpdH[vpdH.length - 1] || 1.1,
        esperado: Number((medAccion?.parametros.temperatura_objetivo === 25 ? 0.8 : 1.15).toFixed(2)),
        historico: vpdH.slice(-12),
      },
      co2: {
        actual: co2H[co2H.length - 1] || 500,
        esperado: 600,
        historico: co2H.slice(-12),
      }
    };
  }
}

// Exportar una instancia singleton del mock DB para usarla de manera transversal en toda la app
export const mockDb = new MockDatabase();
export default mockDb;
