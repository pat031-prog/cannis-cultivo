'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/lib/context/AppContext';
import { mockDb, PlantillaPlan, PlantillaDia, PlantillaAccion, Genetica } from '@/lib/supabase/mockDb';
import { 
  BookOpen, 
  Plus, 
  Copy, 
  Trash2, 
  Save, 
  Layers, 
  Calendar, 
  Sparkles, 
  Droplet, 
  Thermometer, 
  Flame, 
  Scissors, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Undo2, 
  TrendingUp, 
  PlusCircle, 
  Clock,
  ArrowUpRight,
  Info
} from 'lucide-react';

export default function PlantillasPage() {
  const { activeRole } = useAppContext();
  
  // Lista de todas las plantillas en base de datos
  const [plantillas, setPlantillas] = useState<PlantillaPlan[]>([]);
  // Plantilla actualmente seleccionada para edición
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  // Copia de trabajo local de la plantilla activa para editar sin mutar el DB instantáneamente
  const [editingPlan, setEditingPlan] = useState<PlantillaPlan | null>(null);
  
  // Semana y día activos en el editor visual
  const [activeWeek, setActiveWeek] = useState<number>(1);
  
  // Diálogos de control
  const [showCloneDialog, setShowCloneDialog] = useState<boolean>(false);
  const [cloneName, setCloneName] = useState<string>('');
  
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false);
  const [newPlanName, setNewPlanName] = useState<string>('');
  const [newPlanGenetica, setNewPlanGenetica] = useState<string>('gen-1');
  const [newPlanWeeks, setNewPlanWeeks] = useState<number>(8);
  
  // Alerta de guardado exitoso
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const cargarPlantillas = () => {
    // Tomar las plantillas del mockDb
    setPlantillas([...mockDb.plantillas]);
    
    // Auto seleccionar la primera si hay y no hay ninguna seleccionada
    if (mockDb.plantillas.length > 0 && !selectedPlanId) {
      setSelectedPlanId(mockDb.plantillas[0].id);
    }
  };

  // Cargar plantillas del mockDb al inicio
  useEffect(() => {
    const t = setTimeout(() => {
      cargarPlantillas();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Si cambia la selección de plantilla, cargarla para edición
  useEffect(() => {
    if (selectedPlanId) {
      const plan = mockDb.plantillas.find(p => p.id === selectedPlanId);
      if (plan) {
        // Deep copy del plan para edición aislada
        const planCopy = JSON.parse(JSON.stringify(plan)) as PlantillaPlan;
        const t = setTimeout(() => {
          setEditingPlan(planCopy);
          setActiveWeek(1); // Reset a la semana 1
        }, 0);
        return () => clearTimeout(t);
      }
    } else {
      const t = setTimeout(() => {
        setEditingPlan(null);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [selectedPlanId]);

  // Guardar cambios locales de vuelta en el mockDb
  const handleSaveChanges = () => {
    if (!editingPlan) return;

    // Buscar el índice en el array maestro
    const idx = mockDb.plantillas.findIndex(p => p.id === editingPlan.id);
    if (idx !== -1) {
      // Incrementar versión del plan al guardar cambios
      const updatedPlan = {
        ...editingPlan,
        version: editingPlan.version + 1,
      };
      
      mockDb.plantillas[idx] = updatedPlan;
      mockDb.guardar();
      
      // Actualizar estados
      setEditingPlan(updatedPlan);
      setPlantillas([...mockDb.plantillas]);
      
      // Mostrar feedback visual
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Revertir cambios locales y cargar original
  const handleDiscardChanges = () => {
    if (confirm('¿Estás seguro de que deseas descartar todos los cambios no guardados?')) {
      const plan = mockDb.plantillas.find(p => p.id === selectedPlanId);
      if (plan) {
        setEditingPlan(JSON.parse(JSON.stringify(plan)));
      }
    }
  };

  // Clonación rápida
  const handleCloneTemplate = () => {
    if (!selectedPlanId) return;
    const plan = mockDb.plantillas.find(p => p.id === selectedPlanId);
    if (!plan) return;

    const nombreDefault = `${plan.nombre} (Copia)`;
    setCloneName(nombreDefault);
    setShowCloneDialog(true);
  };

  const submitCloneTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneName.trim()) return;

    const clon = mockDb.clonarPlantilla(selectedPlanId, cloneName);
    if (clon) {
      cargarPlantillas();
      setSelectedPlanId(clon.id); // Seleccionar el clon
      setShowCloneDialog(false);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  // Creación de nueva plantilla
  const submitCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim()) return;

    const nuevoPlanId = `plan-std-${Date.now()}`;
    const diasPlan: PlantillaDia[] = [];

    // Generar estructura vacía basada en la cantidad de semanas
    for (let sem = 1; sem <= newPlanWeeks; sem++) {
      let fase: 'propagacion' | 'vegetativo' | 'pre_floracion' | 'floracion' | 'lavado' | 'secado' = 'vegetativo';
      if (sem === 1) fase = 'propagacion';
      else if (sem === 2 || sem === 3) fase = 'vegetativo';
      else if (sem === 4) fase = 'pre_floracion';
      else if (sem <= newPlanWeeks - 1) fase = 'floracion';
      else fase = 'lavado';

      for (let d = 1; d <= 7; d++) {
        const diaId = `pday-new-${nuevoPlanId}-s${sem}-d${d}`;
        
        // Agregar medición base por defecto en cada día
        const acciones: PlantillaAccion[] = [
          {
            id: `pact-new-${nuevoPlanId}-med-s${sem}-d${d}`,
            plantilla_dia_id: diaId,
            tipo: 'medicion',
            parametros: {
              temperatura_objetivo: fase === 'propagacion' ? 25 : fase === 'floracion' ? 22 : 24,
              humedad_objetivo: fase === 'propagacion' ? 80 : fase === 'floracion' ? 50 : 65,
              fotoperiodo: fase === 'floracion' || fase === 'lavado' ? '12/12' : '18/6',
            },
            obligatoria: true,
          }
        ];

        // Agregar riego básico alternado cada 2 días
        if (d % 2 === 1) {
          acciones.push({
            id: `pact-new-${nuevoPlanId}-riego-s${sem}-d${d}`,
            plantilla_dia_id: diaId,
            tipo: fase === 'lavado' ? 'riego' : (d === 1 || d === 5 ? 'fertilizacion' : 'riego'),
            parametros: {
              ml_agua: fase === 'propagacion' ? 100 : fase === 'floracion' ? 800 : 500,
              ph_objetivo: fase === 'floracion' ? 6.2 : 5.8,
              ec_objetivo: fase === 'lavado' ? 0.2 : (fase === 'propagacion' ? 1.0 : fase === 'floracion' ? 2.0 : 1.6),
              fertilizante: fase === 'lavado' ? 'Ninguno' : (fase === 'floracion' ? 'Flora Bloom A+B' : 'Veg Growth A+B'),
              dosis_ml_l: fase === 'lavado' ? 0 : 2.0,
            },
            obligatoria: true,
          });
        }

        diasPlan.push({
          id: diaId,
          plantilla_id: nuevoPlanId,
          semana: sem,
          dia: d,
          fase,
          acciones,
        });
      }
    }

    const nuevaPlantilla: PlantillaPlan = {
      id: nuevoPlanId,
      nombre: newPlanName,
      genetica_id: newPlanGenetica,
      duracion_semanas: newPlanWeeks,
      version: 1,
      activa: true,
      dias: diasPlan,
    };

    mockDb.plantillas.push(nuevaPlantilla);
    mockDb.guardar();

    cargarPlantillas();
    setSelectedPlanId(nuevoPlanId);
    setShowCreateDialog(false);

    // Limpiar campos
    setNewPlanName('');
    setNewPlanWeeks(8);
  };

  // Eliminación segura de plantilla
  const handleDeleteTemplate = (id: string, nombre: string) => {
    if (mockDb.plantillas.length <= 1) {
      alert('Debe existir al menos una plantilla de cultivo en el sistema.');
      return;
    }

    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente la plantilla "${nombre}"? Esta acción no se puede deshacer.`)) {
      const idx = mockDb.plantillas.findIndex(p => p.id === id);
      if (idx !== -1) {
        mockDb.plantillas.splice(idx, 1);
        mockDb.guardar();
        
        // Buscar otra plantilla para seleccionar
        const rest = mockDb.plantillas;
        setSelectedPlanId(rest[0].id);
        cargarPlantillas();
      }
    }
  };

  // EDITORES DE CONTENIDO INTERNO DE LA COPIA DE TRABAJO (editingPlan)

  // 1. Modificar metadatos principales
  const handleUpdateMeta = (campo: keyof PlantillaPlan, valor: any) => {
    if (!editingPlan) return;

    const updated = { ...editingPlan, [campo]: valor };

    // Si modifican la duración en semanas, ajustar dinámicamente los días de plantilla
    if (campo === 'duracion_semanas') {
      const nuevasSems = Number(valor);
      const semsActuales = editingPlan.duracion_semanas;
      let diasCopy = [...(editingPlan.dias || [])];

      if (nuevasSems > semsActuales) {
        // Añadir semanas faltantes
        for (let sem = semsActuales + 1; sem <= nuevasSems; sem++) {
          const fase = 'floracion'; // Fase por defecto para flora extendida
          for (let d = 1; d <= 7; d++) {
            const diaId = `pday-adjust-${editingPlan.id}-s${sem}-d${d}`;
            diasCopy.push({
              id: diaId,
              plantilla_id: editingPlan.id,
              semana: sem,
              dia: d,
              fase,
              acciones: [
                {
                  id: `pact-adjust-med-s${sem}-d${d}`,
                  plantilla_dia_id: diaId,
                  tipo: 'medicion',
                  parametros: { temperatura_objetivo: 22, humedad_objetivo: 50, fotoperiodo: '12/12' },
                  obligatoria: true
                },
                {
                  id: `pact-adjust-riego-s${sem}-d${d}`,
                  plantilla_dia_id: diaId,
                  tipo: d % 2 === 1 ? 'riego' : 'medicion',
                  parametros: { ml_agua: 800, ph_objetivo: 6.2, ec_objetivo: 2.0 },
                  obligatoria: true
                }
              ].filter((a, i) => i === 0 || d % 2 === 1) as PlantillaAccion[] // sólo meter riego si es impar
            });
          }
        }
      } else if (nuevasSems < semsActuales) {
        // Remover semanas sobrantes
        diasCopy = diasCopy.filter(d => d.semana <= nuevasSems);
        if (activeWeek > nuevasSems) {
          setActiveWeek(nuevasSems);
        }
      }
      updated.dias = diasCopy;
    }

    setEditingPlan(updated);
  };

  // 2. Modificar la fase de un día específico
  const handleUpdateDayFase = (diaIndex: number, nuevaFase: PlantillaDia['fase']) => {
    if (!editingPlan || !editingPlan.dias) return;
    
    const diasCopy = [...editingPlan.dias];
    diasCopy[diaIndex].fase = nuevaFase;
    
    // Auto ajustar fotoperiodo base según fase seleccionada
    const fotoperiodoPredeterminado = (nuevaFase === 'floracion' || nuevaFase === 'lavado' || nuevaFase === 'secado') ? '12/12' : '18/6';
    diasCopy[diaIndex].acciones = diasCopy[diaIndex].acciones?.map(acc => {
      if (acc.tipo === 'medicion') {
        return {
          ...acc,
          parametros: {
            ...acc.parametros,
            fotoperiodo: fotoperiodoPredeterminado,
            temperatura_objetivo: (nuevaFase === 'propagacion') ? 25 : (nuevaFase === 'floracion' || nuevaFase === 'lavado') ? 22 : 24,
            humedad_objetivo: (nuevaFase === 'propagacion') ? 80 : (nuevaFase === 'floracion') ? 50 : (nuevaFase === 'lavado') ? 55 : 65,
          }
        };
      }
      return acc;
    });

    setEditingPlan({ ...editingPlan, dias: diasCopy });
  };

  // 3. Modificar un parámetro específico de una acción en un día
  const handleUpdateActionParam = (diaIndex: number, accionIndex: number, campo: string, valor: any) => {
    if (!editingPlan || !editingPlan.dias) return;

    const diasCopy = [...editingPlan.dias];
    const accionesCopy = [...(diasCopy[diaIndex].acciones || [])];
    
    accionesCopy[accionIndex] = {
      ...accionesCopy[accionIndex],
      parametros: {
        ...accionesCopy[accionIndex].parametros,
        [campo]: valor === '' ? undefined : (typeof valor === 'number' ? valor : (isNaN(Number(valor)) ? valor : Number(valor)))
      }
    };
    
    diasCopy[diaIndex].acciones = accionesCopy;
    setEditingPlan({ ...editingPlan, dias: diasCopy });
  };

  // 4. Toggle obligatoriedad
  const handleToggleActionObligatoria = (diaIndex: number, accionIndex: number) => {
    if (!editingPlan || !editingPlan.dias) return;

    const diasCopy = [...editingPlan.dias];
    const accionesCopy = [...(diasCopy[diaIndex].acciones || [])];
    
    accionesCopy[accionIndex] = {
      ...accionesCopy[accionIndex],
      obligatoria: !accionesCopy[accionIndex].obligatoria
    };
    
    diasCopy[diaIndex].acciones = accionesCopy;
    setEditingPlan({ ...editingPlan, dias: diasCopy });
  };

  // 5. Eliminar una acción
  const handleRemoveAction = (diaIndex: number, accionIndex: number) => {
    if (!editingPlan || !editingPlan.dias) return;

    const diasCopy = [...editingPlan.dias];
    const accionesCopy = [...(diasCopy[diaIndex].acciones || [])];
    
    accionesCopy.splice(accionIndex, 1);
    
    diasCopy[diaIndex].acciones = accionesCopy;
    setEditingPlan({ ...editingPlan, dias: diasCopy });
  };

  // 6. Añadir una nueva acción vacía a un día
  const handleAddAction = (diaIndex: number, tipo: PlantillaAccion['tipo']) => {
    if (!editingPlan || !editingPlan.dias) return;

    const diasCopy = [...editingPlan.dias];
    const accionesCopy = [...(diasCopy[diaIndex].acciones || [])];
    const diaId = diasCopy[diaIndex].id;
    const fase = diasCopy[diaIndex].fase;

    const defaultParams = {
      riego: { ml_agua: 500, ph_objetivo: 5.8, ec_objetivo: 1.6 },
      fertilizacion: { ml_agua: 500, ph_objetivo: 5.8, ec_objetivo: 1.8, fertilizante: 'Veg Grow A+B', dosis_ml_l: 2.0 },
      medicion: { temperatura_objetivo: 24, humedad_objetivo: 65, fotoperiodo: fase === 'floracion' ? '12/12' : '18/6' },
      poda: { notas: 'Poda de brotes' },
      defoliacion: { notas: 'Remover hojas abanico tapando luz' },
      trasplante: { notas: 'Pasar a maceta de 15L' },
      tratamiento: { notas: 'Aplicación preventiva de aceite de neem' },
      otro: { notas: 'Labor general' },
    }[tipo];

    const nuevaAccion: PlantillaAccion = {
      id: `pact-new-add-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      plantilla_dia_id: diaId,
      tipo,
      parametros: defaultParams,
      obligatoria: tipo !== 'otro' && tipo !== 'tratamiento',
    };

    accionesCopy.push(nuevaAccion);
    diasCopy[diaIndex].acciones = accionesCopy;
    
    setEditingPlan({ ...editingPlan, dias: diasCopy });
  };

  // Filtrar los días de la semana activa en el editor
  const activeDaysWithIndices = useMemo(() => {
    if (!editingPlan || !editingPlan.dias) return [];
    
    return editingPlan.dias
      .map((dia, index) => ({ dia, originalIndex: index }))
      .filter(item => item.dia.semana === activeWeek);
  }, [editingPlan, activeWeek]);

  // CÁLCULO DE CURVAS HISTÓRICAS DE PH Y EC PARA LA VISTA DENSE DERECHA DE PREVISUALIZACIÓN AGRONÓMICA
  const curvesData = useMemo(() => {
    if (!editingPlan || !editingPlan.dias) return { ph: [], ec: [], labels: [] };

    const phPoints: number[] = [];
    const ecPoints: number[] = [];
    const labels: string[] = [];

    // Agrupar y promediar parámetros de riego/fertilización por semana para suavizar la curva visual
    for (let sem = 1; sem <= editingPlan.duracion_semanas; sem++) {
      const diasSemana = editingPlan.dias.filter(d => d.semana === sem);
      
      const riegosSemana = diasSemana.flatMap(d => d.acciones || [])
        .filter(a => (a.tipo === 'riego' || a.tipo === 'fertilizacion') && a.parametros.ph_objetivo !== undefined);

      const phProm = riegosSemana.length > 0 
        ? riegosSemana.reduce((sum, r) => sum + (r.parametros.ph_objetivo || 0), 0) / riegosSemana.length 
        : 5.8; // default base

      const ecProm = riegosSemana.length > 0 
        ? riegosSemana.reduce((sum, r) => sum + (r.parametros.ec_objetivo || 0), 0) / riegosSemana.length 
        : 1.0;

      phPoints.push(Number(phProm.toFixed(1)));
      ecPoints.push(Number(ecProm.toFixed(2)));
      labels.push(`W${sem}`);
    }

    return { ph: phPoints, ec: ecPoints, labels };
  }, [editingPlan]);

  // Generar SVG Points String para las curvas
  const svgCurvesPaths = useMemo(() => {
    if (curvesData.labels.length === 0) return { ph: '', ec: '' };

    const width = 280;
    const height = 70;
    const count = curvesData.labels.length;

    const minPh = 5.0;
    const maxPh = 7.0;
    const rangePh = maxPh - minPh;

    const minEc = 0.0;
    const maxEc = 3.0;
    const rangeEc = maxEc - minEc;

    const phPts = curvesData.ph.map((ph, idx) => {
      const x = (idx / (count - 1)) * width;
      const y = height - ((ph - minPh) / rangePh) * height;
      return `${x},${y}`;
    }).join(' ');

    const ecPts = curvesData.ec.map((ec, idx) => {
      const x = (idx / (count - 1)) * width;
      const y = height - ((ec - minEc) / rangeEc) * height;
      return `${x},${y}`;
    }).join(' ');

    return { ph: phPts, ec: ecPts };
  }, [curvesData]);

  // Checkear si hay cambios sin guardar
  const isDirty = useMemo(() => {
    if (!editingPlan) return false;
    const original = mockDb.plantillas.find(p => p.id === selectedPlanId);
    if (!original) return false;
    
    return JSON.stringify(editingPlan) !== JSON.stringify(original);
  }, [editingPlan, selectedPlanId]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. TOP HEADER NAVIGATION & ACCIONES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-500" />
            Diseñador de Plantillas
          </h1>
          <p className="text-muted-foreground text-sm">
            Configuración y modelado agronómico de planes de cultivo estándar para carpas y variedades.
          </p>
        </div>
        
        {/* Acciones principales */}
        <button
          onClick={() => setShowCreateDialog(true)}
          className="self-start sm:self-center py-2 px-4 bg-[#10b981]/10 border border-[#10b981]/30 hover:bg-[#10b981]/20 active:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/5"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Nueva Plantilla</span>
        </button>
      </div>

      {/* ALERTAS GLOBLALES */}
      {saveSuccess && (
        <div className="bg-emerald-950/20 border border-emerald-500/40 p-4 rounded-xl flex items-center gap-3 animate-ring-grow">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div>
            <h4 className="font-bold text-sm text-foreground">¡Plantilla Guardada con Éxito!</h4>
            <p className="text-xs text-muted-foreground">Todos los cambios han sido consolidados de manera segura y actualizados en el sistema local.</p>
          </div>
        </div>
      )}

      {/* DISEÑO EN DOS COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* A. SIDEBAR DE CATÁLOGO (1 de 4 columnas) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#10161d] border border-[#1e293b] p-4 rounded-2xl space-y-4">
            <div className="border-b border-[#1e293b] pb-2 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                Catálogo de Planes
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-muted-foreground font-bold">
                {plantillas.length} Total
              </span>
            </div>

            {/* Listado */}
            <div className="space-y-2 max-h-[400px] lg:max-h-[600px] overflow-y-auto pr-1 no-scrollbar">
              {plantillas.map((p) => {
                const isSelected = selectedPlanId === p.id;
                const gen = mockDb.geneticas.find(g => g.id === p.genetica_id);
                
                return (
                  <div
                    key={p.id}
                    className={`w-full p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                      isSelected 
                        ? 'bg-gradient-to-br from-[#111921] to-[#0c1218] border-emerald-500/40 shadow-md ring-1 ring-emerald-500/20' 
                        : 'bg-[#090d10]/60 border-[#1e293b] hover:border-emerald-500/20 hover:bg-[#131b24]'
                    }`}
                  >
                    <div className="space-y-1">
                      <button
                        onClick={() => setSelectedPlanId(p.id)}
                        className="w-full text-left font-bold text-sm text-foreground hover:text-emerald-400 transition-colors block truncate pr-5"
                      >
                        {p.nombre}
                      </button>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
                        <span>Cepa: <b>{gen?.nombre || 'General'}</b></span>
                      </div>
                      <div className="flex items-center justify-between gap-1 pt-1.5">
                        <span className="text-[9px] font-bold text-muted-foreground bg-black/30 border border-[#1e293b]/70 px-2 py-0.5 rounded">
                          {p.duracion_semanas} Semanas
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          v{p.version}
                        </span>
                      </div>
                    </div>

                    {/* Botón rápido eliminar */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(p.id, p.nombre);
                      }}
                      className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                      title="Eliminar plantilla"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tarjeta pequeña de Ayuda Agronómica */}
          <div className="bg-[#10161d]/50 border border-[#1e293b]/50 p-4 rounded-xl text-left space-y-2">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-emerald-500" />
              Sincronización Automática
            </h4>
            <p className="text-[11px] text-muted-foreground leading-normal">
              Al guardar los cambios en un plan, todos los lotes activos asociados recibirán automáticamente la agenda ajustada para sus días restantes del ciclo.
            </p>
          </div>
        </div>

        {/* B. EDITOR MAESTRO CENTRAL (3 de 4 columnas) */}
        <div className="lg:col-span-3 space-y-6">
          
          {editingPlan ? (
            <div className="space-y-6">
              
              {/* 1. METADATOS DE LA PLANTILLA ACTIVA Y PREVISUALIZACIÓN DE CURVA */}
              <div className="bg-[#10161d] border border-[#1e293b] p-5 rounded-2xl grid grid-cols-1 lg:grid-cols-3 gap-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
                
                {/* Inputs de Metadatos */}
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <span className="text-[10px] text-emerald-500 font-extrabold uppercase tracking-widest block">
                      Editando Plantilla v{editingPlan.version}
                    </span>
                    <input
                      type="text"
                      value={editingPlan.nombre}
                      onChange={(e) => handleUpdateMeta('nombre', e.target.value)}
                      className="w-full bg-transparent border-0 text-xl font-extrabold text-foreground p-0 focus:outline-none focus:ring-0 mt-1 border-b border-dashed border-[#1e293b] focus:border-emerald-500 pb-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Variedad/Genética */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Asociación de Variedad (Cepa)</label>
                      <select
                        value={editingPlan.genetica_id || ''}
                        onChange={(e) => handleUpdateMeta('genetica_id', e.target.value)}
                        className="w-full bg-[#090d10] border border-[#1e293b] text-xs text-foreground rounded-lg px-2.5 py-2 focus:outline-none focus:border-emerald-500 font-semibold"
                      >
                        <option value="">Selecciona cepa...</option>
                        {mockDb.geneticas.map(g => (
                          <option key={g.id} value={g.id}>{g.nombre} ({g.banco})</option>
                        ))}
                      </select>
                    </div>

                    {/* Semanas de duración */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Duración de Ciclo Completo</label>
                      <select
                        value={editingPlan.duracion_semanas}
                        onChange={(e) => handleUpdateMeta('duracion_semanas', e.target.value)}
                        className="w-full bg-[#090d10] border border-[#1e293b] text-xs text-foreground rounded-lg px-2.5 py-2 focus:outline-none focus:border-emerald-500 font-semibold"
                      >
                        {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(w => (
                          <option key={w} value={w}>{w} Semanas ({w * 7} días)</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* VISUALIZADOR DE CURVAS AGRONÓMICAS DENSE (WOW FACTOR) */}
                <div className="lg:col-span-1 bg-[#090d10]/80 border border-[#1e293b]/70 p-3.5 rounded-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-[#1e293b]/50 pb-1.5">
                    <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wide flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      Previsualización Agronómica
                    </span>
                    <span className="text-[8px] text-emerald-400 font-bold uppercase">Reactiva</span>
                  </div>

                  {/* SVG Hand-crafted plot curves */}
                  {curvesData.labels.length > 0 ? (
                    <div className="relative h-20 flex items-center justify-center pt-2">
                      <svg className="w-full h-full overflow-visible">
                        {/* pH Curve Line (Orange) */}
                        <polyline
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray="4,2"
                          points={svgCurvesPaths.ph}
                        />
                        {/* EC Curve Line (Green) */}
                        <polyline
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={svgCurvesPaths.ec}
                        />
                        
                        {/* Puntos sobre las líneas */}
                        {curvesData.ph.map((ph, i) => {
                          const w = 280;
                          const h = 70;
                          const c = curvesData.labels.length;
                          const x = (i / (c - 1)) * w;
                          const yPh = h - ((ph - 5.0) / 2.0) * h;
                          const yEc = h - ((curvesData.ec[i] - 0.0) / 3.0) * h;

                          return (
                            <g key={i}>
                              <circle cx={x} cy={yPh} r="2.5" className="fill-amber-500" />
                              <circle cx={x} cy={yEc} r="2.5" className="fill-emerald-500" />
                            </g>
                          );
                        })}
                      </svg>
                      
                      {/* Ejes flotantes informales */}
                      <div className="absolute left-0 bottom-0 text-[8px] text-amber-500 font-bold">pH</div>
                      <div className="absolute right-0 bottom-0 text-[8px] text-emerald-500 font-bold">EC</div>
                    </div>
                  ) : (
                    <div className="h-16 flex items-center justify-center text-xs text-muted-foreground">
                      Sin datos de riego
                    </div>
                  )}

                  {/* Leyenda y valores extremos */}
                  <div className="flex items-center justify-between text-[8.5px] text-muted-foreground pt-1.5 border-t border-[#1e293b]/40">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> pH prom: {curvesData.ph[activeWeek - 1] || 5.8}</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> EC prom: {curvesData.ec[activeWeek - 1] || 1.6} mS</span>
                  </div>
                </div>

              </div>

              {/* 2. SELECTOR DE SEMANA (FITNESS APP ACCENTS) */}
              <div className="flex flex-col space-y-2">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider px-1">
                  Planificación por Semanas
                </span>
                
                {/* Carrusel de semanas */}
                <div className="flex gap-2 overflow-x-auto pb-1 pr-2 no-scrollbar">
                  {Array.from({ length: editingPlan.duracion_semanas }).map((_, i) => {
                    const wNum = i + 1;
                    const isActive = activeWeek === wNum;
                    
                    // Determinar qué fase predomina en esta semana
                    const diasSem = editingPlan.dias?.filter(d => d.semana === wNum) || [];
                    const fasePredominante = diasSem[0]?.fase || 'vegetativo';
                    
                    const borderColorFase = {
                      propagacion: 'border-phase-propagacion text-phase-propagacion bg-phase-propagacion/5',
                      vegetativo: 'border-phase-vegetativo text-phase-vegetativo bg-phase-vegetativo/5',
                      pre_floracion: 'border-phase-prefloracion text-phase-prefloracion bg-phase-prefloracion/5',
                      floracion: 'border-phase-floracion text-phase-floracion bg-phase-floracion/5',
                      lavado: 'border-phase-lavado text-phase-lavado bg-phase-lavado/5',
                      secado: 'border-phase-secado text-phase-secado bg-phase-secado/5',
                    }[fasePredominante];

                    return (
                      <button
                        key={wNum}
                        onClick={() => setActiveWeek(wNum)}
                        className={`flex-shrink-0 px-4 py-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                          isActive 
                            ? 'bg-emerald-500 text-slate-900 border-emerald-400 font-extrabold shadow-md' 
                            : `bg-[#10161d] border-[#1e293b] text-foreground hover:border-[#1e293b]/80 hover:bg-[#131b24]`
                        }`}
                      >
                        <span>Semana {wNum}</span>
                        <span className={`text-[8px] font-extrabold uppercase px-1.5 rounded ${
                          isActive ? 'bg-slate-950/20 text-slate-900' : borderColorFase
                        }`}>
                          {fasePredominante.replace('_', ' ')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. GRILLA DE DÍAS Y EDITORES DE ACCIONES (7 DÍAS DE LA SEMANA) */}
              <div className="space-y-6">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider px-1 block">
                  Días y Labores de Cultivo Planificadas (Semana {activeWeek})
                </span>
                
                {/* Render de los 7 días */}
                <div className="space-y-4">
                  {activeDaysWithIndices.map(({ dia, originalIndex }) => {
                    const diaAcciones = dia.acciones || [];
                    
                    return (
                      <div
                        key={dia.id}
                        className="bg-[#10161d] border border-[#1e293b] p-5 rounded-2xl grid grid-cols-1 lg:grid-cols-4 gap-5 transition-all hover:border-[#1e293b]/80"
                      >
                        
                        {/* Columna Izquierda (Info de Día y Fase Selector) */}
                        <div className="lg:col-span-1 space-y-3 border-b lg:border-b-0 lg:border-r border-[#1e293b]/50 pb-4 lg:pb-0 lg:pr-4">
                          <div>
                            <span className="text-xs text-emerald-500 font-bold uppercase tracking-wider">Jornada</span>
                            <h3 className="text-base font-extrabold text-foreground">Día {dia.dia}</h3>
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              (Día absoluto {((activeWeek - 1) * 7) + dia.dia} de ciclo)
                            </span>
                          </div>

                          {/* Fase del Día */}
                          <div className="space-y-1">
                            <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Fase de Planta</label>
                            <select
                              value={dia.fase}
                              onChange={(e) => handleUpdateDayFase(originalIndex, e.target.value as any)}
                              className="w-full bg-[#090d10] border border-[#1e293b] text-[11px] text-foreground rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-500 font-bold"
                            >
                              <option value="propagacion">🌱 Propagación</option>
                              <option value="vegetativo">🌿 Vegetativo</option>
                              <option value="pre_floracion">🍂 Pre-Floración</option>
                              <option value="floracion">🌸 Floración</option>
                              <option value="lavado">🧼 Lavado Final</option>
                              <option value="secado">⏳ Secado</option>
                            </select>
                          </div>

                          {/* Botón rápido Añadir Labor */}
                          <div className="pt-2">
                            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block pb-1">Añadir Nueva Labor</span>
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                onClick={() => handleAddAction(originalIndex, 'riego')}
                                className="py-1 px-1.5 bg-[#090d10] border border-[#1e293b] hover:border-emerald-500/30 hover:bg-[#131b24] text-[10px] font-bold rounded flex items-center justify-center gap-1"
                              >
                                <Droplet className="w-3 h-3 text-blue-400" />
                                <span>Riego</span>
                              </button>
                              <button
                                onClick={() => handleAddAction(originalIndex, 'fertilizacion')}
                                className="py-1 px-1.5 bg-[#090d10] border border-[#1e293b] hover:border-emerald-500/30 hover:bg-[#131b24] text-[10px] font-bold rounded flex items-center justify-center gap-1"
                              >
                                <Flame className="w-3 h-3 text-purple-400" />
                                <span>Fertil.</span>
                              </button>
                              <button
                                onClick={() => handleAddAction(originalIndex, 'medicion')}
                                className="py-1 px-1.5 bg-[#090d10] border border-[#1e293b] hover:border-emerald-500/30 hover:bg-[#131b24] text-[10px] font-bold rounded flex items-center justify-center gap-1"
                              >
                                <Thermometer className="w-3 h-3 text-orange-400" />
                                <span>Monit.</span>
                              </button>
                              <button
                                onClick={() => {
                                  const labor = prompt("Elige labor: poda, defoliacion, trasplante, tratamiento, otro");
                                  if (labor && ['poda', 'defoliacion', 'trasplante', 'tratamiento', 'otro'].includes(labor.toLowerCase())) {
                                    handleAddAction(originalIndex, labor.toLowerCase() as any);
                                  }
                                }}
                                className="py-1 px-1.5 bg-[#090d10] border border-[#1e293b] hover:border-emerald-500/30 hover:bg-[#131b24] text-[10px] font-bold rounded flex items-center justify-center gap-1"
                              >
                                <Scissors className="w-3 h-3 text-amber-500" />
                                <span>Poda/Otro</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Columna Derecha (Lista de Acciones a Editar - 3/4 de columnas) */}
                        <div className="lg:col-span-3 space-y-3">
                          
                          {diaAcciones.map((acc, aIdx) => {
                            const isRiego = acc.tipo === 'riego';
                            const isFert = acc.tipo === 'fertilizacion';
                            const isMed = acc.tipo === 'medicion';
                            const isPoda = acc.tipo === 'poda' || acc.tipo === 'defoliacion';
                            const isTrasplante = acc.tipo === 'trasplante';
                            
                            return (
                              <div
                                key={acc.id}
                                className="bg-[#090d10]/40 border border-[#1e293b]/70 rounded-xl p-3.5 space-y-3 hover:border-[#1e293b] relative overflow-hidden group/item"
                              >
                                
                                {/* Fila superior de la acción */}
                                <div className="flex items-center justify-between gap-3 border-b border-[#1e293b]/30 pb-2">
                                  <div className="flex items-center gap-2">
                                    {/* Icon */}
                                    {isRiego && <Droplet className="w-4 h-4 text-blue-400" />}
                                    {isFert && <Flame className="w-4 h-4 text-purple-400" />}
                                    {isMed && <Thermometer className="w-4 h-4 text-orange-400" />}
                                    {(isPoda || isTrasplante) && <Scissors className="w-4 h-4 text-amber-500" />}
                                    {!isRiego && !isFert && !isMed && !isPoda && !isTrasplante && <Activity className="w-4 h-4 text-emerald-400" />}
                                    
                                    <span className="font-extrabold text-xs text-foreground uppercase tracking-wide">
                                      {acc.tipo === 'fertilizacion' ? 'fertilización' : acc.tipo}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {/* Checkbox Obligatoria */}
                                    <label className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={acc.obligatoria}
                                        onChange={() => handleToggleActionObligatoria(originalIndex, aIdx)}
                                        className="rounded bg-[#090d10] border-[#1e293b] text-emerald-500 focus:ring-0 w-3 h-3"
                                      />
                                      <span>OBLIGATORIA</span>
                                    </label>

                                    {/* Eliminar acción */}
                                    <button
                                      onClick={() => handleRemoveAction(originalIndex, aIdx)}
                                      className="text-muted-foreground hover:text-red-400 transition-colors p-0.5"
                                      title="Eliminar labor"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* EDITORES DE PARÁMETROS ESPECÍFICOS SEGÚN TIPO */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                  
                                  {/* RIEGO / FERTILIZACIÓN INPUTS */}
                                  {(isRiego || isFert) && (
                                    <>
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Agua Esperada (ml)</label>
                                        <input
                                          type="number"
                                          value={acc.parametros.ml_agua ?? 0}
                                          onChange={(e) => handleUpdateActionParam(originalIndex, aIdx, 'ml_agua', Number(e.target.value))}
                                          className="w-full bg-[#10161d] border border-[#1e293b] px-2 py-1 rounded focus:outline-none focus:border-emerald-500 font-bold"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Objetivo pH</label>
                                        <input
                                          type="number"
                                          step="0.1"
                                          value={acc.parametros.ph_objetivo ?? 0}
                                          onChange={(e) => handleUpdateActionParam(originalIndex, aIdx, 'ph_objetivo', Number(e.target.value))}
                                          className="w-full bg-[#10161d] border border-[#1e293b] px-2 py-1 rounded focus:outline-none focus:border-emerald-500 font-bold"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Objetivo EC (mS)</label>
                                        <input
                                          type="number"
                                          step="0.1"
                                          value={acc.parametros.ec_objetivo ?? 0}
                                          onChange={(e) => handleUpdateActionParam(originalIndex, aIdx, 'ec_objetivo', Number(e.target.value))}
                                          className="w-full bg-[#10161d] border border-[#1e293b] px-2 py-1 rounded focus:outline-none focus:border-emerald-500 font-bold"
                                        />
                                      </div>
                                    </>
                                  )}

                                  {/* FERTILIZANTE ADICIONAL */}
                                  {isFert && (
                                    <>
                                      <div className="space-y-1 sm:col-span-2">
                                        <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Fórmula Fertilizante</label>
                                        <input
                                          type="text"
                                          value={acc.parametros.fertilizante ?? ''}
                                          onChange={(e) => handleUpdateActionParam(originalIndex, aIdx, 'fertilizante', e.target.value)}
                                          className="w-full bg-[#10161d] border border-[#1e293b] px-2 py-1 rounded focus:outline-none focus:border-emerald-500 font-bold"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Dosis (ml / Litro)</label>
                                        <input
                                          type="number"
                                          step="0.5"
                                          value={acc.parametros.dosis_ml_l ?? 0}
                                          onChange={(e) => handleUpdateActionParam(originalIndex, aIdx, 'dosis_ml_l', Number(e.target.value))}
                                          className="w-full bg-[#10161d] border border-[#1e293b] px-2 py-1 rounded focus:outline-none focus:border-emerald-500 font-bold"
                                        />
                                      </div>
                                    </>
                                  )}

                                  {/* MEDICIÓN INPUTS */}
                                  {isMed && (
                                    <>
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Temp. Objetivo (°C)</label>
                                        <input
                                          type="number"
                                          value={acc.parametros.temperatura_objetivo ?? 0}
                                          onChange={(e) => handleUpdateActionParam(originalIndex, aIdx, 'temperatura_objetivo', Number(e.target.value))}
                                          className="w-full bg-[#10161d] border border-[#1e293b] px-2 py-1 rounded focus:outline-none focus:border-emerald-500 font-bold"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Humedad Objetivo (%)</label>
                                        <input
                                          type="number"
                                          value={acc.parametros.humedad_objetivo ?? 0}
                                          onChange={(e) => handleUpdateActionParam(originalIndex, aIdx, 'humedad_objetivo', Number(e.target.value))}
                                          className="w-full bg-[#10161d] border border-[#1e293b] px-2 py-1 rounded focus:outline-none focus:border-emerald-500 font-bold"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Fotoperíodo</label>
                                        <select
                                          value={acc.parametros.fotoperiodo ?? '18/6'}
                                          onChange={(e) => handleUpdateActionParam(originalIndex, aIdx, 'fotoperiodo', e.target.value)}
                                          className="w-full bg-[#10161d] border border-[#1e293b] px-2 py-1 rounded focus:outline-none focus:border-emerald-500 font-bold"
                                        >
                                          <option value="18/6">18hs Luz / 6hs Sombra</option>
                                          <option value="12/12">12hs Luz / 12hs Sombra</option>
                                          <option value="24/0">24hs Luz Completa</option>
                                          <option value="Otro">Otro fotoperíodo</option>
                                        </select>
                                      </div>
                                    </>
                                  )}

                                  {/* LABORES DE PODA U OTROS (NOTAS INSTRUCCIONES) */}
                                  {!isRiego && !isFert && !isMed && (
                                    <div className="space-y-1 sm:col-span-3">
                                      <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Instrucciones de Labor para el Jardinero</label>
                                      <input
                                        type="text"
                                        value={acc.parametros.notas ?? ''}
                                        onChange={(e) => handleUpdateActionParam(originalIndex, aIdx, 'notas', e.target.value)}
                                        placeholder="Ej: Poda apical en tercer nudo, limpiar hojas secas, aplicar Neem preventivo..."
                                        className="w-full bg-[#10161d] border border-[#1e293b] px-3 py-1.5 rounded focus:outline-none focus:border-emerald-500 font-medium placeholder-muted-foreground/45"
                                      />
                                    </div>
                                  )}

                                </div>
                              </div>
                            );
                          })}

                          {diaAcciones.length === 0 && (
                            <div className="py-6 text-center text-muted-foreground text-xs border border-dashed border-[#1e293b] rounded-xl bg-[#090d10]/20">
                              No hay labores asignadas para este día. El jardinero no tendrá checklist asignado.
                            </div>
                          )}

                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. BARRA DE ACCIÓN PIE DE PÁGINA STICKY PARA GUARDAR CAMBIOS */}
              <div className="bg-[#10161d] border border-[#1e293b] px-6 py-4 rounded-2xl flex items-center justify-between sticky bottom-2 z-30 shadow-xl shadow-black/30">
                <div className="flex items-center gap-2">
                  {isDirty ? (
                    <span className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>Cambios pendientes de consolidación</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Diseño agronómico en orden y sincronizado</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Descartar */}
                  <button
                    disabled={!isDirty}
                    onClick={handleDiscardChanges}
                    className={`py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isDirty 
                        ? 'bg-[#ef4444]/10 hover:bg-[#ef4444]/20 border border-[#ef4444]/30 text-red-400' 
                        : 'bg-[#10161d] border border-[#1e293b]/70 text-muted-foreground opacity-55 cursor-not-allowed'
                    }`}
                  >
                    <Undo2 className="w-4 h-4" />
                    <span>Descartar</span>
                  </button>

                  {/* Clonar */}
                  <button
                    onClick={handleCloneTemplate}
                    className="py-2 px-4 bg-[#10161d] border border-[#1e293b] hover:bg-[#131b24] text-foreground rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Copy className="w-4 h-4 text-emerald-500" />
                    <span>Clonar Plan</span>
                  </button>

                  {/* Guardar */}
                  <button
                    disabled={!isDirty}
                    onClick={handleSaveChanges}
                    className={`py-2 px-5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg ${
                      isDirty 
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-900 shadow-emerald-500/10' 
                        : 'bg-[#1e293b] text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar y Versionar</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-[#10161d] border border-dashed border-[#1e293b] p-12 rounded-2xl text-center space-y-4 flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-emerald-500">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="font-bold text-base text-foreground">Ninguna Plantilla Seleccionada</h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  Por favor selecciona una plantilla de cultivo del catálogo lateral o crea una nueva para comenzar a diseñar sus parámetros agronómicos.
                </p>
              </div>
              <button
                onClick={() => setShowCreateDialog(true)}
                className="py-2 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-900 rounded-lg text-xs font-bold transition-all"
              >
                Crear Primera Plantilla
              </button>
            </div>
          )}

        </div>

      </div>

      {/* ========================================== */}
      {/* 5. MODALES / DIÁLOGOS DE CONTROL SIMULADOS */}
      {/* ========================================== */}

      {/* A. MODAL CLONAR PLANTILLA */}
      {showCloneDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#10161d] border border-emerald-500/30 p-6 rounded-2xl shadow-xl w-full max-w-md relative overflow-hidden animate-ring-grow">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
            
            <div className="flex justify-between items-center pb-3 border-b border-[#1e293b] mb-4">
              <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
                <Copy className="w-5 h-5 text-emerald-500" />
                Clonar Diseño de Plan
              </h3>
              <button
                onClick={() => setShowCloneDialog(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={submitCloneTemplate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Nombre del Nuevo Plan</label>
                <input
                  type="text"
                  required
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  className="w-full bg-[#090d10] border border-[#1e293b] text-sm text-foreground rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloneDialog(false)}
                  className="w-1/2 py-2 border border-[#1e293b] hover:bg-[#131b24] text-foreground rounded-lg text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-900 rounded-lg text-xs font-bold transition-all"
                >
                  Clonar e Ir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. MODAL CREAR PLANTILLA DESDE CERO */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#10161d] border border-emerald-500/30 p-6 rounded-2xl shadow-xl w-full max-w-md relative overflow-hidden animate-ring-grow">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
            
            <div className="flex justify-between items-center pb-3 border-b border-[#1e293b] mb-4">
              <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
                <PlusCircle className="w-5 h-5 text-emerald-500" />
                Nueva Plantilla de Cultivo
              </h3>
              <button
                onClick={() => setShowCreateDialog(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={submitCreateTemplate} className="space-y-4">
              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Nombre del Plan</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Standard Amnesia - 10 Semanas"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  className="w-full bg-[#090d10] border border-[#1e293b] text-sm text-foreground rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              {/* Genética */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Asociación de Genética (Cepa)</label>
                <select
                  value={newPlanGenetica}
                  onChange={(e) => setNewPlanGenetica(e.target.value)}
                  className="w-full bg-[#090d10] border border-[#1e293b] text-sm text-foreground rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500 font-semibold"
                >
                  {mockDb.geneticas.map(g => (
                    <option key={g.id} value={g.id}>{g.nombre} ({g.banco})</option>
                  ))}
                </select>
              </div>

              {/* Semanas */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Duración de Ciclo (Semanas)</label>
                <input
                  type="number"
                  min="4"
                  max="16"
                  required
                  value={newPlanWeeks}
                  onChange={(e) => setNewPlanWeeks(Number(e.target.value))}
                  className="w-full bg-[#090d10] border border-[#1e293b] text-sm font-bold text-foreground rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-muted-foreground leading-normal block pt-1">
                  Se pre-generará automáticamente una agenda base con mediciones de temperatura/humedad diarias y riegos alternados cada 2 días para agilizar tu diseño.
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateDialog(false)}
                  className="w-1/2 py-2 border border-[#1e293b] hover:bg-[#131b24] text-foreground rounded-lg text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-900 rounded-lg text-xs font-bold transition-all"
                >
                  Crear e Ir a Diseñar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
