// Calculadora de Desvíos Analíticos - Cannis Módulo de Cultivo
// Compara el plan estándar (plantilla) contra la ejecución diaria real

export type TipoDesvio = 'no_realizada' | 'parametro_distinto' | 'extra' | 'ninguno';
export type GravedadDesvio = 'leve' | 'moderada' | 'grave' | 'ninguna';

export interface DetalleDesvio {
  campo: string;
  esperado: any;
  real: any;
  magnitud: number | null;
  gravedad: GravedadDesvio;
}

export interface AnalisisDesvio {
  registroAccionId: string;
  loteId: string;
  fecha: string;
  accionTipo: string;
  tipoDesvio: TipoDesvio;
  gravedadGeneral: GravedadDesvio;
  desviosCampos: DetalleDesvio[];
  notas?: string;
  hecha: boolean;
}

/**
 * Compara un registro de acción real contra su plantilla planificada y genera un desglose de desvíos.
 */
export function analizarDesvio(
  registroAccion: {
    id: string;
    tipo: string;
    parametros_real: Record<string, any>;
    hecha: boolean;
    notas?: string;
    plantilla_accion_id?: string | null;
  },
  plantillaAccion?: {
    id: string;
    tipo: string;
    parametros: Record<string, any>;
    obligatoria: boolean;
  } | null,
  loteId: string = '',
  fecha: string = ''
): AnalisisDesvio {
  const result: AnalisisDesvio = {
    registroAccionId: registroAccion.id,
    loteId,
    fecha,
    accionTipo: registroAccion.tipo,
    tipoDesvio: 'ninguno',
    gravedadGeneral: 'ninguna',
    desviosCampos: [],
    notas: registroAccion.notas,
    hecha: registroAccion.hecha,
  };

  // 1. Caso: Tarea obligatoria planificada no realizada
  if (plantillaAccion && !registroAccion.hecha) {
    if (plantillaAccion.obligatoria) {
      result.tipoDesvio = 'no_realizada';
      result.gravedadGeneral = 'grave';
      result.desviosCampos.push({
        campo: 'hecha',
        esperado: true,
        real: false,
        magnitud: null,
        gravedad: 'grave',
      });
    } else {
      result.tipoDesvio = 'no_realizada';
      result.gravedadGeneral = 'leve';
      result.desviosCampos.push({
        campo: 'hecha',
        esperado: true,
        real: false,
        magnitud: null,
        gravedad: 'leve',
      });
    }
    return result;
  }

  // 2. Caso: Acción extra fuera de plan
  if (!plantillaAccion) {
    result.tipoDesvio = 'extra';
    result.gravedadGeneral = 'leve'; // Las tareas extras suelen ser preventivas o mimos (poda extra, etc)
    result.desviosCampos.push({
      campo: 'plantilla_accion_id',
      esperado: null,
      real: registroAccion.tipo,
      magnitud: null,
      gravedad: 'leve',
    });
    return result;
  }

  // 3. Caso: Comparación de parámetros específicos (Plan vs Real)
  const planParams = plantillaAccion.parametros || {};
  const realParams = registroAccion.parametros_real || {};
  const desviosEncontrados: DetalleDesvio[] = [];

  // Campos numéricos típicos a comparar
  const camposNumericos = [
    { keyPlan: 'ph_objetivo', keyReal: 'ph', label: 'pH', toleranciaGrave: 0.5, toleranciaModerada: 0.2 },
    { keyPlan: 'ec_objetivo', keyReal: 'ec', label: 'EC (mS/cm)', toleranciaGrave: 0.4, toleranciaModerada: 0.15 },
    { keyPlan: 'ml_agua', keyReal: 'ml_agua', label: 'Riego (ml)', toleranciaGrave: 200, toleranciaModerada: 100, esPorcentaje: true },
    { keyPlan: 'dosis_ml_l', keyReal: 'dosis_ml_l', label: 'Fertilizante (ml/L)', toleranciaGrave: 1.5, toleranciaModerada: 0.5 },
    { keyPlan: 'temperatura_objetivo', keyReal: 'temperatura', label: 'Temperatura (°C)', toleranciaGrave: 4, toleranciaModerada: 2 },
    { keyPlan: 'humedad_objetivo', keyReal: 'humedad', label: 'Humedad (%)', toleranciaGrave: 15, toleranciaModerada: 7 },
  ];

  for (const c of camposNumericos) {
    const valPlan = planParams[c.keyPlan] !== undefined ? planParams[c.keyPlan] : planParams[c.keyReal];
    const valReal = realParams[c.keyReal] !== undefined ? realParams[c.keyReal] : realParams[c.keyPlan];

    if (valPlan !== undefined && valReal !== undefined && valPlan !== null && valReal !== null) {
      const numPlan = Number(valPlan);
      const numReal = Number(valReal);

      if (!isNaN(numPlan) && !isNaN(numReal) && numPlan !== numReal) {
        const diff = numReal - numPlan;
        const absDiff = Math.abs(diff);
        let gravedad: GravedadDesvio = 'ninguna';

        if (c.esPorcentaje) {
          // Para riego, medimos la diferencia relativa al planificado
          const pctDiff = (absDiff / numPlan) * 100;
          if (pctDiff >= 30) gravedad = 'grave';
          else if (pctDiff >= 15) gravedad = 'moderada';
          else if (pctDiff >= 5) gravedad = 'leve';
        } else {
          // Diferencia absoluta estándar
          if (absDiff >= c.toleranciaGrave) gravedad = 'grave';
          else if (absDiff >= c.toleranciaModerada) gravedad = 'moderada';
          else gravedad = 'leve';
        }

        if (gravedad !== 'ninguna') {
          desviosEncontrados.push({
            campo: c.label,
            esperado: numPlan,
            real: numReal,
            magnitud: Number(diff.toFixed(2)),
            gravedad,
          });
        }
      }
    }
  }

  // Comparación de parámetros textuales o lógicos (ej: fotoperiodo, tipo de fertilizante)
  const camposTextuales = [
    { key: 'fotoperiodo', label: 'Fotoperíodo' },
    { key: 'fertilizante', label: 'Tipo de Nutriente' },
  ];

  for (const c of camposTextuales) {
    if (planParams[c.key] && realParams[c.key] && planParams[c.key] !== realParams[c.key]) {
      desviosEncontrados.push({
        campo: c.label,
        esperado: planParams[c.key],
        real: realParams[c.key],
        magnitud: null,
        gravedad: 'moderada', // El cambio de nutrientes o fotoperiodo es un desvío importante
      });
    }
  }

  if (desviosEncontrados.length > 0) {
    result.tipoDesvio = 'parametro_distinto';
    result.desviosCampos = desviosEncontrados;

    // Determinar la gravedad general del registro (la peor gravedad encontrada)
    if (desviosEncontrados.some(d => d.gravedad === 'grave')) {
      result.gravedadGeneral = 'grave';
    } else if (desviosEncontrados.some(d => d.gravedad === 'moderada')) {
      result.gravedadGeneral = 'moderada';
    } else {
      result.gravedadGeneral = 'leve';
    }
  }

  return result;
}
