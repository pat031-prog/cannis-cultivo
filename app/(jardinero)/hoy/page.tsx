'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/lib/context/AppContext';
import { mockDb, Lote, RegistroDiario, RegistroAccion } from '@/lib/supabase/mockDb';
import {
  CheckCircle2,
  Circle,
  Droplet,
  Thermometer,
  Camera,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Calendar,
  Layers,
  AlertTriangle,
  ClipboardList,
  Scissors,
  Sprout,
  Plus,
} from 'lucide-react';

// ─── helpers ──────────────────────────────────────────────────────────────────

const TASK_LABELS: Record<string, string> = {
  riego: 'Riego con Agua Base',
  fertilizacion: 'Riego con Nutrientes (Fertilización)',
  medicion: 'Monitoreo Ambiental / Sensores',
  poda: 'Poda apical según indicaciones',
  defoliacion: 'Defoliación de tercios inferiores',
};

const TASK_ICON: Record<string, React.ReactNode> = {
  riego: <Droplet className="w-4 h-4" />,
  fertilizacion: <Sprout className="w-4 h-4" />,
  medicion: <Thermometer className="w-4 h-4" />,
  poda: <Scissors className="w-4 h-4" />,
  defoliacion: <Scissors className="w-4 h-4" />,
  camera: <Camera className="w-4 h-4" />,
};

const TASK_BORDER: Record<string, string> = {
  riego: 'border-l-[#849d85]',
  fertilizacion: 'border-l-[#849d85]',
  medicion: 'border-l-[#849d85]',
  poda: 'border-l-[#849d85]',
  defoliacion: 'border-l-[#849d85]',
};

const TASK_ICON_BG: Record<string, string> = {
  riego: 'bg-[#849d85]/10 text-emerald-400',
  fertilizacion: 'bg-[#849d85]/10 text-[#849d85]',
  medicion: 'bg-[#849d85]/10 text-[#849d85]',
  poda: 'bg-[#849d85]/10 text-[#849d85]',
  defoliacion: 'bg-[#849d85]/10 text-[#849d85]',
};

// ─── Stepper button ───────────────────────────────────────────────────────────

function StepBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-2xl bg-[#3a3938] text-[#e0e0e0] font-bold text-base flex items-center justify-center transition-colors hover:bg-[#849d85] hover:text-[#2a2928]"
    >
      {children}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ModoHoyPage() {
  const { lotes } = useAppContext();

  const fechaHoy = '2026-05-21';

  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const [acciones, setAcciones] = useState<RegistroAccion[]>([]);
  const [registroDiario, setRegistroDiario] = useState<RegistroDiario | null>(null);
  const [lotesStatus, setLotesStatus] = useState<any[]>([]);

  // Expandable param rows
  const [expandedTask, setExpandedTask] = useState<number | null>(null);

  // Acción extra inline form
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [extraTipo, setExtraTipo] = useState('poda');
  const [extraNotas, setExtraNotas] = useState('');
  const [successBanner, setSuccessBanner] = useState(false);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Photo success banner
  const [photoSuccess, setPhotoSuccess] = useState(false);
  const photoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Celebration check spin: after 100% spin stops via CSS class toggle
  const [celebSpinDone, setCelebSpinDone] = useState(false);

  // ── data loaders ────────────────────────────────────────────────────────────

  const actualizarLotesStatus = () => {
    const list = lotes.map((l) => {
      const ubi = mockDb.ubicaciones.find((u) => u.id === l.ubicacion_id);
      const gen = mockDb.geneticas.find(
        (g) => g.id === l.plantilla_id || g.id === 'gen-1',
      );
      const rd = mockDb.getRegistroDiario(l.id, fechaHoy);

      const diaCiclo = mockDb.calcularDiaDeCiclo(l.fecha_inicio, fechaHoy);
      const sem = Math.floor((diaCiclo - 1) / 7) + 1;
      const dia = ((diaCiclo - 1) % 7) + 1;

      const plan = mockDb.plantillas.find((p) => p.id === l.plantilla_id);
      const diaPlan = plan?.dias?.find((d) => d.semana === sem && d.dia === dia);
      const tareasPlan = diaPlan?.acciones || [];
      const totalTareas = tareasPlan.length;

      let completadas = 0;
      if (rd && rd.acciones) {
        completadas = rd.acciones.filter((a) => a.hecha).length;
      }

      const pct =
        totalTareas > 0
          ? Math.min(100, Math.round((completadas / totalTareas) * 100))
          : 0;

      const faseMap: Record<string, string> = {
        propagacion: 'Propagación',
        vegetativo: 'Vegetativo',
        pre_floracion: 'Pre-Floración',
        floracion: 'Floración',
        lavado: 'Lavado final',
        secado: 'Secado',
      };

      const faseKey = diaPlan?.fase || 'vegetativo';
      const faseLabel = faseMap[faseKey] ?? faseKey;
      const colorFaseMap: Record<string, string> = {
        propagacion:
          'border-phase-propagacion text-phase-propagacion bg-phase-propagacion/5',
        vegetativo:
          'border-phase-vegetativo text-phase-vegetativo bg-phase-vegetativo/5',
        pre_floracion:
          'border-phase-prefloracion text-phase-prefloracion bg-phase-prefloracion/5',
        floracion:
          'border-phase-floracion text-phase-floracion bg-phase-floracion/5',
        lavado: 'border-phase-lavado text-phase-lavado bg-phase-lavado/5',
        secado: 'border-phase-secado text-phase-secado bg-phase-secado/5',
      };
      const colorFase =
        colorFaseMap[faseKey] ??
        'border-phase-vegetativo text-phase-vegetativo bg-phase-vegetativo/5';

      return {
        lote: l,
        ubicacion: ubi?.posicion ?? 'Carpa',
        sala: ubi?.sala ?? 'Sala',
        genetica: gen?.nombre ?? 'Híbrida',
        semana: sem,
        dia,
        fase: faseLabel,
        colorFase,
        completadas,
        totalTareas,
        porcentaje: pct,
        registro: rd,
      };
    });

    setLotesStatus(list);

    if (list.length > 0 && !selectedLote) {
      setSelectedLote(list[0].lote);
    } else if (selectedLote) {
      const actualizado = list.find(
        (item) => item.lote.id === selectedLote.id,
      );
      if (actualizado && actualizado.registro) {
        setRegistroDiario(actualizado.registro);
        setAcciones(actualizado.registro.acciones ?? []);
      }
    }
  };

  const cargarRegistro = (loteId: string) => {
    const rd = mockDb.getRegistroDiario(loteId, fechaHoy);
    const lot = mockDb.getLote(loteId);

    if (rd) {
      setRegistroDiario(rd);
      setAcciones(rd.acciones ?? []);
    } else if (lot) {
      const diaCiclo = mockDb.calcularDiaDeCiclo(lot.fecha_inicio, fechaHoy);
      const sem = Math.floor((diaCiclo - 1) / 7) + 1;
      const dia = ((diaCiclo - 1) % 7) + 1;

      const plan = mockDb.plantillas.find((p) => p.id === lot.plantilla_id);
      const diaPlan = plan?.dias?.find((d) => d.semana === sem && d.dia === dia);
      const accionesPlan = diaPlan?.acciones ?? [];

      const accionesIniciales: RegistroAccion[] = accionesPlan.map(
        (pact, idx) => ({
          id: `ra-temp-${idx}-${Date.now()}`,
          registro_diario_id: `rd-temp-${loteId}`,
          plantilla_accion_id: pact.id,
          tipo: pact.tipo,
          parametros_real: { ...pact.parametros },
          hecha: false,
          hora: new Date().toLocaleTimeString('es-AR', { hour12: false }),
        }),
      );

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

  // ── effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const t = setTimeout(() => actualizarLotesStatus(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotes, acciones]);

  useEffect(() => {
    if (selectedLote) {
      const t = setTimeout(() => cargarRegistro(selectedLote.id), 0);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLote]);

  // Reset celebSpinDone when lote changes
  useEffect(() => {
    setCelebSpinDone(false);
    const t = setTimeout(() => setCelebSpinDone(true), 1200);
    return () => clearTimeout(t);
  }, [selectedLote]);

  // ── actions ─────────────────────────────────────────────────────────────────

  const toggleTarea = (index: number) => {
    const copia = [...acciones];
    copia[index].hecha = !copia[index].hecha;
    setAcciones(copia);
    guardarEnMockDb(copia);
  };

  const cambiarParametro = (
    accionIndex: number,
    campo: string,
    valor: any,
  ) => {
    const copia = [...acciones];
    copia[accionIndex].parametros_real[campo] = valor;
    copia[accionIndex].hecha = true;
    setAcciones(copia);
    guardarEnMockDb(copia);
  };

  const guardarEnMockDb = (nuevasAcciones: RegistroAccion[]) => {
    if (!selectedLote) return;
    const rd = mockDb.guardarRegistroDiario(
      selectedLote.id,
      fechaHoy,
      'usr-2',
      nuevasAcciones.map((a) => ({
        plantilla_accion_id: a.plantilla_accion_id,
        tipo: a.tipo,
        parametros_real: a.parametros_real,
        hecha: a.hecha,
        hora: a.hora,
        notas: a.notas,
        foto_url: a.foto_url,
      })),
    );
    setRegistroDiario(rd);
    setAcciones(rd.acciones ?? []);
  };

  const subirFoto = (accionIndex: number) => {
    const copia = [...acciones];
    copia[accionIndex].foto_url =
      'https://images.unsplash.com/photo-1598902108854-10e335adac99?w=300&q=80';
    copia[accionIndex].hecha = true;
    setAcciones(copia);
    guardarEnMockDb(copia);

    // show inline success banner
    if (photoTimerRef.current) clearTimeout(photoTimerRef.current);
    setPhotoSuccess(true);
    photoTimerRef.current = setTimeout(() => setPhotoSuccess(false), 3000);
  };

  const registrarAccionExtra = () => {
    if (!extraTipo) return;
    const nuevasAcciones: RegistroAccion[] = [
      ...acciones,
      {
        id: `ra-extra-${Date.now()}`,
        registro_diario_id: registroDiario?.id ?? '',
        plantilla_accion_id: null,
        tipo: extraTipo,
        parametros_real: {},
        hecha: true,
        hora: new Date().toLocaleTimeString('es-AR', { hour12: false }),
        notas: extraNotas || undefined,
      },
    ];
    setAcciones(nuevasAcciones);
    guardarEnMockDb(nuevasAcciones);

    // Reset form
    setExtraTipo('poda');
    setExtraNotas('');
    setShowExtraForm(false);

    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    setSuccessBanner(true);
    bannerTimerRef.current = setTimeout(() => setSuccessBanner(false), 3000);
  };

  // ── derived ──────────────────────────────────────────────────────────────────

  const selectedStatus = lotesStatus.find(
    (s) => s.lote.id === selectedLote?.id,
  );
  const totalLotesCompletados = lotesStatus.filter(
    (s) => s.porcentaje === 100,
  ).length;

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[#849d85]" />
            Modo Hoy
          </h1>
          <p className="text-muted-foreground text-sm">
            Control de labores diarias para el Jardinero. Presioná para
            completar tus tareas.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#2a2928] border border-[#3a3938] rounded-2xl px-3 py-1.5 text-xs text-muted-foreground self-start">
          <Calendar className="w-4 h-4 text-[#849d85]" />
          <span>
            Jornada simulada: <b>21 de Mayo, 2026</b>
          </span>
        </div>
      </div>

      {/* ── 1. CARPA CARDS — vertical, horizontally scrollable on mobile ── */}
      <div className="overflow-x-auto flex gap-4 pb-2 snap-x snap-mandatory md:overflow-visible md:grid md:grid-cols-3">
        {lotesStatus.map((status) => {
          const isSelected = selectedLote?.id === status.lote.id;

          const radius = 40;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset =
            circumference - (status.porcentaje / 100) * circumference;

          return (
            <button
              key={status.lote.id}
              onClick={() => {
                setSelectedLote(status.lote);
                setExpandedTask(null);
              }}
              className={`snap-center min-w-[200px] md:min-w-0 min-h-[160px] p-4 rounded-3xl border transition-all text-left flex flex-col items-center gap-3 relative overflow-hidden ${
                isSelected
                  ? 'bg-[#2a2928] border-[#849d85] shadow-none'
                  : 'bg-[#2a2928] border-[#3a3938] hover:border-[#849d85]/50'
              }`}
            >
              {/* Progress ring — centred, 80×80 */}
              <div className="relative flex items-center justify-center">
                <svg
                  viewBox="0 0 100 100"
                  width="100"
                  height="100"
                  className="transform -rotate-90"
                >
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    stroke="#1e293b"
                    strokeWidth="7"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    stroke="#10b981"
                    strokeWidth="7"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                </svg>
                {/* Inner text */}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-serif text-[#e0e0e0] font-medium tracking-tight">
                    {status.porcentaje}%
                  </span>
                  <span className="text-[9px] text-muted-foreground leading-tight">
                    {status.completadas}/{status.totalTareas}
                  </span>
                </div>
              </div>

              {/* Meta */}
              <div className="text-center space-y-1 z-10 w-full">
                <div className="font-bold text-sm text-foreground leading-tight">
                  {status.genetica}
                </div>
                <span
                  className={`inline-block text-[9px] px-2 py-0.5 rounded-full border font-bold ${status.colorFase}`}
                >
                  {status.fase}
                </span>
                <div className="text-[11px] text-muted-foreground flex items-center justify-center gap-1 pt-0.5">
                  <Layers className="w-3 h-3" />
                  <span>
                    Semana {status.semana}·Día {status.dia}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {status.ubicacion}
                </div>
              </div>

              {/* {isSelected && null} */}
            </button>
          );
        })}
      </div>

      {/* ── 2. WORK AREA ── */}
      {selectedStatus && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* RIGHT column: status + precintos — appears first on mobile */}
          <div className="order-first lg:order-last space-y-6">

            {/* Celebration / progress card */}
            {selectedStatus.porcentaje === 100 ? (
              <div className="flex flex-col items-center justify-center bg-[#2a2928] border border-[#3a3938] p-8 rounded-3xl text-center space-y-4 shadow-none min-h-[180px] animate-in fade-in duration-1000">
                <CheckCircle2 className="w-12 h-12 text-[#849d85] mb-2" strokeWidth={1.5} />
                <h3 className="font-serif text-3xl text-[#e0e0e0]">
                  Día completado
                </h3>
                <p className="text-sm text-[#e0e0e0]/70 font-sans">
                  Todas las tareas en {selectedStatus.ubicacion} están listas.
                </p>
              </div>
            ) : (
              <div className="bg-[#2a2928] border border-[#3a3938] p-6 rounded-2xl text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#849d85]/5 border border-[#849d85]/10 flex items-center justify-center mx-auto text-[#849d85]">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-foreground">
                    Tareas Pendientes
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-[200px] mx-auto leading-normal">
                    Restan{' '}
                    {selectedStatus.totalTareas - selectedStatus.completadas}{' '}
                    tareas para completar la jornada.
                  </p>
                </div>
                <div className="w-full bg-[#3a3938] rounded-full h-1.5">
                  <div
                    className="bg-[#849d85] h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${selectedStatus.porcentaje}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedStatus.completadas} / {selectedStatus.totalTareas}{' '}
                  hechas
                </p>
              </div>
            )}

            {/* Precintos */}
            <div className="bg-[#2a2928] border border-[#3a3938] p-4 rounded-3xl space-y-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 border-b border-[#3a3938] pb-2">
                <Layers className="w-4 h-4 text-[#849d85]" />
                Plantas &amp; Precintos (
                {
                  mockDb.especimenes.filter(
                    (e) => e.lote_id === selectedLote?.id,
                  ).length
                }{' '}
                especímenes)
              </h3>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {mockDb.precintos
                  .filter((p) =>
                    mockDb.especimenes.find(
                      (e) =>
                        e.id === p.especimen_id &&
                        e.lote_id === selectedLote?.id,
                    ),
                  )
                  .map((p) => (
                    <div
                      key={p.id}
                      className="bg-[#1a1918] border border-[#3a3938]/70 p-2 rounded-2xl flex items-center justify-between text-xs hover:border-[#10b981]/20 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full shadow-inner ${
                            p.color === 'morado'
                              ? 'bg-purple-600'
                              : p.color === 'amarillo'
                                ? 'bg-amber-400'
                                : p.color === 'verde'
                                  ? 'bg-green-500'
                                  : 'bg-slate-300'
                          }`}
                        />
                        <span className="font-bold text-foreground tracking-wider">
                          {p.codigo_completo}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase bg-[#2a2928] px-2 py-0.5 rounded font-bold">
                        {p.estado === 'activo' ? 'viva' : p.estado}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Extra action card */}
            <div className="bg-[#2a2928] border border-[#3a3938] p-4 rounded-3xl space-y-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#849d85]" />
                Registrar Acción Extra
              </h3>
              <p className="text-xs text-muted-foreground leading-normal">
                ¿Realizaste alguna labor no contemplada en el plan de hoy?
                Registrala aquí.
              </p>

              {/* Success banner */}
              {successBanner && (
                <div className="flex items-center gap-2 bg-[#849d85]/10 text-emerald-400 border border-[#849d85]/30 rounded-2xl px-3 py-2 text-xs font-semibold animate-pulse">
                  <CheckCircle2 className="w-4 h-4" />
                  ¡Acción extra registrada con éxito!
                </div>
              )}

              {!showExtraForm ? (
                <button
                  type="button"
                  onClick={() => setShowExtraForm(true)}
                  className="w-full min-h-[44px] py-2 bg-[#849d85]/10 hover:bg-[#849d85]/20 text-emerald-400 border border-[#849d85]/20 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Labor Extra
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Tipo de acción
                    </label>
                    <select
                      value={extraTipo}
                      onChange={(e) => setExtraTipo(e.target.value)}
                      className="w-full mt-1 bg-[#1a1918] border border-[#3a3938] text-sm text-foreground rounded-2xl px-3 py-2 focus:outline-none focus:border-[#849d85] min-h-[44px]"
                    >
                      <option value="poda">Poda</option>
                      <option value="defoliacion">Defoliación</option>
                      <option value="fumigacion">Fumigación</option>
                      <option value="lavado">Lavado</option>
                      <option value="trasplante">Trasplante</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Notas / Observaciones
                    </label>
                    <textarea
                      value={extraNotas}
                      onChange={(e) => setExtraNotas(e.target.value)}
                      rows={3}
                      placeholder="Describe la acción realizada..."
                      className="w-full mt-1 bg-[#1a1918] border border-[#3a3938] text-sm text-foreground rounded-2xl px-3 py-2 focus:outline-none focus:border-[#849d85] resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={registrarAccionExtra}
                      className="flex-1 min-h-[44px] bg-[#849d85]/20 hover:bg-[#849d85]/30 text-emerald-400 border border-[#849d85]/30 rounded-2xl text-xs font-bold transition-all"
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowExtraForm(false);
                        setExtraNotas('');
                      }}
                      className="flex-1 min-h-[44px] bg-[#1a1918] hover:bg-[#1a232d] text-muted-foreground border border-[#3a3938] rounded-2xl text-xs font-bold transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* LEFT column: checklist — spans 2/3 on desktop */}
          <div className="lg:col-span-2 space-y-4 order-last lg:order-first">

            {/* Checklist header */}
            <div className="bg-[#2a2928] border border-[#3a3938] p-4 rounded-3xl flex items-center justify-between">
              <div>
                <span className="text-xs text-[#849d85] font-bold uppercase tracking-wider">
                  Lote Activo
                </span>
                <h2 className="text-lg font-bold text-foreground">
                  {selectedStatus.ubicacion} — {selectedStatus.genetica}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Código: <b>{selectedStatus.lote.codigo}</b>
                </p>
              </div>
              {selectedStatus.porcentaje === 100 ? (
                <div className="flex items-center gap-1.5 bg-[#849d85]/10 text-emerald-400 border border-[#849d85]/30 px-3 py-1.5 rounded-2xl text-xs font-bold">
                  <Sparkles className="w-4 h-4" />
                  Cerrado para hoy
                </div>
              ) : (
                <div className="text-xs text-muted-foreground bg-[#1a1918] border border-[#3a3938] px-3 py-1.5 rounded-2xl">
                  Progreso:{' '}
                  <b>
                    {selectedStatus.completadas} de {selectedStatus.totalTareas}
                  </b>
                </div>
              )}
            </div>

            {/* Photo success banner */}
            {photoSuccess && (
              <div className="flex items-center gap-2 bg-[#849d85]/10 text-emerald-400 border border-[#849d85]/30 rounded-3xl px-4 py-2.5 text-xs font-semibold">
                <Camera className="w-4 h-4" />
                Foto del espécimen capturada con éxito.
              </div>
            )}

            {/* Task rows */}
            <div className="space-y-3">
              {acciones.map((acc, index) => {
                const lote = selectedLote;
                const plan = mockDb.plantillas.find(
                  (p) => p.id === lote?.plantilla_id,
                );
                const diaCiclo = lote
                  ? mockDb.calcularDiaDeCiclo(lote.fecha_inicio, fechaHoy)
                  : 1;
                const sem = Math.floor((diaCiclo - 1) / 7) + 1;
                const dia = ((diaCiclo - 1) % 7) + 1;
                const diaPlan = plan?.dias?.find(
                  (d) => d.semana === sem && d.dia === dia,
                );
                const pact = diaPlan?.acciones?.find(
                  (pa) => pa.id === acc.plantilla_accion_id,
                );

                const esObligatoria = pact?.obligatoria ?? true;

                const phPlan = pact?.parametros?.ph_objetivo;
                const phReal = acc.parametros_real.ph;
                const phDesviado =
                  phPlan !== undefined &&
                  phReal !== undefined &&
                  Math.abs(phReal - phPlan) >= 0.2;

                const ecPlan = pact?.parametros?.ec_objetivo;
                const ecReal = acc.parametros_real.ec;
                const ecDesviado =
                  ecPlan !== undefined &&
                  ecReal !== undefined &&
                  Math.abs(ecReal - ecPlan) >= 0.15;

                const aguaPlan = pact?.parametros?.ml_agua;
                const aguaReal = acc.parametros_real.ml_agua;
                const aguaDesviado =
                  aguaPlan !== undefined &&
                  aguaReal !== undefined &&
                  Math.abs(aguaReal - aguaPlan) >= 100;

                const hayDesvios = phDesviado || ecDesviado || aguaDesviado;

                const tipoKey = acc.tipo as string;
                const borderColor =
                  TASK_BORDER[tipoKey] ?? 'border-l-slate-500';
                const iconBg =
                  TASK_ICON_BG[tipoKey] ?? 'bg-slate-500/10 text-slate-400';
                const isExpanded = expandedTask === index;

                const hasParams =
                  pact &&
                  (pact.tipo === 'riego' ||
                    pact.tipo === 'fertilizacion' ||
                    pact.tipo === 'medicion');

                return (
                  <div
                    key={acc.id}
                    className={`border border-l-4 rounded-3xl transition-all ${borderColor} ${
                      acc.hecha
                        ? 'bg-[#2a2928]/60 border-[#3a3938]'
                        : 'bg-[#2a2928] border-[#3a3938] hover:border-[#10b981]/20'
                    } ${hayDesvios && acc.hecha ? 'border-amber-500/30 bg-amber-500/[0.02]' : ''}`}
                  >
                    {/* Main row */}
                    <div className="px-4 flex items-center gap-3 min-h-[56px]">

                      {/* Type icon — left */}
                      <div
                        className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}
                      >
                        {TASK_ICON[tipoKey] ?? (
                          <ClipboardList className="w-4 h-4" />
                        )}
                      </div>

                      {/* Task info */}
                      <div className="flex-1 min-w-0 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={`font-sans text-lg font-medium ${
                              acc.hecha
                                ? 'text-muted-foreground line-through'
                                : 'text-foreground'
                            }`}
                          >
                            {TASK_LABELS[tipoKey] ??
                              tipoKey.charAt(0).toUpperCase() +
                                tipoKey.slice(1)}
                          </h3>
                          {esObligatoria && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 font-bold uppercase">
                              Obligatoria
                            </span>
                          )}
                          {hayDesvios && acc.hecha && (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {acc.tipo === 'riego' &&
                            pact &&
                            `Plan: ${pact.parametros.ml_agua}ml · pH ${pact.parametros.ph_objetivo} · EC ${pact.parametros.ec_objetivo}`}
                          {acc.tipo === 'fertilizacion' &&
                            pact &&
                            `Plan: ${pact.parametros.ml_agua}ml · ${pact.parametros.fertilizante}`}
                          {acc.tipo === 'medicion' &&
                            'Monitorear fotoperíodo y parámetros ambientales.'}
                          {acc.tipo === 'poda' &&
                            'Poda apical según instrucciones del Director.'}
                          {acc.tipo === 'defoliacion' &&
                            'Defoliar tercios inferiores.'}
                        </p>

                        {/* Photo thumbnail */}
                        {acc.foto_url && (
                          <div className="pt-1.5">
                            <div className="relative w-20 h-12 rounded-md overflow-hidden border border-[#3a3938]">
                              <img
                                src={acc.foto_url}
                                alt="Foto espécimen"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Camera button */}
                      <button
                        type="button"
                        onClick={() => subirFoto(index)}
                        className="min-w-[44px] min-h-[44px] p-2 rounded-2xl border border-[#3a3938] hover:bg-[#1a232d] hover:border-[#849d85]/30 transition-all text-muted-foreground hover:text-[#849d85] flex items-center justify-center"
                        title="Subir foto de planta"
                      >
                        <Camera className="w-4 h-4" />
                      </button>

                      {/* Expand chevron (only when params exist) */}
                      {hasParams && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedTask(isExpanded ? null : index)
                          }
                          className="min-w-[44px] min-h-[44px] p-2 rounded-2xl border border-[#3a3938] hover:bg-[#1a232d] transition-all text-muted-foreground hover:text-foreground flex items-center justify-center"
                          title="Expandir parámetros"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      {/* Check button — rightmost */}
                      <button
                        type="button"
                        onClick={() => toggleTarea(index)}
                        className="ml-auto min-w-[48px] min-h-[48px] flex items-center justify-center focus:outline-none"
                      >
                        {acc.hecha ? (
                          <div className="w-8 h-8 rounded-full bg-[#849d85] flex items-center justify-center transition-all">
                            <CheckCircle2 className="w-5 h-5 text-[#2a2928]" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full border-2 border-[#3a3938] bg-[#2a2928] flex items-center justify-center hover:border-[#849d85]/50 transition-all" />
                        )}
                      </button>
                    </div>

                    {/* ── Expandable parameter controls ── */}
                    {isExpanded && hasParams && (
                      <div className="border-t border-[#3a3938]/50 px-4 py-4 bg-[#0a0f14] rounded-b-xl">
                        {(pact.tipo === 'riego' ||
                          pact.tipo === 'fertilizacion') && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* ml agua */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex justify-between">
                                <span>Agua por planta</span>
                                {aguaDesviado && (
                                  <span className="text-amber-500 flex items-center gap-0.5">
                                    <AlertTriangle className="w-3 h-3" />{' '}
                                    Desvío
                                  </span>
                                )}
                              </label>
                              <div className="flex items-center gap-1.5 bg-[#2a2928] border border-[#3a3938] rounded-2xl p-1.5">
                                <StepBtn
                                  onClick={() =>
                                    cambiarParametro(
                                      index,
                                      'ml_agua',
                                      Math.max(
                                        0,
                                        (acc.parametros_real.ml_agua ?? 500) -
                                          50,
                                      ),
                                    )
                                  }
                                >
                                  −
                                </StepBtn>
                                <input
                                  type="number"
                                  value={acc.parametros_real.ml_agua ?? 0}
                                  onChange={(e) =>
                                    cambiarParametro(
                                      index,
                                      'ml_agua',
                                      Number(e.target.value),
                                    )
                                  }
                                  className={`w-full text-center bg-transparent border-0 text-sm font-bold focus:outline-none focus:ring-0 p-0 ${
                                    aguaDesviado
                                      ? 'text-amber-400'
                                      : 'text-foreground'
                                  }`}
                                />
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                  ml
                                </span>
                                <StepBtn
                                  onClick={() =>
                                    cambiarParametro(
                                      index,
                                      'ml_agua',
                                      (acc.parametros_real.ml_agua ?? 500) +
                                        50,
                                    )
                                  }
                                >
                                  +
                                </StepBtn>
                              </div>
                            </div>

                            {/* pH */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex justify-between">
                                <span>Nivel pH real</span>
                                {phDesviado && (
                                  <span className="text-red-400 flex items-center gap-0.5">
                                    <AlertTriangle className="w-3 h-3 animate-bounce" />{' '}
                                    Anormal
                                  </span>
                                )}
                              </label>
                              <div className="flex items-center gap-1.5 bg-[#2a2928] border border-[#3a3938] rounded-2xl p-1.5">
                                <StepBtn
                                  onClick={() =>
                                    cambiarParametro(
                                      index,
                                      'ph',
                                      Number(
                                        Math.max(
                                          4.0,
                                          (acc.parametros_real.ph ?? 5.8) - 0.1,
                                        ).toFixed(1),
                                      ),
                                    )
                                  }
                                >
                                  −
                                </StepBtn>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={acc.parametros_real.ph ?? 0}
                                  onChange={(e) =>
                                    cambiarParametro(
                                      index,
                                      'ph',
                                      Number(e.target.value),
                                    )
                                  }
                                  className={`w-full text-center bg-transparent border-0 text-sm font-bold focus:outline-none focus:ring-0 p-0 ${
                                    phDesviado
                                      ? 'text-red-400'
                                      : 'text-foreground'
                                  }`}
                                />
                                <StepBtn
                                  onClick={() =>
                                    cambiarParametro(
                                      index,
                                      'ph',
                                      Number(
                                        Math.min(
                                          8.0,
                                          (acc.parametros_real.ph ?? 5.8) + 0.1,
                                        ).toFixed(1),
                                      ),
                                    )
                                  }
                                >
                                  +
                                </StepBtn>
                              </div>
                            </div>

                            {/* EC */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex justify-between">
                                <span>Conductividad (EC)</span>
                                {ecDesviado && (
                                  <span className="text-amber-500 flex items-center gap-0.5">
                                    <AlertTriangle className="w-3 h-3" />{' '}
                                    Desvío
                                  </span>
                                )}
                              </label>
                              <div className="flex items-center gap-1.5 bg-[#2a2928] border border-[#3a3938] rounded-2xl p-1.5">
                                <StepBtn
                                  onClick={() =>
                                    cambiarParametro(
                                      index,
                                      'ec',
                                      Number(
                                        Math.max(
                                          0.1,
                                          (acc.parametros_real.ec ?? 1.8) - 0.1,
                                        ).toFixed(2),
                                      ),
                                    )
                                  }
                                >
                                  −
                                </StepBtn>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={acc.parametros_real.ec ?? 0}
                                  onChange={(e) =>
                                    cambiarParametro(
                                      index,
                                      'ec',
                                      Number(e.target.value),
                                    )
                                  }
                                  className={`w-full text-center bg-transparent border-0 text-sm font-bold focus:outline-none focus:ring-0 p-0 ${
                                    ecDesviado
                                      ? 'text-amber-400'
                                      : 'text-foreground'
                                  }`}
                                />
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                  mS
                                </span>
                                <StepBtn
                                  onClick={() =>
                                    cambiarParametro(
                                      index,
                                      'ec',
                                      Number(
                                        Math.min(
                                          4.0,
                                          (acc.parametros_real.ec ?? 1.8) + 0.1,
                                        ).toFixed(2),
                                      ),
                                    )
                                  }
                                >
                                  +
                                </StepBtn>
                              </div>
                            </div>
                          </div>
                        )}

                        {pact.tipo === 'medicion' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                Temperatura Real (°C)
                              </label>
                              <input
                                type="number"
                                step="0.5"
                                value={acc.parametros_real.temperatura ?? 24}
                                onChange={(e) =>
                                  cambiarParametro(
                                    index,
                                    'temperatura',
                                    Number(e.target.value),
                                  )
                                }
                                className="w-full min-h-[44px] bg-[#2a2928] border border-[#3a3938] text-sm font-bold text-foreground rounded-2xl px-3 py-1.5 focus:outline-none focus:border-[#849d85]"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                Humedad Real (%)
                              </label>
                              <input
                                type="number"
                                value={acc.parametros_real.humedad ?? 60}
                                onChange={(e) =>
                                  cambiarParametro(
                                    index,
                                    'humedad',
                                    Number(e.target.value),
                                  )
                                }
                                className="w-full min-h-[44px] bg-[#2a2928] border border-[#3a3938] text-sm font-bold text-foreground rounded-2xl px-3 py-1.5 focus:outline-none focus:border-[#849d85]"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
