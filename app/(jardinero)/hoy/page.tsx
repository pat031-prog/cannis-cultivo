'use client';

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/lib/context/AppContext';
import { mockDb, Lote, RegistroDiario, RegistroAccion } from '@/lib/supabase/mockDb';
import { 
  CheckCircle2, 
  Circle, 
  Droplet, 
  Thermometer, 
  Flame, 
  Camera, 
  ChevronRight, 
  Sparkles,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  AlertTriangle,
  RotateCcw,
  ClipboardList
} from 'lucide-react';

export default function ModoHoyPage() {
  const { activeRole, lotes } = useAppContext();
  
  // Lote seleccionado en la interfaz
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  
  // Fecha de hoy simulada para la app (2026-05-21)
  const fechaHoy = '2026-05-21';
  
  // Estado local para almacenar el registro del lote actual
  const [acciones, setAcciones] = useState<RegistroAccion[]>([]);
  const [registroDiario, setRegistroDiario] = useState<RegistroDiario | null>(null);
  
  // Lotes mapeados con su estado de completado e información
  const [lotesStatus, setLotesStatus] = useState<any[]>([]);

  const actualizarLotesStatus = () => {
    const list = lotes.map(l => {
      const ubi = mockDb.ubicaciones.find(u => u.id === l.ubicacion_id);
      const gen = mockDb.geneticas.find(g => g.id === l.plantilla_id || g.id === 'gen-1'); // fallback a kush
      const rd = mockDb.getRegistroDiario(l.id, fechaHoy);
      
      // Calcular día de cultivo
      const diaCiclo = mockDb.calcularDiaDeCiclo(l.fecha_inicio, fechaHoy);
      const sem = Math.floor((diaCiclo - 1) / 7) + 1;
      const dia = ((diaCiclo - 1) % 7) + 1;

      // Obtener plantilla correspondiente para contar total de tareas
      const plan = mockDb.plantillas.find(p => p.id === l.plantilla_id);
      const diaPlan = plan?.dias?.find(d => d.semana === sem && d.dia === dia);
      const tareasPlan = diaPlan?.acciones || [];
      const totalTareas = tareasPlan.length;

      // Calcular completadas
      let completadas = 0;
      if (rd && rd.acciones) {
        // Tareas del plan completadas
        completadas = rd.acciones.filter(a => a.hecha).length;
      }

      // Porcentaje
      const pct = totalTareas > 0 ? Math.min(100, Math.round((completadas / totalTareas) * 100)) : 0;

      // Fase traducción
      const faseMap = {
        propagacion: 'Propagación',
        vegetativo: 'Vegetativo',
        pre_floracion: 'Pre-Floración',
        floracion: 'Floración',
        lavado: 'Lavado final',
        secado: 'Secado',
      };
      
      const faseLabel = faseMap[diaPlan?.fase || 'vegetativo'];
      const colorFase = {
        propagacion: 'border-phase-propagacion text-phase-propagacion bg-phase-propagacion/5',
        vegetativo: 'border-phase-vegetativo text-phase-vegetativo bg-phase-vegetativo/5',
        pre_floracion: 'border-phase-prefloracion text-phase-prefloracion bg-phase-prefloracion/5',
        floracion: 'border-phase-floracion text-phase-floracion bg-phase-floracion/5',
        lavado: 'border-phase-lavado text-phase-lavado bg-phase-lavado/5',
        secado: 'border-phase-secado text-phase-secado bg-phase-secado/5',
      }[diaPlan?.fase || 'vegetativo'];

      return {
        lote: l,
        ubicacion: ubi?.posicion || 'Carpa',
        sala: ubi?.sala || 'Sala',
        genetica: gen?.nombre || 'Híbrida',
        semana: sem,
        dia: dia,
        fase: faseLabel,
        colorFase,
        completadas,
        totalTareas,
        porcentaje: pct,
        registro: rd
      };
    });

    setLotesStatus(list);
    
    // Auto seleccionar el primer lote si no hay ninguno seleccionado
    if (list.length > 0 && !selectedLote) {
      setSelectedLote(list[0].lote);
    } else if (selectedLote) {
      // Mantener actualizado el lote seleccionado
      const actualizado = list.find(item => item.lote.id === selectedLote.id);
      if (actualizado && actualizado.registro) {
        setRegistroDiario(actualizado.registro);
        setAcciones(actualizado.registro.acciones || []);
      }
    }
  };

  const cargarRegistro = (loteId: string) => {
    const rd = mockDb.getRegistroDiario(loteId, fechaHoy);
    const lot = mockDb.getLote(loteId);
    
    if (rd) {
      setRegistroDiario(rd);
      setAcciones(rd.acciones || []);
    } else if (lot) {
      // Crear registro diario vacío a partir de la plantilla si no existe
      const diaCiclo = mockDb.calcularDiaDeCiclo(lot.fecha_inicio, fechaHoy);
      const sem = Math.floor((diaCiclo - 1) / 7) + 1;
      const dia = ((diaCiclo - 1) % 7) + 1;

      const plan = mockDb.plantillas.find(p => p.id === lot.plantilla_id);
      const diaPlan = plan?.dias?.find(d => d.semana === sem && d.dia === dia);
      const accionesPlan = diaPlan?.acciones || [];

      // Mapear acciones de plantilla a acciones reales pre-cargadas
      const accionesIniciales: RegistroAccion[] = accionesPlan.map((pact, idx) => ({
        id: `ra-temp-${idx}-${Date.now()}`,
        registro_diario_id: `rd-temp-${loteId}`,
        plantilla_accion_id: pact.id,
        tipo: pact.tipo,
        parametros_real: { ...pact.parametros }, // Copiar los valores del plan
        hecha: false, // Inician sin hacer para que el jardinero las tapee
        hora: new Date().toLocaleTimeString('es-AR', { hour12: false }),
      }));

      setRegistroDiario({
        id: `rd-temp-${loteId}`,
        lote_id: loteId,
        fecha: fechaHoy,
        autor_id: 'usr-2',
        completado: false,
      });
      setAcciones(accionesIniciales);
    }
  };

  // Efecto para inicializar la lista de lotes y sus estados
  useEffect(() => {
    const t = setTimeout(() => {
      actualizarLotesStatus();
    }, 0);
    return () => clearTimeout(t);
  }, [lotes, acciones]);

  // Cargar registro diario cuando se selecciona un lote
  useEffect(() => {
    if (selectedLote) {
      const t = setTimeout(() => {
        cargarRegistro(selectedLote.id);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [selectedLote]);

  // Toggle de completar una tarea
  const toggleTarea = (index: number) => {
    const copia = [...acciones];
    copia[index].hecha = !copia[index].hecha;
    setAcciones(copia);
    guardarEnMockDb(copia);
  };

  // Modificar un parámetro real de una tarea
  const cambiarParametro = (accionIndex: number, campo: string, valor: any) => {
    const copia = [...acciones];
    copia[accionIndex].parametros_real[campo] = valor;
    // Si editan un valor, auto marcar la tarea como completada
    copia[accionIndex].hecha = true;
    setAcciones(copia);
    guardarEnMockDb(copia);
  };

  // Guardar en la base de datos local
  const guardarEnMockDb = (nuevasAcciones: RegistroAccion[]) => {
    if (!selectedLote) return;
    
    const rd = mockDb.guardarRegistroDiario(
      selectedLote.id,
      fechaHoy,
      'usr-2', // Juan el jardinero
      nuevasAcciones.map(a => ({
        plantilla_accion_id: a.plantilla_accion_id,
        tipo: a.tipo,
        parametros_real: a.parametros_real,
        hecha: a.hecha,
        hora: a.hora,
        notas: a.notas,
        foto_url: a.foto_url
      }))
    );

    setRegistroDiario(rd);
    setAcciones(rd.acciones || []);
  };

  // Simular subir una foto
  const subirFoto = (accionIndex: number) => {
    const copia = [...acciones];
    copia[accionIndex].foto_url = `https://images.unsplash.com/photo-1598902108854-10e335adac99?w=300&q=80`;
    copia[accionIndex].hecha = true;
    setAcciones(copia);
    guardarEnMockDb(copia);
    alert('Simulación: ¡Foto del espécimen capturada con éxito!');
  };

  // Encontrar estado del lote seleccionado
  const selectedStatus = lotesStatus.find(s => s.lote.id === selectedLote?.id);
  const totalLotesCompletados = lotesStatus.filter(s => s.porcentaje === 100).length;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Título de Sección */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-emerald-500" />
            Modo Hoy
          </h1>
          <p className="text-muted-foreground text-sm">
            Control de labores diarias para el Jardinero. Presioná para completar tus tareas.
          </p>
        </div>
        
        {/* Fecha simulada */}
        <div className="flex items-center gap-2 bg-[#10161d] border border-[#1e293b] rounded-lg px-3 py-1.5 text-xs text-muted-foreground self-start">
          <Calendar className="w-4 h-4 text-emerald-500" />
          <span>Jornada simulada: <b>21 de Mayo, 2026</b></span>
        </div>
      </div>

      {/* 1. SECCIÓN DE ANILLOS DE PROGRESO DE CARPAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {lotesStatus.map((status) => {
          const isSelected = selectedLote?.id === status.lote.id;
          
          // Anillo SVG parámetros
          const radius = 26;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (status.porcentaje / 100) * circumference;

          return (
            <button
              key={status.lote.id}
              onClick={() => setSelectedLote(status.lote)}
              className={`p-4 rounded-xl border transition-all text-left flex items-center justify-between group relative overflow-hidden ${
                isSelected 
                  ? 'bg-gradient-to-br from-[#111921] to-[#0c1218] border-emerald-500/40 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20' 
                  : 'bg-[#10161d] border-[#1e293b] hover:border-emerald-500/20 hover:bg-[#131b24]'
              }`}
            >
              <div className="space-y-1 z-10">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground tracking-wide">{status.ubicacion}</span>
                  <span className="text-[10px] text-muted-foreground">({status.sala})</span>
                </div>
                <h4 className="font-semibold text-base text-foreground group-hover:text-emerald-400 transition-colors">
                  {status.genetica}
                </h4>
                
                {/* Fase Badge */}
                <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full border font-bold ${status.colorFase}`}>
                  {status.fase}
                </span>

                <div className="text-[11px] text-muted-foreground pt-1.5 flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  <span>Semana {status.semana} · Día {status.dia}</span>
                </div>
              </div>

              {/* Anillo de Progreso Estilo Calorie App */}
              <div className="relative flex items-center justify-center z-10 pl-3">
                <svg className="w-16 h-16 transform -rotate-90">
                  {/* Círculo de fondo */}
                  <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    className="stroke-[#1e293b]"
                    strokeWidth="5"
                    fill="transparent"
                  />
                  {/* Círculo de progreso */}
                  <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    className="stroke-emerald-500 transition-all duration-500"
                    strokeWidth="5.5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xs font-extrabold text-foreground">{status.porcentaje}%</span>
                  <span className="text-[8px] text-muted-foreground uppercase tracking-tighter">
                    {status.completadas}/{status.totalTareas}
                  </span>
                </div>
              </div>

              {/* Efecto de fondo sutil para el seleccionado */}
              {isSelected && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl -mr-4 -mt-4 transition-all" />
              )}
            </button>
          );
        })}
      </div>

      {/* 2. AREA DE TRABAJO DEL LOTE SELECCIONADO */}
      {selectedStatus && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Listado de tareas (Checklist) - Ocupa 2/3 columnas */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Header del checklist */}
            <div className="bg-[#10161d] border border-[#1e293b] p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-500 font-bold uppercase tracking-wider">Lote Activo</span>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5">
                  {selectedStatus.ubicacion} — {selectedStatus.genetica}
                </h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <span>Código de Lote: <b>{selectedStatus.lote.codigo}</b></span>
                </p>
              </div>

              {selectedStatus.porcentaje === 100 ? (
                <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-bold animate-pulse-slow">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Cerrado para hoy</span>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground bg-[#090d10] border border-[#1e293b] px-3 py-1.5 rounded-lg">
                  Progreso: <b>{selectedStatus.completadas} de {selectedStatus.totalTareas} tareas</b>
                </div>
              )}
            </div>

            {/* LISTA DE ACCIONES/TAREAS DIARIAS */}
            <div className="space-y-3">
              {acciones.map((acc, index) => {
                // Obtener datos originales de la plantilla
                const lote = selectedLote;
                const plan = mockDb.plantillas.find(p => p.id === lote?.plantilla_id);
                const diaCiclo = lote ? mockDb.calcularDiaDeCiclo(lote.fecha_inicio, fechaHoy) : 1;
                const sem = Math.floor((diaCiclo - 1) / 7) + 1;
                const dia = ((diaCiclo - 1) % 7) + 1;
                const diaPlan = plan?.dias?.find(d => d.semana === sem && d.dia === dia);
                const pact = diaPlan?.acciones?.find(pa => pa.id === acc.plantilla_accion_id);

                const esObligatoria = pact?.obligatoria ?? true;

                // Chequear si hay desviaciones en caliente
                const phPlan = pact?.parametros?.ph_objetivo;
                const phReal = acc.parametros_real.ph;
                const phDesviado = phPlan !== undefined && phReal !== undefined && Math.abs(phReal - phPlan) >= 0.2;

                const ecPlan = pact?.parametros?.ec_objetivo;
                const ecReal = acc.parametros_real.ec;
                const ecDesviado = ecPlan !== undefined && ecReal !== undefined && Math.abs(ecReal - ecPlan) >= 0.15;

                const aguaPlan = pact?.parametros?.ml_agua;
                const aguaReal = acc.parametros_real.ml_agua;
                const aguaDesviado = aguaPlan !== undefined && aguaReal !== undefined && Math.abs(aguaReal - aguaPlan) >= 100;

                const hayDesvios = phDesviado || ecDesviado || aguaDesviado;

                return (
                  <div
                    key={acc.id}
                    className={`border rounded-xl transition-all ${
                      acc.hecha 
                        ? 'bg-[#10161d]/60 border-[#1e293b]' 
                        : 'bg-[#10161d] border-[#1e293b] hover:border-[#10b981]/20'
                    } ${hayDesvios && acc.hecha ? 'border-amber-500/30 bg-amber-500/[0.02]' : ''}`}
                  >
                    
                    {/* Fila principal */}
                    <div className="p-4 flex items-start gap-4">
                      
                      {/* Check de Tarea */}
                      <button
                        onClick={() => toggleTarea(index)}
                        className="mt-0.5 transition-transform hover:scale-110 focus:outline-none"
                      >
                        {acc.hecha ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-500/10" />
                        ) : (
                          <Circle className="w-6 h-6 text-muted-foreground hover:text-emerald-500" />
                        )}
                      </button>

                      {/* Info de Tarea */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-bold text-sm ${acc.hecha ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {acc.tipo === 'riego' ? 'Riego con Agua Base' : 
                             acc.tipo === 'fertilizacion' ? 'Riego con Nutrientes (Fertilización)' : 
                             acc.tipo === 'medicion' ? 'Monitoreo Ambiental / Sensores' : 
                             acc.tipo.charAt(0).toUpperCase() + acc.tipo.slice(1)}
                          </h3>
                          {esObligatoria && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 font-bold uppercase">
                              Obligatoria
                            </span>
                          )}
                        </div>

                        {/* Descripción de lo planificado */}
                        <p className="text-xs text-muted-foreground">
                          {acc.tipo === 'riego' && pact && `Planificado: Regar con ${pact.parametros.ml_agua}ml · pH ${pact.parametros.ph_objetivo} · EC ${pact.parametros.ec_objetivo}`}
                          {acc.tipo === 'fertilizacion' && pact && `Planificado: Regar con ${pact.parametros.ml_agua}ml · ${pact.parametros.fertilizante} (${pact.parametros.dosis_ml_l} ml/L) · pH ${pact.parametros.ph_objetivo} · EC ${pact.parametros.ec_objetivo}`}
                          {acc.tipo === 'medicion' && pact && `Monitorear el fotoperíodo y rellenar parámetros ambientales.`}
                          {acc.tipo === 'poda' && pact && `Realizar poda apical según las instrucciones del Director.`}
                          {acc.tipo === 'defoliacion' && pact && `Defoliar tercios inferiores para promover aireación.`}
                        </p>

                        {/* FOTOS CARGADAS */}
                        {acc.foto_url && (
                          <div className="pt-2">
                            <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-[#1e293b] group/img">
                              <img src={acc.foto_url} alt="Foto espécimen" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                <span className="text-[9px] text-white font-bold">Subida</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Botón de Cámara */}
                      <button
                        onClick={() => subirFoto(index)}
                        className={`p-2 rounded-lg border border-[#1e293b] hover:bg-[#1a232d] hover:border-emerald-500/30 transition-all text-muted-foreground hover:text-emerald-500`}
                        title="Subir foto de planta"
                      >
                        <Camera className="w-4 h-4" />
                      </button>

                    </div>

                    {/* CONTROLADORES DE PARÁMETROS REALES (SE EXPANDEN AL TAPEAR) */}
                    {pact && (pact.tipo === 'riego' || pact.tipo === 'fertilizacion') && (
                      <div className="border-t border-[#1e293b]/50 px-4 py-3 bg-[#0a0f14] rounded-b-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
                        
                        {/* 1. Control Riego ml */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex justify-between">
                            <span>Agua por planta</span>
                            {aguaDesviado && (
                              <span className="text-amber-500 flex items-center gap-0.5">
                                <AlertTriangle className="w-3 h-3" /> Desvío
                              </span>
                            )}
                          </label>
                          <div className="flex items-center gap-1 bg-[#10161d] border border-[#1e293b] rounded-lg p-1.5">
                            <button
                              onClick={() => cambiarParametro(index, 'ml_agua', Math.max(0, (acc.parametros_real.ml_agua || 500) - 50))}
                              className="w-6 h-6 rounded bg-[#1e293b] hover:bg-emerald-500/20 text-foreground text-xs font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={acc.parametros_real.ml_agua || 0}
                              onChange={(e) => cambiarParametro(index, 'ml_agua', Number(e.target.value))}
                              className={`w-full text-center bg-transparent border-0 text-sm font-bold focus:outline-none focus:ring-0 p-0 text-foreground ${
                                aguaDesviado ? 'text-amber-400 font-extrabold' : ''
                              }`}
                            />
                            <button
                              onClick={() => cambiarParametro(index, 'ml_agua', (acc.parametros_real.ml_agua || 500) + 50)}
                              className="w-6 h-6 rounded bg-[#1e293b] hover:bg-emerald-500/20 text-foreground text-xs font-bold"
                            >
                              +
                            </button>
                            <span className="text-[10px] text-muted-foreground pr-1">ml</span>
                          </div>
                        </div>

                        {/* 2. Control pH */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex justify-between">
                            <span>Nivel pH real</span>
                            {phDesviado && (
                              <span className="text-red-400 flex items-center gap-0.5">
                                <AlertTriangle className="w-3 h-3 animate-bounce" /> Anormal
                              </span>
                            )}
                          </label>
                          <div className="flex items-center gap-1 bg-[#10161d] border border-[#1e293b] rounded-lg p-1.5">
                            <button
                              onClick={() => cambiarParametro(index, 'ph', Number(Math.max(4.0, (acc.parametros_real.ph || 5.8) - 0.1).toFixed(1)))}
                              className="w-6 h-6 rounded bg-[#1e293b] hover:bg-emerald-500/20 text-foreground text-xs font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              step="0.1"
                              value={acc.parametros_real.ph || 0}
                              onChange={(e) => cambiarParametro(index, 'ph', Number(e.target.value))}
                              className={`w-full text-center bg-transparent border-0 text-sm font-bold focus:outline-none focus:ring-0 p-0 text-foreground ${
                                phDesviado ? 'text-red-400 font-extrabold' : ''
                              }`}
                            />
                            <button
                              onClick={() => cambiarParametro(index, 'ph', Number(Math.min(8.0, (acc.parametros_real.ph || 5.8) + 0.1).toFixed(1)))}
                              className="w-6 h-6 rounded bg-[#1e293b] hover:bg-emerald-500/20 text-foreground text-xs font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* 3. Control EC */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex justify-between">
                            <span>Conductividad (EC)</span>
                            {ecDesviado && (
                              <span className="text-amber-500 flex items-center gap-0.5">
                                <AlertTriangle className="w-3 h-3" /> Desvío
                              </span>
                            )}
                          </label>
                          <div className="flex items-center gap-1 bg-[#10161d] border border-[#1e293b] rounded-lg p-1.5">
                            <button
                              onClick={() => cambiarParametro(index, 'ec', Number(Math.max(0.1, (acc.parametros_real.ec || 1.8) - 0.1).toFixed(2)))}
                              className="w-6 h-6 rounded bg-[#1e293b] hover:bg-emerald-500/20 text-foreground text-xs font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              step="0.1"
                              value={acc.parametros_real.ec || 0}
                              onChange={(e) => cambiarParametro(index, 'ec', Number(e.target.value))}
                              className={`w-full text-center bg-transparent border-0 text-sm font-bold focus:outline-none focus:ring-0 p-0 text-foreground ${
                                ecDesviado ? 'text-amber-400 font-extrabold' : ''
                              }`}
                            />
                            <button
                              onClick={() => cambiarParametro(index, 'ec', Number(Math.min(4.0, (acc.parametros_real.ec || 1.8) + 0.1).toFixed(2)))}
                              className="w-6 h-6 rounded bg-[#1e293b] hover:bg-emerald-500/20 text-foreground text-xs font-bold"
                            >
                              +
                            </button>
                            <span className="text-[10px] text-muted-foreground pr-1">mS</span>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* Medición Ambiental Parameters */}
                    {pact && pact.tipo === 'medicion' && (
                      <div className="border-t border-[#1e293b]/50 px-4 py-3 bg-[#0a0f14] rounded-b-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Temperatura Real (°C)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={acc.parametros_real.temperatura || 24}
                            onChange={(e) => cambiarParametro(index, 'temperatura', Number(e.target.value))}
                            className="w-full bg-[#10161d] border border-[#1e293b] text-sm font-bold text-foreground rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Humedad Real (%)</label>
                          <input
                            type="number"
                            value={acc.parametros_real.humedad || 60}
                            onChange={(e) => cambiarParametro(index, 'humedad', Number(e.target.value))}
                            className="w-full bg-[#10161d] border border-[#1e293b] text-sm font-bold text-foreground rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
            
          </div>

          {/* TARJETA COLUMNA DERECHA - Resumen de Estado y Desvíos Rápidos */}
          <div className="space-y-6">
            
            {/* 1. CELEBRACIÓN DE DÍA COMPLETADO (Estilo Fit App) */}
            {selectedStatus.porcentaje === 100 ? (
              <div className="bg-gradient-to-br from-[#0c2e1f] to-[#041a12] border border-emerald-500/40 p-6 rounded-2xl text-center space-y-4 shadow-xl shadow-emerald-950/10">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg animate-bounce">
                  <Sparkles className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-lg text-foreground bg-gradient-to-r from-emerald-300 to-teal-100 bg-clip-text text-transparent">
                    ¡Carpa Cerrada!
                  </h3>
                  <p className="text-xs text-emerald-400/80 max-w-[240px] mx-auto leading-normal">
                    Completaste el 100% de las tareas obligatorias en plan para <b>{selectedStatus.ubicacion}</b>.
                  </p>
                </div>
                
                {/* Visualizador de Hábitos */}
                <div className="bg-black/30 p-3 rounded-lg border border-emerald-500/10 text-left space-y-1">
                  <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">
                    Estado de la Jornada General
                  </div>
                  <div className="text-xs text-foreground font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Lotes completados hoy: {totalLotesCompletados} de {lotesStatus.length}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#10161d] border border-[#1e293b] p-6 rounded-2xl text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center mx-auto text-emerald-500">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-foreground">Tareas Pendientes</h3>
                  <p className="text-xs text-muted-foreground max-w-[200px] mx-auto leading-normal">
                    Aún restan {selectedStatus.totalTareas - selectedStatus.completadas} tareas obligatorias para completar la jornada.
                  </p>
                </div>
                <div className="w-full bg-[#1e293b] rounded-full h-1.5">
                  <div 
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${selectedStatus.porcentaje}%` }} 
                  />
                </div>
              </div>
            )}

            {/* 2. PRECIOS FÍSICOS ASOCIADOS EN LA CARPA */}
            <div className="bg-[#10161d] border border-[#1e293b] p-4 rounded-xl space-y-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 border-b border-[#1e293b] pb-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                Plantas & Precintos ({mockDb.especimenes.filter(e => e.lote_id === selectedLote?.id).length} especímenes)
              </h3>
              
              {/* Listado de precintos de esta carpa */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {mockDb.precintos
                  .filter(p => mockDb.especimenes.find(e => e.id === p.especimen_id && e.lote_id === selectedLote?.id))
                  .map(p => (
                    <div 
                      key={p.id} 
                      className="bg-[#090d10] border border-[#1e293b]/70 p-2 rounded-lg flex items-center justify-between text-xs hover:border-[#10b981]/20 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        {/* Indicador de Color Precinto */}
                        <div className={`w-3 h-3 rounded-full shadow-inner ${
                          p.color === 'morado' ? 'bg-purple-600' :
                          p.color === 'amarillo' ? 'bg-amber-400' :
                          p.color === 'verde' ? 'bg-green-500' : 'bg-slate-300'
                        }`} />
                        <span className="font-bold text-foreground tracking-wider">{p.codigo_completo}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase bg-[#10161d] px-2 py-0.5 rounded font-bold">
                        {p.estado === 'activo' ? 'viva' : p.estado}
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* 3. SIMULAR ACCIÓN EXTRA FUERA DE PLAN */}
            <div className="bg-[#10161d] border border-[#1e293b] p-4 rounded-xl space-y-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Registrar Acción Extra
              </h3>
              <p className="text-xs text-muted-foreground leading-normal">
                ¿Realizaste alguna labor no contemplada en la plantilla de hoy? Registrala para dejar constancia agronómica.
              </p>
              
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => {
                    const extraType = prompt("Ingresa el tipo de acción extra (ej: poda, defoliacion, fumigacion, lavado):");
                    if (extraType) {
                      const notes = prompt("Ingresa notas u observaciones de la acción:");
                      const nuevasAcciones = [...acciones, {
                        id: `ra-extra-${Date.now()}`,
                        registro_diario_id: registroDiario?.id || '',
                        plantilla_accion_id: null, // indica acción extra
                        tipo: extraType.toLowerCase(),
                        parametros_real: {},
                        hecha: true,
                        hora: new Date().toLocaleTimeString('es-AR', { hour12: false }),
                        notas: notes || undefined
                      }];
                      setAcciones(nuevasAcciones);
                      guardarEnMockDb(nuevasAcciones);
                      alert('¡Acción extra registrada con éxito! Aparecerá en el panel de desvíos del Director.');
                    }
                  }}
                  className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Agregar Labor Extra</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
