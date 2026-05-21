'use client';

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/lib/context/AppContext';
import { mockDb, Lote, RegistroDiario, RegistroAccion } from '@/lib/supabase/mockDb';
import { 
  LineChart as ChartIcon,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Droplet,
  Layers,
  Thermometer,
  Sliders,
  Filter,
  ArrowRight,
  Sparkles,
  Info,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function VistaNerdPage() {
  const { lotes, selectedLoteId, setSelectedLoteId } = useAppContext();
  
  // Filtros locales
  const [loteId, setLoteId] = useState<string>(selectedLoteId);
  const [filtroGravedad, setFiltroGravedad] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  // Datos del lote seleccionado
  const [lote, setLote] = useState<Lote | null>(null);
  const [registros, setRegistros] = useState<RegistroDiario[]>([]);
  const [desvios, setDesvios] = useState<any[]>([]);
  
  // Datos para los gráficos
  const [chartData, setChartData] = useState<any[]>([]);

  const cargarDatosLote = (id: string) => {
    // 1. Obtener registros e historial
    const list = mockDb.getRegistrosDiarios(id).sort((a, b) => a.fecha.localeCompare(b.fecha));
    setRegistros(list);

    // 2. Obtener desvíos analíticos calculados por el motor
    const devList = mockDb.getDesviosLote(id);
    setDesvios(devList);

    // 3. Formatear datos para el gráfico de pH/EC (últimos 10 riegos/registros)
    const lotObj = mockDb.getLote(id);
    const plan = mockDb.plantillas.find(p => p.id === lotObj?.plantilla_id);

    const dataGraficos = list.map((rd) => {
      // Buscar el día del ciclo correspondiente
      const diaCiclo = lotObj ? mockDb.calcularDiaDeCiclo(lotObj.fecha_inicio, rd.fecha) : 1;
      const sem = Math.floor((diaCiclo - 1) / 7) + 1;
      const dia = ((diaCiclo - 1) % 7) + 1;
      
      const diaPlan = plan?.dias?.find(d => d.semana === sem && d.dia === dia);
      const riegoPlan = diaPlan?.acciones?.find(a => a.tipo === 'riego' || a.tipo === 'fertilizacion');
      const riegoReal = rd.acciones?.find(a => a.tipo === 'riego' || a.tipo === 'fertilizacion');

      return {
        fecha: rd.fecha.slice(5), // ej. "05-21"
        diaCiclo,
        ph_plan: riegoPlan?.parametros?.ph_objetivo || null,
        ph_real: riegoReal?.hecha ? riegoReal.parametros_real.ph || null : null,
        ec_plan: riegoPlan?.parametros?.ec_objetivo || null,
        ec_real: riegoReal?.hecha ? riegoReal.parametros_real.ec || null : null,
      };
    }).filter(d => d.ph_plan !== null || d.ph_real !== null);

    setChartData(dataGraficos);
  };

  useEffect(() => {
    if (selectedLoteId) {
      const t = setTimeout(() => {
        setLoteId(selectedLoteId);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [selectedLoteId]);

  useEffect(() => {
    if (loteId) {
      const t = setTimeout(() => {
        setSelectedLoteId(loteId);
        const lot = mockDb.getLote(loteId);
        setLote(lot || null);
        if (lot) {
          cargarDatosLote(lot.id);
        }
      }, 0);
      return () => clearTimeout(t);
    }
  }, [loteId]);

  // Filtrar desvíos
  const desviosFiltrados = desvios.filter((d) => {
    const cumpleGravedad = filtroGravedad === 'todos' || d.gravedadGeneral === filtroGravedad;
    const cumpleTipo = filtroTipo === 'todos' || d.tipoDesvio === filtroTipo;
    return cumpleGravedad && cumpleTipo;
  });

  return (
    <div className="space-y-8 pb-12">
      
      {/* HEADER DE PANTALLA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ChartIcon className="w-6 h-6 text-emerald-500" />
            Vista Nerd (Análisis de Desvíos)
          </h1>
          <p className="text-muted-foreground text-sm">
            Control de desvíos agronómicos de plan vs real en conductividad (EC), acidez (pH) y omisiones.
          </p>
        </div>

        {/* Lote Selector */}
        <div className="flex items-center gap-2 self-start md:self-center bg-[#10161d] p-1.5 rounded-lg border border-[#1e293b]">
          <span className="text-xs text-muted-foreground font-bold pl-2 pr-1 uppercase">Lote:</span>
          <select
            value={loteId}
            onChange={(e) => setLoteId(e.target.value)}
            className="text-xs bg-[#090d10] border border-[#1e293b] rounded-md px-2 py-1 focus:outline-none focus:border-emerald-500 font-bold"
          >
            {lotes.map(l => {
              const gen = mockDb.geneticas.find(g => g.id === l.plantilla_id || g.id === 'gen-1');
              return (
                <option key={l.id} value={l.id}>{l.codigo} ({gen?.nombre})</option>
              );
            })}
          </select>
        </div>
      </div>

      {lote && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          
          {/* COLUMNA IZQUIERDA: GRÁFICOS Y ANALÍTICA DE NUTRIENTES (Ocupa 2/3 columnas en XL) */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* GRÁFICO 1: CONTROL DE PH */}
            <div className="bg-[#10161d] border border-[#1e293b] p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                    <Droplet className="w-4 h-4 text-emerald-500" />
                    Histórico de Acidez de Riego (pH)
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Superposición de pH real medido por el jardinero sobre el rango esperado del plan.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-emerald-500" />
                    <span className="text-emerald-400">pH REAL</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-slate-500 border border-dashed" />
                    <span className="text-muted-foreground">pH PLAN</span>
                  </div>
                </div>
              </div>

              {/* GRÁFICO PH CUSTOM SVG COMPONENT */}
              <div className="h-64 relative pt-2">
                {chartData.length > 0 ? (
                  renderCustomLineChart(chartData, 'ph_plan', 'ph_real', '#6b7280', '#10b981', [5.0, 7.5])
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground border border-dashed border-[#1e293b] rounded-xl">
                    No hay suficientes riegos registrados en este lote para graficar.
                  </div>
                )}
              </div>
            </div>

            {/* GRÁFICO 2: CONTROL DE EC */}
            <div className="bg-[#10161d] border border-[#1e293b] p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    Conductividad Eléctrica (EC) del Sustrato
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Dosis salina / nutrientes reales administrados vs plan de nutrición del fenotipo.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-purple-500" />
                    <span className="text-purple-400">EC REAL</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-slate-500 border border-dashed" />
                    <span className="text-muted-foreground">EC PLAN</span>
                  </div>
                </div>
              </div>

              {/* GRÁFICO EC CUSTOM SVG COMPONENT */}
              <div className="h-64 relative pt-2">
                {chartData.length > 0 ? (
                  renderCustomLineChart(chartData, 'ec_plan', 'ec_real', '#6b7280', '#a855f7', [0.5, 3.0])
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground border border-dashed border-[#1e293b] rounded-xl">
                    No hay suficientes fertilizaciones registradas en este lote para graficar.
                  </div>
                )}
              </div>
            </div>

            {/* CRUCE DE SENSORES Y ANOMALÍAS */}
            <div className="bg-[#10161d] border border-[#1e293b] p-5 rounded-2xl space-y-4">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                <Thermometer className="w-4 h-4 text-orange-500" />
                Eventos Ambientales y Rangos Críticos
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Cruce de lecturas promedio diarias de sensores (carpa) correlacionadas con fases del plan.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#090d10]/40 border border-[#1e293b] p-4 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-foreground">Temperatura Máxima</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-extrabold text-foreground">26.8°C</span>
                    <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                      <AlertTriangle className="w-3 h-3" /> +1.8°C sobre plan
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground block">
                    Registrado en Carpa 3 (Semana 5 Día 1). Alarma temporal.
                  </span>
                </div>

                <div className="bg-[#090d10]/40 border border-[#1e293b] p-4 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-foreground">Déficit de Vapor Promedio</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-extrabold text-emerald-400">1.12 kPa</span>
                    <span className="text-[10px] text-emerald-400 font-bold">Óptimo Transpiración</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground block">
                    VPD se mantuvo en rango de floración estándar durante el 92% de la semana.
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* COLUMNA DERECHA: TIMELINE DE DÍAS Y TABLERO DE DESVÍOS (1/3 columnas) */}
          <div className="space-y-6">
            
            {/* TABLERO DE FILTROS ALERTA */}
            <div className="bg-[#10161d] border border-[#1e293b] p-5 rounded-2xl space-y-4">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                <Filter className="w-4 h-4 text-emerald-500" />
                Alertas y Filtros
              </h3>
              
              <div className="space-y-3">
                {/* Filtro Gravedad */}
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Gravedad</label>
                  <div className="grid grid-cols-3 gap-1 bg-[#090d10] p-1 rounded-lg border border-[#1e293b]">
                    {['todos', 'moderada', 'grave'].map((grav) => (
                      <button
                        key={grav}
                        onClick={() => setFiltroGravedad(grav)}
                        className={`text-[10px] py-1 rounded font-bold uppercase transition-all ${
                          filtroGravedad === grav 
                            ? 'bg-[#1e293b] text-foreground border border-emerald-500/20' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {grav === 'todos' ? 'Todos' : grav}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtro Tipo */}
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Origen</label>
                  <select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="w-full text-xs bg-[#090d10] border border-[#1e293b] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="todos">Todos los desvíos</option>
                    <option value="no_realizada">Tareas omitidas (No hecha)</option>
                    <option value="parametro_distinto">Parámetro excedido (pH/EC)</option>
                    <option value="extra">Labores extras fuera de plan</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TIMELINE VERTICAL DEL CICLO (Estilo Jane) */}
            <div className="bg-[#10161d] border border-[#1e293b] p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#1e293b]/50 pb-2">
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  Línea de Tiempo Real vs Plan
                </h3>
                <span className="text-[10px] text-muted-foreground font-bold">
                  Orden Cronológico
                </span>
              </div>

              {/* Contenedor del Timeline scrolleable */}
              <div className="max-h-[500px] overflow-y-auto pr-2 space-y-6 no-scrollbar relative pl-4 border-l border-[#1e293b]/70">
                {registros.slice().reverse().map((rd) => {
                  const lotObj = lote;
                  const diaCiclo = lotObj ? mockDb.calcularDiaDeCiclo(lotObj.fecha_inicio, rd.fecha) : 1;
                  const sem = Math.floor((diaCiclo - 1) / 7) + 1;
                  const dia = ((diaCiclo - 1) % 7) + 1;

                  // Buscar si este día tuvo algún desvío
                  const desviosDia = desvios.filter(d => d.fecha === rd.fecha);
                  const tieneDesvios = desviosDia.length > 0;
                  const esGrave = desviosDia.some(d => d.gravedadGeneral === 'grave');
                  const esModerado = desviosDia.some(d => d.gravedadGeneral === 'moderada');

                  return (
                    <div key={rd.id} className="relative space-y-2">
                      
                      {/* Nodo indicador en la línea vertical */}
                      <div className={`absolute -left-[22px] top-1.5 w-3 h-3 rounded-full border shadow-sm ${
                        esGrave ? 'bg-red-500 border-red-400' :
                        esModerado ? 'bg-amber-400 border-amber-300' :
                        'bg-emerald-500 border-emerald-400'
                      }`} />

                      {/* Cabecera del día */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs font-extrabold text-foreground">
                            Día {diaCiclo} de Cultivo
                          </span>
                          <span className="text-[9px] text-muted-foreground font-semibold">
                            (Sem {sem} · Dia {dia})
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-bold">
                          {rd.fecha}
                        </span>
                      </div>

                      {/* Tarjeta del día */}
                      <div className={`p-3 rounded-xl border space-y-2.5 bg-[#090d10]/40 ${
                        esGrave ? 'border-red-500/20' :
                        esModerado ? 'border-amber-500/20' :
                        'border-[#1e293b]'
                      }`}>
                        
                        {/* Listar acciones de ese día */}
                        <div className="space-y-1.5">
                          {rd.acciones?.map((ra, rIdx) => (
                            <div key={rIdx} className="flex items-start justify-between gap-4 text-xs">
                              <div className="flex items-start gap-1.5">
                                {ra.hecha ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="space-y-0.5">
                                  <span className={`font-bold text-[11px] ${ra.hecha ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                                    {ra.tipo === 'riego' || ra.tipo === 'fertilizacion' ? 'Riego / Nutrición' : ra.tipo.toUpperCase()}
                                  </span>
                                  
                                  {/* Mostrar valores si es riego */}
                                  {ra.hecha && (ra.tipo === 'riego' || ra.tipo === 'fertilizacion') && (
                                    <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                                      <span>Vol: <b>{ra.parametros_real.ml_agua}ml</b></span>
                                      <span>pH: <b>{ra.parametros_real.ph}</b></span>
                                      <span>EC: <b>{ra.parametros_real.ec}mS</b></span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Alerta de Desvío específico de la tarea */}
                              {tieneDesvios && desviosDia.some(d => d.registroAccionId === ra.id) && (
                                <span className={`text-[8px] font-extrabold uppercase px-1 rounded flex items-center gap-0.5 ${
                                  desviosDia.find(d => d.registroAccionId === ra.id)?.gravedadGeneral === 'grave'
                                    ? 'text-red-400 bg-red-500/10'
                                    : 'text-amber-400 bg-amber-500/10'
                                }`}>
                                  <AlertTriangle className="w-2.5 h-2.5" /> DESVÍO
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Detalle ampliado de desvíos en el día */}
                        {tieneDesvios && (
                          <div className="bg-black/30 p-2 rounded-lg border border-[#1e293b] space-y-1.5 text-[10px]">
                            {desviosDia.map((d, dIdx) => (
                              <div key={dIdx} className="space-y-0.5">
                                {d.tipoDesvio === 'no_realizada' ? (
                                  <span className="text-red-400 font-bold block">
                                    Omitido: {d.accionTipo.toUpperCase()} obligatorio no se realizó.
                                  </span>
                                ) : (
                                  d.desviosCampos.map((dc: any, dcIdx: number) => (
                                    <div key={dcIdx} className="flex justify-between items-center text-amber-400">
                                      <span>Desvío {dc.campo}:</span>
                                      <span className="font-extrabold">
                                        {dc.real} vs {dc.esperado} ({dc.magnitud > 0 ? `+${dc.magnitud}` : dc.magnitud})
                                      </span>
                                    </div>
                                  ))
                                )}
                                {d.notas && (
                                  <span className="text-muted-foreground block italic text-[9px] pt-1">
                                    &ldquo;{d.notas}&rdquo;
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                      </div>

                    </div>
                  );
                })}
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

// RENDER HELPER PARA GRÁFICO SVG RESPONSIVO PH / EC
function renderCustomLineChart(
  data: any[],
  keyPlan: string,
  keyReal: string,
  colorPlan: string,
  colorReal: string,
  domain: [number, number]
) {
  const width = 500;
  const height = 240;
  const padding = { top: 15, right: 15, bottom: 25, left: 35 };

  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;

  const [minVal, maxVal] = domain;
  const valRange = maxVal - minVal;

  // 1. Convertir puntos de datos a coordenadas SVG
  const planPoints: string[] = [];
  const realPoints: string[] = [];

  data.forEach((d, idx) => {
    const x = padding.left + (idx / (data.length - 1)) * usableWidth;

    if (d[keyPlan] !== null) {
      const yPlan = padding.top + usableHeight - ((d[keyPlan] - minVal) / valRange) * usableHeight;
      planPoints.push(`${x},${yPlan}`);
    }

    if (d[keyReal] !== null) {
      const yReal = padding.top + usableHeight - ((d[keyReal] - minVal) / valRange) * usableHeight;
      realPoints.push(`${x},${yReal}`);
    }
  });

  // 2. Generar líneas horizontales de cuadrícula (Grid Lines)
  const gridCount = 5;
  const gridLines: React.ReactNode[] = [];
  for (let i = 0; i < gridCount; i++) {
    const ratio = i / (gridCount - 1);
    const y = padding.top + ratio * usableHeight;
    const value = (maxVal - ratio * valRange).toFixed(1);

    gridLines.push(
      <g key={i}>
        <line
          x1={padding.left}
          y1={y}
          x2={width - padding.right}
          y2={y}
          stroke="#1e293b"
          strokeWidth="0.8"
          strokeDasharray="4,4"
        />
        <text
          x={padding.left - 8}
          y={y + 3}
          fill="#94a3b8"
          fontSize="9.5"
          fontWeight="bold"
          textAnchor="end"
        >
          {value}
        </text>
      </g>
    );
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      {/* 1. Cuadrícula */}
      {gridLines}

      {/* 2. Eje X etiquetas */}
      {data.map((d, idx) => {
        const x = padding.left + (idx / (data.length - 1)) * usableWidth;
        return (
          <text
            key={idx}
            x={x}
            y={height - 5}
            fill="#64748b"
            fontSize="9"
            fontWeight="bold"
            textAnchor="middle"
          >
            {d.fecha}
          </text>
        );
      })}

      {/* 3. Línea de Plan (Muted / Dashed) */}
      {planPoints.length > 0 && (
        <polyline
          fill="none"
          stroke={colorPlan}
          strokeWidth="1.5"
          strokeDasharray="5,5"
          points={planPoints.join(' ')}
          className="opacity-70"
        />
      )}

      {/* 4. Línea de Real (Vibrant Color) */}
      {realPoints.length > 0 && (
        <polyline
          fill="none"
          stroke={colorReal}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={realPoints.join(' ')}
        />
      )}

      {/* 5. Nodos circulares para mediciones reales y desvíos */}
      {data.map((d, idx) => {
        if (d[keyReal] === null) return null;
        
        const x = padding.left + (idx / (data.length - 1)) * usableWidth;
        const yReal = padding.top + usableHeight - ((d[keyReal] - minVal) / valRange) * usableHeight;
        
        // Detectar si este punto es un desvío importante
        const absDiff = Math.abs(d[keyReal] - d[keyPlan]);
        const esDesvio = keyReal === 'ph_real' ? absDiff >= 0.2 : absDiff >= 0.15;

        return (
          <g key={idx}>
            <circle
              cx={x}
              cy={yReal}
              r={esDesvio ? 4.5 : 3.5}
              fill={esDesvio ? '#f59e0b' : colorReal}
              stroke="#090d10"
              strokeWidth="1.5"
              className={esDesvio ? 'animate-pulse' : ''}
            />
            {esDesvio && (
              <circle
                cx={x}
                cy={yReal}
                r="7"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1"
                className="animate-ping"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
