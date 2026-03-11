import React, { useState, useEffect, useMemo } from 'react';
import { 
  Save, Clock, User, Phone, Mail, FileText, 
  CheckCircle, Briefcase, ListPlus, 
  Star, Bell, X, Settings, Trash2, UserPlus,
  TableProperties, FilePlus2, RefreshCw, Loader2, Database,
  BarChart3, Target, TrendingUp, CalendarX, Moon, Layers, Activity,
  Search, Filter, ChevronUp, ChevronDown, Terminal, Edit2, Megaphone, Globe, ExternalLink
} from 'lucide-react';

export default function App() {
  // Estado inicial del formulario
  const initialState = {
    id: '', // Se usa para la actualización
    titulo: '', fecha_ingreso: '', fecha_control: '',
    tiempo_respuesta_hrs: '', novedad_tiempo: '',
    fuente_medio: '', campania: '', celular: '', email: '',
    linea_interes: '',
    estado: 'Nuevo', asesor: '', calificacion_lead: 'Por evaluar',
    razon_calificacion: '', notas_seguimiento: '',
    fecha_actualizacion_nota: '', 
    fecha_seguimiento_dia: '', jornada_seguimiento: '', hora_seguimiento: '',
    accion: '', estado_orden: 'Abierta', fecha_cierre: '',
    observaciones: '', datos_adjuntos: [],
    programar_recordatorio: false, canal_recordatorio: 'email'
  };

  const [formData, setFormData] = useState(initialState);
  const [savedLeads, setSavedLeads] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [scheduledReminder, setScheduledReminder] = useState(null);
  
  // Vistas y Cargas
  const [currentView, setCurrentView] = useState('form'); // 'form' | 'data' | 'reports'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState(null); // Estado para saber si estamos editando
  const [showEditModal, setShowEditModal] = useState(false); // Estado para mostrar el modal de edición

  // --- Logs del Sistema ---
  const [appLogs, setAppLogs] = useState([]);
  const [showLogsModal, setShowLogsModal] = useState(false);

  const addLog = (message, type = 'info') => {
    setAppLogs(prev => {
      const newLogs = [{ time: new Date().toLocaleTimeString(), message, type }, ...prev];
      return newLogs.slice(0, 100); // Conservar solo los últimos 100 registros
    });
  };

  useEffect(() => {
    addLog('Aplicación inicializada correctamente.', 'info');
  }, []);

  // --- Efecto global para cerrar modales con la tecla ESC ---
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowAdminModal(false);
        setShowLogsModal(false);
        if(showEditModal){
          handleCancelEdit();
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showEditModal]);

  // --- Estados de Filtros y Ordenamiento ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAsesor, setFilterAsesor] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterMes, setFilterMes] = useState(''); // Filtro por mes (YYYY-MM)
  const [filterFuente, setFilterFuente] = useState(''); // Filtro por fuente
  const [filterCampania, setFilterCampania] = useState(''); // Filtro por campaña
  const [reportFilterCalificacion, setReportFilterCalificacion] = useState(''); // Nuevo filtro de reportes
  const [sortConfig, setSortConfig] = useState({ key: 'fecha_ingreso', direction: 'descending' });

  // --- Módulo de Administración y Configuración ---
  const defaultAsesores = [
    'Francisco Galeano', 'Catalina Arevalo', 'Juan Mora',
    'David Naranjo', 'Sandra Ortiz', 'Paola Cardenas',
    'Andrea Morales', 'Carolina Garcia', 'Ximena Tovar'
  ];

  const defaultLineas = [
    'Iluminacion', 'Baños', 'General', 'Porcelanatos', 'Cocinas', 'Poliform'
  ].sort((a, b) => a.localeCompare(b));

  const defaultAcciones = [
    'Agendar Cita', 'Cotizacion', 'Envio Catalogo', 'Venta', 'Mensaje Cierre', 'Primer Contacto'
  ].sort((a, b) => a.localeCompare(b));

  const defaultFuentes = [
    'ING PAID', 'FB PAID', 'SM ORGANIC', 'GOOGLE SEARCH', 'GOOGLE ORGANIC'
  ].sort((a, b) => a.localeCompare(b));

  const defaultCampanias = [
    'Hansgrohe'
  ].sort((a, b) => a.localeCompare(b));
  
  const [asesoresList, setAsesoresList] = useState(defaultAsesores);
  const [lineasList, setLineasList] = useState(defaultLineas);
  const [accionesList, setAccionesList] = useState(defaultAcciones);
  const [fuentesList, setFuentesList] = useState(defaultFuentes);
  const [campaniasList, setCampaniasList] = useState(defaultCampanias);
  
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminTab, setAdminTab] = useState('asesores'); // 'asesores' | 'lineas' | 'acciones' | 'fuentes' | 'campanias' | 'integracion'
  
  const [newAsesorName, setNewAsesorName] = useState('');
  const [newLineaName, setNewLineaName] = useState('');
  const [newAccionName, setNewAccionName] = useState('');
  const [newFuenteName, setNewFuenteName] = useState('');
  const [newCampaniaName, setNewCampaniaName] = useState('');

  // Configuración de Power Automate
  const DEFAULT_POST_URL = "https://default2dad2f4230e64fe8adc416a2300053.14.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/eb80d7bc6701476b8fcc8a81b004b87b/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=7mnm_UEBbdPHBLJzOgUDdnQM_jLP5szOIvH8yiwyNw0";
  const DEFAULT_GET_URL = "https://default2dad2f4230e64fe8adc416a2300053.14.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c3760089aa194bffab0b4997b56ed1d1/triggers/manual/paths/invoke?api-version=1";
  
  const [paConfig, setPaConfig] = useState({
    urlPost: localStorage.getItem('pa_url_post') || DEFAULT_POST_URL,
    urlGet: localStorage.getItem('pa_url_get') || DEFAULT_GET_URL,
    urlPut: localStorage.getItem('pa_url_put') || '' // Nueva URL para actualizar
  });
  const [saveConfigSuccess, setSaveConfigSuccess] = useState(false);

  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    setPaConfig({ ...paConfig, [name]: value });
  };

  const handleSaveConfig = () => {
    localStorage.setItem('pa_url_post', paConfig.urlPost);
    localStorage.setItem('pa_url_get', paConfig.urlGet);
    localStorage.setItem('pa_url_put', paConfig.urlPut);
    setSaveConfigSuccess(true);
    addLog('Configuración de URLs guardada localmente.', 'success');
    setTimeout(() => {
      setSaveConfigSuccess(false);
    }, 3000);
  };

  // Funciones Asesores, Líneas, Acciones, Fuentes y Campañas
  const handleAddAsesor = () => {
    if (newAsesorName.trim() && !asesoresList.includes(newAsesorName.trim())) {
      setAsesoresList([...asesoresList, newAsesorName.trim()]);
      setNewAsesorName('');
    }
  };

  const handleRemoveAsesor = (asesorToRemove) => {
    setAsesoresList(asesoresList.filter(a => a !== asesorToRemove));
    if (formData.asesor === asesorToRemove) setFormData(prev => ({ ...prev, asesor: '' }));
  };

  const handleAddLinea = () => {
    if (newLineaName.trim() && !lineasList.includes(newLineaName.trim())) {
      const newList = [...lineasList, newLineaName.trim()].sort((a, b) => a.localeCompare(b));
      setLineasList(newList);
      setNewLineaName('');
    }
  };

  const handleRemoveLinea = (lineaToRemove) => {
    setLineasList(lineasList.filter(l => l !== lineaToRemove));
    if (formData.linea_interes === lineaToRemove) setFormData(prev => ({ ...prev, linea_interes: '' }));
  };

  const handleAddAccion = () => {
    if (newAccionName.trim() && !accionesList.includes(newAccionName.trim())) {
      const newList = [...accionesList, newAccionName.trim()].sort((a, b) => a.localeCompare(b));
      setAccionesList(newList);
      setNewAccionName('');
    }
  };

  const handleRemoveAccion = (accionToRemove) => {
    setAccionesList(accionesList.filter(a => a !== accionToRemove));
    if (formData.accion === accionToRemove) setFormData(prev => ({ ...prev, accion: '' }));
  };

  const handleAddFuente = () => {
    if (newFuenteName.trim() && !fuentesList.includes(newFuenteName.trim().toUpperCase())) {
      const newList = [...fuentesList, newFuenteName.trim().toUpperCase()].sort((a, b) => a.localeCompare(b));
      setFuentesList(newList);
      setNewFuenteName('');
    }
  };

  const handleRemoveFuente = (fuenteToRemove) => {
    setFuentesList(fuentesList.filter(f => f !== fuenteToRemove));
    if (formData.fuente_medio === fuenteToRemove) setFormData(prev => ({ ...prev, fuente_medio: '' }));
  };

  const handleAddCampania = () => {
    if (newCampaniaName.trim() && !campaniasList.includes(newCampaniaName.trim())) {
      const newList = [...campaniasList, newCampaniaName.trim()].sort((a, b) => a.localeCompare(b));
      setCampaniasList(newList);
      setNewCampaniaName('');
    }
  };

  const handleRemoveCampania = (campaniaToRemove) => {
    setCampaniasList(campaniasList.filter(c => c !== campaniaToRemove));
    if (formData.campania === campaniaToRemove) setFormData(prev => ({ ...prev, campania: '' }));
  };

  // Efecto: Cálculo de tiempo de respuesta
  useEffect(() => {
    if (formData.fecha_ingreso && formData.fecha_control) {
      const ingreso = new Date(formData.fecha_ingreso);
      const control = new Date(formData.fecha_control);
      if (!isNaN(ingreso.getTime()) && !isNaN(control.getTime())) {
        const diffMs = control - ingreso;
        const diffHrs = (diffMs / (1000 * 60 * 60)).toFixed(2);
        setFormData(prev => ({ ...prev, tiempo_respuesta_hrs: diffHrs > 0 ? diffHrs : '0.00' }));
      }
    } else {
      setFormData(prev => ({ ...prev, tiempo_respuesta_hrs: '' }));
    }
  }, [formData.fecha_ingreso, formData.fecha_control]);

  // Manejadores de formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({ ...prev, datos_adjuntos: [...(prev.datos_adjuntos || []), ...files] }));
  };

  const removeFile = (indexToRemove) => {
    setFormData(prev => ({
      ...prev, datos_adjuntos: prev.datos_adjuntos.filter((_, index) => index !== indexToRemove)
    }));
  };

  const convertFilesToBase64 = async (files) => {
    const promises = files.map(file => {
      // Si el archivo ya es un link o ya fue procesado, se omite
      if (!file.type && file.contentBytes) return Promise.resolve(file);
      if (!file.name) return Promise.resolve(null);

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({ name: file.name, type: file.type, contentBytes: e.target.result.split(',')[1] });
        reader.readAsDataURL(file);
      });
    });
    const results = await Promise.all(promises);
    return results.filter(r => r !== null);
  };

  // Cargar datos en el formulario para editar
  const handleEditLead = (lead) => {
    setEditingLeadId(lead.id);
    setFormData({
      ...initialState, // Asegurar estructura
      ...lead,
      datos_adjuntos: lead.datos_adjuntos || [] 
    });
    setShowEditModal(true);
    addLog(`Abriendo modal de edición para registro [${lead.titulo || lead.id}].`, 'info');
  };

  const handleCancelEdit = () => {
    setEditingLeadId(null);
    setFormData(initialState);
    setShowEditModal(false);
    addLog('Edición cancelada.', 'warning');
  };

  // Enviar / Actualizar Datos
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    addLog(editingLeadId ? 'Procesando actualización de formulario...' : 'Procesando nuevo formulario...', 'info');

    try {
      let adjuntosBase64 = [];
      if (formData.datos_adjuntos && formData.datos_adjuntos.length > 0) {
        adjuntosBase64 = await convertFilesToBase64(formData.datos_adjuntos);
        addLog(`${adjuntosBase64.length} archivo(s) procesados.`, 'info');
      }

      const payload = {
        ...formData,
        datos_adjuntos: adjuntosBase64,
        fecha_registro_sistema: new Date().toISOString()
      };

      if (editingLeadId) {
        // LÓGICA DE ACTUALIZACIÓN (PUT/PATCH)
        if (paConfig.urlPut) {
          addLog('Enviando solicitud de ACTUALIZACIÓN a Power Automate...', 'info');
          await fetch(paConfig.urlPut, {
            method: 'POST', // Usamos POST para mayor compatibilidad con HTTP Trigger de PA
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          addLog('Registro actualizado en SharePoint exitosamente.', 'success');
          // Ya NO actualizamos el estado local asumiendo éxito. Forzamos a que SharePoint sea la única fuente de verdad.
        } else {
          addLog('No se configuró URL de actualización. No se enviaron los cambios.', 'error');
          alert("Debes configurar la URL de actualización en los ajustes.");
          return;
        }
      } else {
        // LÓGICA DE CREACIÓN (POST)
        if (paConfig.urlPost) {
          addLog('Enviando solicitud POST a Power Automate...', 'info');
          await fetch(paConfig.urlPost, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          addLog('Registro guardado y enviado a SharePoint exitosamente.', 'success');
          // Eliminado: setSavedLeads([{ ...payload, id: Date.now() }, ...savedLeads]); -> Ahora no guardamos en memoria local simulada.
        } else {
           addLog('Error: No hay URL POST configurada.', 'error');
           alert("No has configurado la URL para enviar datos (POST).");
           return;
        }
      }

      // Recordatorio local (esto sigue siendo útil a nivel interfaz si lo usas)
      if (formData.programar_recordatorio && formData.fecha_seguimiento_dia) {
        const timeString = formData.hora_seguimiento || '00:00';
        const fechaSeg = new Date(`${formData.fecha_seguimiento_dia}T${timeString}:00`);
        fechaSeg.setDate(fechaSeg.getDate() - 1);
        
        setScheduledReminder({ 
          fecha: fechaSeg.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }), 
          canal: formData.canal_recordatorio === 'teams' ? 'Microsoft Teams' : 'Correo Electrónico' 
        });
        addLog(`Recordatorio programado para ${fechaSeg.toLocaleString()}`, 'info');
      }
      
      setShowSuccess(true);
      setFormData(initialState);
      if(editingLeadId) {
         setShowEditModal(false);
      }
      setEditingLeadId(null);

      // Despues de enviar (nuevo o actualización), intentamos traer los datos actualizados de SharePoint
      fetchLeadsData();
      
      setTimeout(() => {
        setShowSuccess(false);
        setScheduledReminder(null);
      }, 5000);

    } catch (error) {
      console.error("Error al procesar:", error);
      addLog(`Fallo al procesar datos: ${error.message}`, 'error');
      alert(`Hubo un error al ${editingLeadId ? 'actualizar' : 'enviar'} los datos. Revisa los logs o la URL.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchLeadsData = async () => {
    if (!paConfig.urlGet) {
      addLog('Error: Intento de cargar datos sin URL GET configurada.', 'error');
      alert("No hay una URL GET de Power Automate configurada. Se mostrarán solo los datos locales.");
      return;
    }

    setIsLoadingData(true);
    addLog('Iniciando carga de datos desde SharePoint (GET)...', 'info');
    try {
      const response = await fetch(paConfig.urlGet);
      const data = await response.json();
      const leads = Array.isArray(data) ? data : (data.value || []); 
      setSavedLeads(leads);
      addLog(`Carga exitosa: Se sincronizaron ${leads.length} registros desde SharePoint.`, 'success');
    } catch (error) {
      console.error("Error al obtener datos:", error);
      addLog(`Fallo al cargar datos: ${error.message}`, 'error');
      alert("Error al obtener los datos de SharePoint/Power Automate.");
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (currentView === 'data' && paConfig.urlGet && savedLeads.length === 0) {
      fetchLeadsData();
    }
  }, [currentView]);

  // --- Funciones para Filtrar y Ordenar ---
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedLeads = useMemo(() => {
    let items = [...savedLeads];

    // Aplicar búsqueda de texto
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      items = items.filter(lead => 
        (lead.titulo || '').toLowerCase().includes(lowerSearch) ||
        (lead.celular || '').includes(searchTerm) ||
        (lead.email || '').toLowerCase().includes(lowerSearch)
      );
    }

    // Aplicar Filtro de Mes
    if (filterMes) {
      items = items.filter(lead => lead.fecha_ingreso && lead.fecha_ingreso.startsWith(filterMes));
    }

    // Aplicar filtros desplegables
    if (filterAsesor) items = items.filter(lead => lead.asesor === filterAsesor);
    if (filterEstado) items = items.filter(lead => lead.estado === filterEstado);
    if (filterFuente) items = items.filter(lead => lead.fuente_medio === filterFuente);
    if (filterCampania) items = items.filter(lead => lead.campania === filterCampania);

    // Aplicar ordenamiento
    if (sortConfig !== null) {
      items.sort((a, b) => {
        let aValue = a[sortConfig.key] || '';
        let bValue = b[sortConfig.key] || '';

        // Manejo especial para números (Tiempo de Respuesta)
        if (sortConfig.key === 'tiempo_respuesta_hrs') {
          aValue = parseFloat(aValue) || 0;
          bValue = parseFloat(bValue) || 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }

    return items;
  }, [savedLeads, searchTerm, filterMes, filterAsesor, filterEstado, filterFuente, filterCampania, sortConfig]);

  // --- LÓGICA DE REPORTES ---
  const reportes = useMemo(() => {
    // Filtramos la lista basándonos en el mes seleccionado antes de calcular KPIs
    let itemsForReports = savedLeads;
    
    // Filtrar por mes (Global compartido con la vista de Datos)
    if (filterMes) {
      itemsForReports = itemsForReports.filter(lead => lead.fecha_ingreso && lead.fecha_ingreso.startsWith(filterMes));
    }
    
    // Filtrar por Calificación (Exclusivo de la vista de Reportes)
    if (reportFilterCalificacion) {
      itemsForReports = itemsForReports.filter(lead => lead.calificacion_lead === reportFilterCalificacion);
    }

    const total = itemsForReports.length;
    if (total === 0) return null;

    let potenciales = 0;
    let calificados = 0;
    let noCalificados = 0;
    let ventasCerradas = 0;
    let organicos = 0;
    let pauta = 0;
    let finDeSemana = 0;
    let fueraHorario = 0;
    const calificacionCount = {};
    const lineasCount = {};

    itemsForReports.forEach(lead => {
      // Calificación y Potenciales
      const calif = lead.calificacion_lead || 'Por evaluar';
      calificacionCount[calif] = (calificacionCount[calif] || 0) + 1;
      
      if (calif === 'Caliente' || calif === 'Tibio') {
        potenciales++;
        calificados++;
      } else {
        noCalificados++;
      }

      // Efectividad (Ventas o Cierres)
      if (lead.estado_orden === 'Cerrada' || lead.accion === 'Venta') {
        ventasCerradas++;
      }

      // Fuente (Orgánico vs Pauta)
      const fuente = (lead.fuente_medio || '').toLowerCase();
      if (fuente.includes('orgánico') || fuente.includes('organico') || fuente.includes('seo') || fuente.includes('directo')) {
        organicos++;
      } else if (fuente) {
        pauta++;
      }

      // Horarios
      if (lead.fecha_ingreso) {
        const fecha = new Date(lead.fecha_ingreso);
        const dia = fecha.getDay(); 
        const hora = fecha.getHours();
        
        if (dia === 0 || dia === 6) {
          finDeSemana++;
        } else if (hora < 8 || hora >= 18) {
          fueraHorario++;
        }
      }

      // Líneas de interés
      const linea = lead.linea_interes || 'No especificada';
      lineasCount[linea] = (lineasCount[linea] || 0) + 1;
    });

    const efectividadPorcentaje = ((ventasCerradas / total) * 100).toFixed(1);

    return {
      total, potenciales, calificados, noCalificados, ventasCerradas, efectividadPorcentaje,
      organicos, pauta, finDeSemana, fueraHorario, calificacionCount, lineasCount
    };
  }, [savedLeads, filterMes, reportFilterCalificacion]);

  // Componente de Formulario (Reutilizado para Nuevo y Edición en Modal)
  const FormFields = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-1">
      {/* Información General */}
      <div className="bg-white p-7 rounded-sm shadow-sm border border-zinc-200 space-y-6">
        <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
          <User className="text-black" size={18} />
          <h2 className="text-sm font-bold tracking-wide text-zinc-800">Información del Lead</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-zinc-600 mb-2">Título / Nombre</label>
            <input type="text" name="titulo" required value={formData.titulo} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white transition-colors" placeholder="Ej. Juan Pérez - Consulta Web" />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-2">Celular</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-zinc-400" size={16} />
              <input type="tel" name="celular" value={formData.celular} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-3 pl-10 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white transition-colors" placeholder="1234567890" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-zinc-400" size={16} />
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-3 pl-10 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white transition-colors" placeholder="correo@ejemplo.com" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-2">Fuente / Medio</label>
            <select name="fuente_medio" value={formData.fuente_medio} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white transition-colors cursor-pointer">
              <option value="">Seleccione...</option>
              {fuentesList.map(fuente => (
                <option key={fuente} value={fuente}>{fuente}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-2">Campaña</label>
            <select name="campania" value={formData.campania} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white transition-colors cursor-pointer">
              <option value="">Seleccione...</option>
              {campaniasList.map(campania => (
                <option key={campania} value={campania}>{campania}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 border-t border-zinc-100 pt-3">
            <label className="block text-xs font-bold text-zinc-600 mb-2">Línea de Interés</label>
            <select name="linea_interes" value={formData.linea_interes} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white transition-colors cursor-pointer">
              <option value="">No especificada</option>
              {lineasList.map(linea => (
                <option key={linea} value={linea}>{linea}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tiempos y Control */}
      <div className="bg-white p-7 rounded-sm shadow-sm border border-zinc-200 space-y-6">
        <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
          <Clock className="text-black" size={18} />
          <h2 className="text-sm font-bold tracking-wide text-zinc-800">Gestión de Tiempos y Asignación</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-2">Fecha Ingreso</label>
            <input type="datetime-local" name="fecha_ingreso" required value={formData.fecha_ingreso} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-2">Fecha Control</label>
            <input type="datetime-local" name="fecha_control" value={formData.fecha_control} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white transition-colors" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-zinc-600 mb-2">Tiempo de Respuesta (Hrs)</label>
            <div className="relative">
              <input type="text" name="tiempo_respuesta_hrs" readOnly value={formData.tiempo_respuesta_hrs} className="w-full rounded-sm border-zinc-300 bg-zinc-100 text-black border p-3 text-sm font-mono font-semibold outline-none" placeholder="0.00" />
              {formData.tiempo_respuesta_hrs && <span className="absolute right-3 top-3.5 text-xs font-bold bg-black text-white px-2 py-0.5 rounded-sm">Auto</span>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-2">Novedad Tiempo</label>
            <select name="novedad_tiempo" value={formData.novedad_tiempo} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white transition-colors cursor-pointer">
              <option value="">Seleccione...</option>
              <option value="Ninguno">Ninguno</option>
              <option value="Fuera de Horario">Fuera de Horario</option>
              <option value="Fin de semana">Fin de semana</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-2">Asesor Asignado</label>
            <select name="asesor" value={formData.asesor} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white transition-colors cursor-pointer">
              <option value="">Seleccionar...</option>
              {asesoresList.map(asesor => <option key={asesor} value={asesor}>{asesor}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Seguimiento y Calificación */}
      <div className="bg-white p-7 rounded-sm shadow-sm border border-zinc-200 space-y-6">
        <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
          <Star className="text-black" size={18} />
          <h2 className="text-sm font-bold tracking-wide text-zinc-800">Calificación y Seguimiento</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-2">Estado</label>
            <select name="estado" value={formData.estado} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white transition-colors cursor-pointer">
              <option>Nuevo</option><option>Contactado</option><option>En Negociación</option><option>Perdido</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-2">Calificación Lead</label>
            <select name="calificacion_lead" value={formData.calificacion_lead} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white transition-colors cursor-pointer">
              <option>Por evaluar</option><option>Frío</option><option>Tibio</option><option>Caliente</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-zinc-600 mb-2">Razón Calificación</label>
            <input type="text" name="razon_calificacion" value={formData.razon_calificacion} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white transition-colors" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-zinc-600 mb-2">Notas de Seguimiento</label>
            <textarea name="notas_seguimiento" rows="2" value={formData.notas_seguimiento} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white transition-colors resize-none"></textarea>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-2">Fecha Act. Nota</label>
            <input type="date" name="fecha_actualizacion_nota" value={formData.fecha_actualizacion_nota} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white transition-colors" />
          </div>
          
          {/* Nueva Programación de Seguimiento por Horas */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 border border-zinc-200 p-5 rounded-sm bg-zinc-50/50 mt-2">
            <div className="sm:col-span-3">
              <label className="block text-[10px] uppercase tracking-widest font-bold text-black border-b border-zinc-200 pb-2 mb-1 flex items-center gap-2">
                 <Clock size={12} /> Programar Próximo Seguimiento
              </label>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Fecha</label>
              <input type="date" name="fecha_seguimiento_dia" value={formData.fecha_seguimiento_dia} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Jornada</label>
              <select name="jornada_seguimiento" value={formData.jornada_seguimiento} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-white transition-colors cursor-pointer">
                <option value="">Seleccione...</option>
                <option value="Mañana">Mañana</option>
                <option value="Tarde">Tarde</option>
                <option value="Noche">Noche</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Hora Exacta</label>
              <input type="time" name="hora_seguimiento" value={formData.hora_seguimiento} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-white transition-colors" />
            </div>
          </div>

          <div className="md:col-span-2 bg-zinc-50 p-4 rounded-sm border border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-2">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="recordatorio" name="programar_recordatorio" checked={formData.programar_recordatorio} onChange={handleChange} className="w-4 h-4 text-black rounded-sm border-zinc-400 focus:ring-black cursor-pointer" />
              <label htmlFor="recordatorio" className="text-sm font-bold text-zinc-700 flex items-center gap-2 cursor-pointer">
                <Bell size={16} className={formData.programar_recordatorio ? "text-black" : "text-zinc-400"} /> 
                Programar recordatorio (1 día antes)
              </label>
            </div>
            {formData.programar_recordatorio && (
              <div className="flex items-center gap-2 sm:border-l border-zinc-300 sm:pl-4">
                <span className="text-xs text-zinc-500 font-bold">Vía:</span>
                <select name="canal_recordatorio" value={formData.canal_recordatorio} onChange={handleChange} className="text-sm rounded-sm border-zinc-300 p-1.5 focus:ring-1 focus:ring-black outline-none bg-white font-bold text-black cursor-pointer">
                  <option value="email">Correo</option><option value="teams">Teams</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cierre e Información de Adjuntos */}
      <div className="bg-white p-7 rounded-sm shadow-sm border border-zinc-200 space-y-6">
        <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
          <CheckCircle className="text-black" size={18} />
          <h2 className="text-sm font-bold tracking-wide text-zinc-800">Cierre y Conclusión</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-2">Acción Requerida</label>
            <select name="accion" value={formData.accion} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white transition-colors cursor-pointer">
              <option value="">Seleccione...</option>
              {accionesList.map(accion => (
                <option key={accion} value={accion}>{accion}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-2">Estado de la Orden</label>
            <select name="estado_orden" value={formData.estado_orden} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white transition-colors cursor-pointer">
              <option value="Abierta">Abierta</option><option value="Cerrada">Cerrada</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-2">Fecha de Cierre</label>
            <input type="datetime-local" name="fecha_cierre" value={formData.fecha_cierre} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-2">Datos Adjuntos Nuevos</label>
            <input type="file" name="datos_adjuntos" multiple onChange={handleFileChange} className="w-full text-sm text-zinc-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-sm file:border file:border-zinc-300 file:text-sm file:font-bold file:bg-zinc-50 file:text-black hover:file:bg-zinc-200 transition cursor-pointer" />
            {formData.datos_adjuntos && formData.datos_adjuntos.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.datos_adjuntos.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-sm p-2.5 text-sm">
                    <span className="truncate max-w-[150px] font-medium text-black">{file.name || 'Archivo adjunto'}</span>
                    <button type="button" onClick={() => removeFile(index)} className="text-zinc-400 hover:text-black transition-colors"><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-zinc-600 mb-2">Observaciones Finales</label>
            <textarea name="observaciones" rows="2" value={formData.observaciones} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white transition-colors resize-none"></textarea>
          </div>
          
          {/* Visualización de Enlace de Archivo Existente (Solo en modo edición) */}
          {editingLeadId && formData.link_adjuntos && (
             <div className="md:col-span-2 bg-blue-50 border border-blue-200 p-4 rounded-sm flex items-start gap-3 mt-2">
                <FileText className="text-blue-500 shrink-0 mt-0.5" size={18} />
                <div>
                   <h4 className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-1">Archivos Previos en SharePoint</h4>
                   <p className="text-sm text-blue-700 mb-2">Este lead ya contiene archivos guardados en el sistema.</p>
                   <a 
                      href={formData.link_adjuntos} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-2 text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-sm hover:bg-blue-700 transition-colors"
                   >
                     Ver Archivos en SharePoint <ExternalLink size={14} />
                   </a>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 p-4 md:p-8 font-sans selection:bg-zinc-300">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header y Navegación Principal */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-6 rounded-sm shadow-sm border border-zinc-200 gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 pr-5 border-r border-zinc-200 h-16">
              <img 
                src="/logo.jpg" 
                alt="Productos Arquitectónicos" 
                className="h-full object-contain"
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.style.display = 'none';
                  const fallback = document.getElementById('fallback-logo');
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div id="fallback-logo" className="hidden flex-col justify-center">
                <h1 className="text-4xl font-black text-black tracking-tighter leading-none">pa</h1>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-black tracking-wide">Embudo Comercial</h2>
              <p className="text-zinc-500 text-sm mt-1">Gestión de Leads</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Pestañas de Navegación */}
            <div className="flex bg-zinc-100 p-1 rounded-sm w-full lg:w-auto border border-zinc-200">
              <button 
                onClick={() => {
                  setCurrentView('form');
                  if(!editingLeadId) setFormData(initialState);
                }}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-sm font-bold text-sm transition-all ${currentView === 'form' ? 'bg-black shadow-sm text-white' : 'text-zinc-500 hover:text-black'}`}
              >
                <FilePlus2 size={16} /> Nuevo
              </button>
              <button 
                onClick={() => setCurrentView('data')}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-sm font-bold text-sm transition-all ${currentView === 'data' ? 'bg-black shadow-sm text-white' : 'text-zinc-500 hover:text-black'}`}
              >
                <TableProperties size={16} /> Datos
              </button>
              <button 
                onClick={() => setCurrentView('reports')}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-sm font-bold text-sm transition-all ${currentView === 'reports' ? 'bg-black shadow-sm text-white' : 'text-zinc-500 hover:text-black'}`}
              >
                <BarChart3 size={16} /> Reportes
              </button>
            </div>

            <div className="flex gap-2 ml-auto lg:ml-0">
              <button 
                type="button"
                onClick={() => setShowLogsModal(true)}
                className="bg-zinc-100 hover:bg-zinc-200 text-black px-4 py-2.5 rounded-sm font-medium border border-zinc-200 transition-colors"
                title="Ver Logs del Sistema"
              >
                <Terminal size={18} />
              </button>
              <button 
                type="button"
                onClick={() => setShowAdminModal(true)}
                className="bg-zinc-100 hover:bg-zinc-200 text-black px-4 py-2.5 rounded-sm font-medium border border-zinc-200 transition-colors"
                title="Configuración"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>
        </header>

        {showSuccess && currentView === 'form' && (
          <div className="space-y-2 animate-in slide-in-from-top-2">
            <div className="bg-black text-white p-4 rounded-sm border-l-4 border-zinc-400 flex items-center gap-3 shadow-lg">
              <CheckCircle size={20} className="text-zinc-300" />
              <span className="text-sm font-medium">
                Lead guardado y enviado a SharePoint exitosamente.
              </span>
            </div>
            {scheduledReminder && (
              <div className="bg-white text-black p-4 rounded-sm border-l-4 border-black flex items-center gap-3 shadow-sm border-y border-r border-zinc-200">
                <Bell size={20} className="text-zinc-500" />
                <span className="text-sm">Recordatorio programado para el <strong>{scheduledReminder.fecha}</strong> vía {scheduledReminder.canal}.</span>
              </div>
            )}
          </div>
        )}

        {/* =========================================
            VISTA 1: FORMULARIO DE REGISTRO NUEVO
        ============================================= */}
        {currentView === 'form' && !showEditModal && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
            <FormFields />
            <div className="flex justify-end items-center gap-4 pt-4 pb-12">
              <button disabled={isSubmitting} type="submit" className="w-full sm:w-auto bg-black hover:bg-zinc-800 disabled:bg-zinc-400 text-white px-10 py-4 rounded-sm font-bold text-sm transition-all flex items-center justify-center gap-3">
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isSubmitting ? 'Guardando...' : 'Guardar Registro'}
              </button>
            </div>
          </form>
        )}

        {/* =========================================
            VISTA 2: BASE DE DATOS (TABLA)
        ============================================= */}
        {currentView === 'data' && (
          <div className="bg-white rounded-sm shadow-sm border border-zinc-200 overflow-hidden flex flex-col animate-in fade-in duration-300">
            <div className="p-6 border-b border-zinc-200 flex flex-col md:flex-row items-start md:items-center justify-between bg-zinc-50/50 gap-4">
              <div className="flex items-center gap-4 min-w-max">
                <Database className="text-black" size={20} />
                <div>
                  <h2 className="text-sm font-bold text-black">Registros Almacenados</h2>
                  <p className="text-sm text-zinc-500 mt-1">Filtrados: {filteredAndSortedLeads.length} / Total: {savedLeads.length}</p>
                </div>
              </div>
              
              {/* Barra de Filtros */}
              <div className="flex flex-wrap items-center gap-3 w-full justify-end">
                <div className="relative flex-1 md:w-48 min-w-[150px]">
                  <Search className="absolute left-3 top-3 text-zinc-400" size={16} />
                  <input type="text" placeholder="Buscar lead, correo, cel..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 p-2.5 text-xs font-medium border border-zinc-300 rounded-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition-all" />
                </div>

                {/* Filtro de Mes Integrado */}
                <div className="flex items-center gap-1 border border-zinc-300 rounded-sm bg-white px-2 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
                  <input 
                    type="month" 
                    value={filterMes} 
                    onChange={e => setFilterMes(e.target.value)} 
                    className="p-2 text-xs font-medium outline-none bg-transparent text-zinc-700 cursor-pointer"
                    title="Filtrar por Mes"
                  />
                  {filterMes && (
                    <button onClick={() => setFilterMes('')} className="text-zinc-400 hover:text-red-500 p-1" title="Limpiar mes">
                      <X size={14} />
                    </button>
                  )}
                </div>

                <select value={filterFuente} onChange={e => setFilterFuente(e.target.value)} className="p-2.5 text-xs font-medium border border-zinc-300 rounded-sm focus:border-black outline-none cursor-pointer bg-white">
                  <option value="">Todas las fuentes</option>
                  {fuentesList.map(f => <option key={f} value={f}>{f}</option>)}
                </select>

                <select value={filterCampania} onChange={e => setFilterCampania(e.target.value)} className="p-2.5 text-xs font-medium border border-zinc-300 rounded-sm focus:border-black outline-none cursor-pointer bg-white">
                  <option value="">Todas las campañas</option>
                  {campaniasList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select value={filterAsesor} onChange={e => setFilterAsesor(e.target.value)} className="p-2.5 text-xs font-medium border border-zinc-300 rounded-sm focus:border-black outline-none cursor-pointer bg-white">
                  <option value="">Todos los asesores</option>
                  {asesoresList.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="p-2.5 text-xs font-medium border border-zinc-300 rounded-sm focus:border-black outline-none cursor-pointer bg-white">
                  <option value="">Todos los estados</option>
                  <option value="Nuevo">Nuevo</option>
                  <option value="Contactado">Contactado</option>
                  <option value="En Negociación">En Negociación</option>
                  <option value="Perdido">Perdido</option>
                  <option value="Cerrado">Cerrado</option>
                </select>
                <button 
                  onClick={fetchLeadsData}
                  disabled={isLoadingData}
                  className="bg-white border border-zinc-200 hover:border-black text-black px-4 py-2.5 rounded-sm font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                  title="Traer datos de SharePoint"
                >
                  <RefreshCw size={14} className={isLoadingData ? "animate-spin" : ""} />
                  <span className="hidden sm:inline">Actualizar</span>
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[1600px]">
                <thead>
                  <tr className="bg-black text-white text-[10px] tracking-widest uppercase border-b border-black">
                    <th className="p-4 font-bold cursor-pointer hover:bg-zinc-800 transition-colors group" onClick={() => requestSort('titulo')}>
                      <div className="flex items-center gap-2">Título / Nombre {sortConfig?.key === 'titulo' ? (sortConfig.direction === 'ascending' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : <span className="opacity-0 group-hover:opacity-50 transition-opacity"><ChevronUp size={14}/></span>}</div>
                    </th>
                    <th className="p-4 font-bold cursor-pointer hover:bg-zinc-800 transition-colors group" onClick={() => requestSort('fecha_ingreso')}>
                      <div className="flex items-center gap-2">Fecha Ingreso {sortConfig?.key === 'fecha_ingreso' ? (sortConfig.direction === 'ascending' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : <span className="opacity-0 group-hover:opacity-50 transition-opacity"><ChevronUp size={14}/></span>}</div>
                    </th>
                    <th className="p-4 font-bold cursor-pointer hover:bg-zinc-800 transition-colors group" onClick={() => requestSort('asesor')}>
                      <div className="flex items-center gap-2">Asesor {sortConfig?.key === 'asesor' ? (sortConfig.direction === 'ascending' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : <span className="opacity-0 group-hover:opacity-50 transition-opacity"><ChevronUp size={14}/></span>}</div>
                    </th>
                    <th className="p-4 font-bold cursor-pointer hover:bg-zinc-800 transition-colors group" onClick={() => requestSort('linea_interes')}>
                      <div className="flex items-center gap-2">Línea Interés {sortConfig?.key === 'linea_interes' ? (sortConfig.direction === 'ascending' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : <span className="opacity-0 group-hover:opacity-50 transition-opacity"><ChevronUp size={14}/></span>}</div>
                    </th>
                    <th className="p-4 font-bold cursor-pointer hover:bg-zinc-800 transition-colors group" onClick={() => requestSort('fuente_medio')}>
                      <div className="flex items-center gap-2">Fuente/Medio {sortConfig?.key === 'fuente_medio' ? (sortConfig.direction === 'ascending' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : <span className="opacity-0 group-hover:opacity-50 transition-opacity"><ChevronUp size={14}/></span>}</div>
                    </th>
                    <th className="p-4 font-bold cursor-pointer hover:bg-zinc-800 transition-colors group" onClick={() => requestSort('campania')}>
                      <div className="flex items-center gap-2">Campaña {sortConfig?.key === 'campania' ? (sortConfig.direction === 'ascending' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : <span className="opacity-0 group-hover:opacity-50 transition-opacity"><ChevronUp size={14}/></span>}</div>
                    </th>
                    <th className="p-4 font-bold cursor-pointer hover:bg-zinc-800 transition-colors group" onClick={() => requestSort('estado')}>
                      <div className="flex items-center gap-2">Estado {sortConfig?.key === 'estado' ? (sortConfig.direction === 'ascending' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : <span className="opacity-0 group-hover:opacity-50 transition-opacity"><ChevronUp size={14}/></span>}</div>
                    </th>
                    <th className="p-4 font-bold cursor-pointer hover:bg-zinc-800 transition-colors group" onClick={() => requestSort('calificacion_lead')}>
                      <div className="flex items-center gap-2">Calificación {sortConfig?.key === 'calificacion_lead' ? (sortConfig.direction === 'ascending' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : <span className="opacity-0 group-hover:opacity-50 transition-opacity"><ChevronUp size={14}/></span>}</div>
                    </th>
                    <th className="p-4 font-bold">Notas</th>
                    <th className="p-4 font-bold cursor-pointer hover:bg-zinc-800 transition-colors group" onClick={() => requestSort('estado_orden')}>
                      <div className="flex items-center gap-2">Estado Orden {sortConfig?.key === 'estado_orden' ? (sortConfig.direction === 'ascending' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : <span className="opacity-0 group-hover:opacity-50 transition-opacity"><ChevronUp size={14}/></span>}</div>
                    </th>
                    <th className="p-4 font-bold text-center cursor-pointer hover:bg-zinc-800 transition-colors group" onClick={() => requestSort('tiempo_respuesta_hrs')}>
                      <div className="flex items-center justify-center gap-2">T. Resp {sortConfig?.key === 'tiempo_respuesta_hrs' ? (sortConfig.direction === 'ascending' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : <span className="opacity-0 group-hover:opacity-50 transition-opacity"><ChevronUp size={14}/></span>}</div>
                    </th>
                    <th className="p-4 font-bold text-center">Adjuntos</th>
                    <th className="p-4 font-bold text-center bg-zinc-900 border-l border-zinc-800">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredAndSortedLeads.length === 0 ? (
                    <tr>
                      <td colSpan="13" className="p-16 text-center text-zinc-500 text-sm">
                        {isLoadingData ? 'Cargando datos desde SharePoint...' : searchTerm || filterAsesor || filterEstado || filterMes || filterFuente || filterCampania ? 'No se encontraron resultados para los filtros actuales.' : 'No hay datos registrados. Haz clic en "Actualizar" para traerlos de SharePoint.'}
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedLeads.map((lead, index) => (
                      <tr key={lead.id || index} className="hover:bg-zinc-50 transition-colors group text-sm text-zinc-700">
                        <td className="p-4 font-bold text-black">{lead.titulo || '-'}</td>
                        <td className="p-4">{lead.fecha_ingreso ? new Date(lead.fecha_ingreso).toLocaleString([],{dateStyle:'short', timeStyle:'short'}) : '-'}</td>
                        <td className="p-4">{lead.asesor || '-'}</td>
                        <td className="p-4">{lead.linea_interes || '-'}</td>
                        <td className="p-4 text-xs font-bold text-zinc-500">{lead.fuente_medio || '-'}</td>
                        <td className="p-4 text-xs font-bold text-zinc-500">{lead.campania || '-'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-sm text-xs font-bold border ${
                            lead.estado === 'Nuevo' ? 'bg-zinc-100 text-zinc-800 border-zinc-300' : 
                            lead.estado === 'Perdido' ? 'bg-zinc-100 text-zinc-400 border-zinc-200 line-through' : 'bg-white text-black border-zinc-300'
                          }`}>
                            {lead.estado || 'Nuevo'}
                          </span>
                        </td>
                        <td className="p-4">{lead.calificacion_lead || '-'}</td>
                        <td className="p-4 max-w-[200px] truncate" title={lead.notas_seguimiento}>
                          {lead.notas_seguimiento || '-'}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${
                            lead.estado_orden === 'Cerrada' ? 'bg-black text-white border-black' : 'bg-white text-black border-zinc-300'
                          }`}>
                            {lead.estado_orden || '-'}
                          </span>
                        </td>
                        <td className="p-4 text-center font-mono font-medium">{lead.tiempo_respuesta_hrs || '-'} h</td>
                        <td className="p-4 text-center">
                          {lead.link_adjuntos ? (
                            <a href={lead.link_adjuntos} target="_blank" rel="noopener noreferrer" className="text-black font-bold text-[10px] uppercase tracking-wider underline hover:text-zinc-600 transition-colors">
                              🔗 Ver Enlace
                            </a>
                          ) : lead.datos_adjuntos && lead.datos_adjuntos.length > 0 ? (
                            <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider" title={lead.datos_adjuntos.map(f => f.name || 'Archivo').join(', ')}>
                              {lead.datos_adjuntos.length} Archivo(s)
                            </span>
                          ) : (
                            <span className="text-zinc-400">-</span>
                          )}
                        </td>
                        <td className="p-4 text-center border-l border-zinc-200 bg-zinc-50 group-hover:bg-zinc-100 transition-colors">
                          <button 
                            onClick={() => handleEditLead(lead)} 
                            className="p-2 text-zinc-500 hover:text-black hover:bg-white border border-transparent hover:border-zinc-300 hover:shadow-sm rounded-sm transition-all flex items-center justify-center gap-2 mx-auto"
                            title="Editar Registro"
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================
            MODAL DE EDICIÓN FLOTANTE
        ============================================= */}
        {showEditModal && editingLeadId && (
           <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
             <div className="bg-zinc-100 rounded-sm w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] border border-zinc-300 animate-in zoom-in-95 duration-200">
                {/* Header del Modal */}
                <div className="bg-black text-white p-5 flex items-center justify-between shrink-0">
                   <div className="flex items-center gap-3">
                     <Edit2 size={20} className="text-zinc-300" />
                     <div>
                       <h3 className="text-sm font-bold uppercase tracking-wider">Modificando Registro</h3>
                       <p className="text-xs text-zinc-400 font-mono mt-0.5">ID: {editingLeadId}</p>
                     </div>
                   </div>
                   <button onClick={handleCancelEdit} className="text-zinc-400 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-sm"><X size={18} /></button>
                </div>
                
                {/* Cuerpo del Formulario en el Modal */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                   <form id="editForm" onSubmit={handleSubmit} className="space-y-6">
                      <FormFields />
                   </form>
                </div>

                {/* Footer del Modal */}
                <div className="bg-white border-t border-zinc-200 p-5 flex justify-end items-center gap-4 shrink-0">
                  <button type="button" onClick={handleCancelEdit} disabled={isSubmitting} className="bg-zinc-100 hover:bg-zinc-200 text-black px-6 py-3 rounded-sm font-bold text-sm transition-colors">
                    Cancelar
                  </button>
                  <button form="editForm" disabled={isSubmitting} type="submit" className="bg-black hover:bg-zinc-800 disabled:bg-zinc-400 text-white px-8 py-3 rounded-sm font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-sm">
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {isSubmitting ? 'Guardando en SharePoint...' : 'Actualizar en SharePoint'}
                  </button>
                </div>
             </div>
           </div>
        )}

        {/* =========================================
            VISTA 3: REPORTES Y MÉTRICAS
        ============================================= */}
        {currentView === 'reports' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header de Reportes y Filtros */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-sm shadow-sm border border-zinc-200">
               <h2 className="text-sm font-bold text-black uppercase tracking-widest flex items-center gap-2">
                 <BarChart3 size={18}/> Panel de Métricas
               </h2>
               
               <div className="flex flex-wrap items-center gap-4">
                 {/* Filtro Mes (Global) */}
                 <div className="flex items-center gap-2">
                   <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest hidden sm:block">Mes:</label>
                   <div className="flex items-center gap-1 border border-zinc-300 rounded-sm bg-zinc-50 px-2 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
                     <input 
                        type="month" 
                        value={filterMes} 
                        onChange={e => setFilterMes(e.target.value)} 
                        className="p-2 text-xs font-medium outline-none bg-transparent cursor-pointer"
                      />
                      {filterMes && (
                        <button onClick={() => setFilterMes('')} className="text-zinc-400 hover:text-red-500 p-1" title="Limpiar filtro">
                          <X size={14}/>
                        </button>
                      )}
                   </div>
                 </div>

                 {/* Filtro Calificación (Solo Reportes) */}
                 <div className="flex items-center gap-2 border-l border-zinc-200 pl-4">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest hidden sm:block">Calificación:</label>
                    <select
                      value={reportFilterCalificacion}
                      onChange={e => setReportFilterCalificacion(e.target.value)}
                      className="p-2.5 text-xs font-medium border border-zinc-300 rounded-sm focus:border-black outline-none cursor-pointer bg-zinc-50 transition-all"
                    >
                      <option value="">Todas</option>
                      <option value="Por evaluar">Por evaluar</option>
                      <option value="Frío">Frío</option>
                      <option value="Tibio">Tibio</option>
                      <option value="Caliente">Caliente</option>
                    </select>
                 </div>
               </div>
            </div>

            {!reportes ? (
               <div className="bg-white p-12 text-center rounded-sm shadow-sm border border-zinc-200">
                  <BarChart3 size={48} className="mx-auto text-zinc-300 mb-4" />
                  <h3 className="text-lg font-bold text-black mb-2">Sin datos para mostrar</h3>
                  <p className="text-sm text-zinc-500">
                    {filterMes || reportFilterCalificacion ? `No hay registros que coincidan con los filtros actuales.` : 'Agrega registros en la pestaña "Nuevo" o actualiza la Base de Datos.'}
                  </p>
               </div>
            ) : (
              <>
                {/* Tarjetas Principales (KPIs) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-black text-white p-6 rounded-sm shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Leads</h3>
                      <ListPlus size={18} className="text-zinc-300" />
                    </div>
                    <p className="text-4xl font-black">{reportes.total}</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-sm shadow-sm border border-zinc-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Efectividad (Cierres)</h3>
                      <TrendingUp size={18} className="text-black" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl font-black text-black">{reportes.efectividadPorcentaje}%</p>
                      <span className="text-sm text-zinc-500 font-medium">({reportes.ventasCerradas} ventas)</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-sm shadow-sm border border-zinc-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Potenciales Clientes</h3>
                      <Target size={18} className="text-black" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl font-black text-black">{reportes.potenciales}</p>
                      <span className="text-xs text-zinc-500 font-bold uppercase">Tibios/Calientes</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-sm shadow-sm border border-zinc-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Calificados</h3>
                      <Star size={18} className="text-black" />
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-2xl font-black text-black">{reportes.calificados}</p>
                        <p className="text-[10px] uppercase font-bold text-zinc-400">Sí calificados</p>
                      </div>
                      <div className="w-px h-8 bg-zinc-200"></div>
                      <div>
                        <p className="text-2xl font-black text-zinc-400">{reportes.noCalificados}</p>
                        <p className="text-[10px] uppercase font-bold text-zinc-400">No calificados</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Desglose de Calificación */}
                  <div className="bg-white p-6 rounded-sm shadow-sm border border-zinc-200">
                    <h3 className="text-sm font-bold text-black uppercase tracking-wide mb-6 border-b border-zinc-100 pb-3">Desglose por Calificación</h3>
                    <div className="space-y-4">
                      {['Caliente', 'Tibio', 'Frío', 'Por evaluar'].map(cat => {
                        const count = reportes.calificacionCount[cat] || 0;
                        const percent = reportes.total > 0 ? (count / reportes.total) * 100 : 0;
                        return (
                          <div key={cat}>
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span className="text-zinc-700">{cat}</span>
                              <span className="text-black">{count} ({percent.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full bg-zinc-100 h-2 rounded-sm overflow-hidden">
                              <div className={`h-full rounded-sm ${cat === 'Caliente' ? 'bg-black' : cat === 'Tibio' ? 'bg-zinc-600' : 'bg-zinc-300'}`} style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Origen del Lead */}
                  <div className="bg-white p-6 rounded-sm shadow-sm border border-zinc-200">
                    <h3 className="text-sm font-bold text-black uppercase tracking-wide mb-6 border-b border-zinc-100 pb-3">Origen de Captación</h3>
                    <div className="flex items-center justify-center gap-12 h-32">
                      <div className="text-center">
                        <p className="text-4xl font-black text-black">{reportes.organicos}</p>
                        <p className="text-xs font-bold text-zinc-500 uppercase mt-2 tracking-wider">Orgánico / SEO</p>
                      </div>
                      <div className="w-px h-16 bg-zinc-200"></div>
                      <div className="text-center">
                        <p className="text-4xl font-black text-zinc-500">{reportes.pauta}</p>
                        <p className="text-xs font-bold text-zinc-400 uppercase mt-2 tracking-wider">Pauta / Pago</p>
                      </div>
                    </div>
                  </div>

                  {/* Horarios de Ingreso */}
                  <div className="bg-white p-6 rounded-sm shadow-sm border border-zinc-200">
                    <h3 className="text-sm font-bold text-black uppercase tracking-wide mb-6 border-b border-zinc-100 pb-3 flex items-center gap-2">
                       Tiempos de Ingreso
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-50 p-4 rounded-sm border border-zinc-200 flex flex-col items-center text-center">
                        <Moon size={24} className="text-zinc-400 mb-2" />
                        <p className="text-3xl font-black text-black">{reportes.fueraHorario}</p>
                        <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wide mt-1">Fuera de Horario Laboral</p>
                        <p className="text-[10px] text-zinc-400 mt-1">(Antes 8am / Desp 6pm)</p>
                      </div>
                      <div className="bg-zinc-50 p-4 rounded-sm border border-zinc-200 flex flex-col items-center text-center">
                        <CalendarX size={24} className="text-zinc-400 mb-2" />
                        <p className="text-3xl font-black text-black">{reportes.finDeSemana}</p>
                        <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wide mt-1">Ingresaron en Fin de Semana</p>
                        <p className="text-[10px] text-zinc-400 mt-1">(Sábados y Domingos)</p>
                      </div>
                    </div>
                  </div>

                  {/* Líneas de Interés */}
                  <div className="bg-white p-6 rounded-sm shadow-sm border border-zinc-200">
                    <h3 className="text-sm font-bold text-black uppercase tracking-wide mb-6 border-b border-zinc-100 pb-3">Líneas de Interés Solicitadas</h3>
                    <div className="space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {Object.entries(reportes.lineasCount).sort((a,b) => b[1] - a[1]).map(([linea, count]) => {
                        const percent = reportes.total > 0 ? (count / reportes.total) * 100 : 0;
                        return (
                          <div key={linea}>
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span className="text-zinc-700">{linea}</span>
                              <span className="text-black">{count}</span>
                            </div>
                            <div className="w-full bg-zinc-100 h-2 rounded-sm overflow-hidden">
                              <div className="h-full rounded-sm bg-black" style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* =========================================
            MODAL DE LOGS (NUEVO)
        ============================================= */}
        {showLogsModal && (
          <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-sm w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200 flex flex-col max-h-[80vh]">
               <div className="p-5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-black flex items-center gap-2 uppercase tracking-widest">
                    <Terminal size={18} /> Logs del Sistema
                  </h3>
                  <button onClick={() => setShowLogsModal(false)} className="text-zinc-400 hover:text-black transition-colors"><X size={18} /></button>
               </div>
               <div className="p-5 overflow-y-auto flex-1 bg-[#1E1E1E] text-zinc-300 font-mono text-xs custom-scrollbar">
                  {appLogs.length === 0 ? (
                     <p className="text-zinc-500">No hay registros en la sesión actual.</p>
                  ) : (
                     <div className="space-y-2">
                        {appLogs.map((log, i) => (
                           <div key={i} className="flex gap-4 border-b border-zinc-800 pb-2">
                              <span className="text-zinc-500 shrink-0">[{log.time}]</span>
                              <span className={`shrink-0 font-bold ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-emerald-400' : log.type === 'warning' ? 'text-amber-400' : 'text-blue-300'}`}>
                                 {log.type.toUpperCase().padEnd(7)}
                              </span>
                              <span className="text-zinc-200">{log.message}</span>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>
          </div>
        )}

        {/* =========================================
            MODAL DE ADMINISTRACIÓN (Asesores, Líneas, Acciones & API)
        ============================================= */}
        {showAdminModal && (
          <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-sm w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200 flex flex-col max-h-[85vh]">
              
              <div className="flex border-b border-zinc-200 bg-zinc-50 relative">
                <div className="flex flex-1 overflow-x-auto custom-scrollbar">
                  <button 
                    onClick={() => setAdminTab('asesores')}
                    className={`whitespace-nowrap flex-1 p-4 text-xs font-bold border-b-2 transition-colors ${adminTab === 'asesores' ? 'border-black text-black bg-white' : 'border-transparent text-zinc-400 hover:text-black'}`}
                  >
                    Asesores
                  </button>
                  <button 
                    onClick={() => setAdminTab('lineas')}
                    className={`whitespace-nowrap flex-1 p-4 text-xs font-bold border-b-2 transition-colors ${adminTab === 'lineas' ? 'border-black text-black bg-white' : 'border-transparent text-zinc-400 hover:text-black'}`}
                  >
                    Líneas de Interés
                  </button>
                  <button 
                    onClick={() => setAdminTab('acciones')}
                    className={`whitespace-nowrap flex-1 p-4 text-xs font-bold border-b-2 transition-colors ${adminTab === 'acciones' ? 'border-black text-black bg-white' : 'border-transparent text-zinc-400 hover:text-black'}`}
                  >
                    Acciones
                  </button>
                  <button 
                    onClick={() => setAdminTab('fuentes')}
                    className={`whitespace-nowrap flex-1 p-4 text-xs font-bold border-b-2 transition-colors ${adminTab === 'fuentes' ? 'border-black text-black bg-white' : 'border-transparent text-zinc-400 hover:text-black'}`}
                  >
                    Fuentes
                  </button>
                  <button 
                    onClick={() => setAdminTab('campanias')}
                    className={`whitespace-nowrap flex-1 p-4 text-xs font-bold border-b-2 transition-colors ${adminTab === 'campanias' ? 'border-black text-black bg-white' : 'border-transparent text-zinc-400 hover:text-black'}`}
                  >
                    Campañas
                  </button>
                  <button 
                    onClick={() => setAdminTab('integracion')}
                    className={`whitespace-nowrap flex-1 p-4 text-xs font-bold border-b-2 transition-colors ${adminTab === 'integracion' ? 'border-black text-black bg-white' : 'border-transparent text-zinc-400 hover:text-black'}`}
                  >
                    Integración (SP)
                  </button>
                </div>
                
                {/* Botón de Cerrar Fijo */}
                <button 
                  onClick={() => setShowAdminModal(false)} 
                  className="p-4 text-zinc-500 hover:text-black transition-colors bg-white border-l border-zinc-200 shrink-0 z-10 drop-shadow-sm"
                  title="Cerrar (ESC)"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-7 overflow-y-auto flex-1 custom-scrollbar">
                {/* TAB ASESORES */}
                {adminTab === 'asesores' && (
                  <div className="animate-in fade-in">
                    <div className="flex gap-3 mb-6">
                      <input 
                        type="text" value={newAsesorName} onChange={(e) => setNewAsesorName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddAsesor()}
                        placeholder="Nombre del asesor..."
                        className="flex-1 rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white"
                      />
                      <button onClick={handleAddAsesor} disabled={!newAsesorName.trim()} className="bg-black hover:bg-zinc-800 disabled:bg-zinc-300 text-white px-5 py-3 rounded-sm font-bold text-sm transition-colors flex items-center gap-2">
                        <UserPlus size={16} /> Agregar
                      </button>
                    </div>
                    <div className="space-y-2 pr-2">
                      {asesoresList.map(asesor => (
                        <div key={asesor} className="flex items-center justify-between bg-white border border-zinc-200 p-3.5 rounded-sm hover:border-black transition-colors">
                          <span className="text-sm font-bold text-black">{asesor}</span>
                          <button onClick={() => handleRemoveAsesor(asesor)} className="text-zinc-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB LÍNEAS DE INTERÉS */}
                {adminTab === 'lineas' && (
                  <div className="animate-in fade-in">
                    <div className="flex gap-3 mb-6">
                      <input 
                        type="text" value={newLineaName} onChange={(e) => setNewLineaName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddLinea()}
                        placeholder="Nueva línea de interés..."
                        className="flex-1 rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white"
                      />
                      <button onClick={handleAddLinea} disabled={!newLineaName.trim()} className="bg-black hover:bg-zinc-800 disabled:bg-zinc-300 text-white px-5 py-3 rounded-sm font-bold text-sm transition-colors flex items-center gap-2">
                        <Layers size={16} /> Agregar
                      </button>
                    </div>
                    <div className="space-y-2 pr-2">
                      {lineasList.map(linea => (
                        <div key={linea} className="flex items-center justify-between bg-white border border-zinc-200 p-3.5 rounded-sm hover:border-black transition-colors">
                          <span className="text-sm font-bold text-black">{linea}</span>
                          <button onClick={() => handleRemoveLinea(linea)} className="text-zinc-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB ACCIONES */}
                {adminTab === 'acciones' && (
                  <div className="animate-in fade-in">
                    <div className="flex gap-3 mb-6">
                      <input 
                        type="text" value={newAccionName} onChange={(e) => setNewAccionName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddAccion()}
                        placeholder="Nueva acción requerida..."
                        className="flex-1 rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white"
                      />
                      <button onClick={handleAddAccion} disabled={!newAccionName.trim()} className="bg-black hover:bg-zinc-800 disabled:bg-zinc-300 text-white px-5 py-3 rounded-sm font-bold text-sm transition-colors flex items-center gap-2">
                        <Activity size={16} /> Agregar
                      </button>
                    </div>
                    <div className="space-y-2 pr-2">
                      {accionesList.map(accion => (
                        <div key={accion} className="flex items-center justify-between bg-white border border-zinc-200 p-3.5 rounded-sm hover:border-black transition-colors">
                          <span className="text-sm font-bold text-black">{accion}</span>
                          <button onClick={() => handleRemoveAccion(accion)} className="text-zinc-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB FUENTES */}
                {adminTab === 'fuentes' && (
                  <div className="animate-in fade-in">
                    <div className="flex gap-3 mb-6">
                      <input 
                        type="text" value={newFuenteName} onChange={(e) => setNewFuenteName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddFuente()}
                        placeholder="Nueva fuente (Ej. GOOGLE PAID)..."
                        className="flex-1 rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white"
                      />
                      <button onClick={handleAddFuente} disabled={!newFuenteName.trim()} className="bg-black hover:bg-zinc-800 disabled:bg-zinc-300 text-white px-5 py-3 rounded-sm font-bold text-sm transition-colors flex items-center gap-2">
                        <Globe size={16} /> Agregar
                      </button>
                    </div>
                    <div className="space-y-2 pr-2">
                      {fuentesList.map(fuente => (
                        <div key={fuente} className="flex items-center justify-between bg-white border border-zinc-200 p-3.5 rounded-sm hover:border-black transition-colors">
                          <span className="text-sm font-bold text-black">{fuente}</span>
                          <button onClick={() => handleRemoveFuente(fuente)} className="text-zinc-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB CAMPAÑAS */}
                {adminTab === 'campanias' && (
                  <div className="animate-in fade-in">
                    <div className="flex gap-3 mb-6">
                      <input 
                        type="text" value={newCampaniaName} onChange={(e) => setNewCampaniaName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCampania()}
                        placeholder="Nueva campaña..."
                        className="flex-1 rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white"
                      />
                      <button onClick={handleAddCampania} disabled={!newCampaniaName.trim()} className="bg-black hover:bg-zinc-800 disabled:bg-zinc-300 text-white px-5 py-3 rounded-sm font-bold text-sm transition-colors flex items-center gap-2">
                        <Megaphone size={16} /> Agregar
                      </button>
                    </div>
                    <div className="space-y-2 pr-2">
                      {campaniasList.map(campania => (
                        <div key={campania} className="flex items-center justify-between bg-white border border-zinc-200 p-3.5 rounded-sm hover:border-black transition-colors">
                          <span className="text-sm font-bold text-black">{campania}</span>
                          <button onClick={() => handleRemoveCampania(campania)} className="text-zinc-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB INTEGRACIÓN */}
                {adminTab === 'integracion' && (
                  <div className="animate-in fade-in space-y-5">
                    <p className="text-sm text-zinc-500 leading-relaxed">
                      Configura los Webhooks HTTP de tus flujos de Power Automate para conectar esta interfaz con tu lista de SharePoint.
                    </p>
                    
                    <div>
                      <label className="block text-xs font-bold text-black mb-2">URL POST (Crear Datos)</label>
                      <input 
                        type="url" name="urlPost" value={paConfig.urlPost} onChange={handleConfigChange}
                        className="w-full rounded-sm border-zinc-300 border p-3 focus:ring-1 focus:ring-black outline-none font-mono text-xs bg-zinc-50 focus:bg-white" 
                        placeholder="https://prod-12.powerautomate.com/..." 
                      />
                    </div>

                    <div className="pt-2">
                      <label className="block text-xs font-bold text-black mb-2">URL GET (Obtener Datos)</label>
                      <input 
                        type="url" name="urlGet" value={paConfig.urlGet} onChange={handleConfigChange}
                        className="w-full rounded-sm border-zinc-300 border p-3 focus:ring-1 focus:ring-black outline-none font-mono text-xs bg-zinc-50 focus:bg-white" 
                        placeholder="https://prod-12.powerautomate.com/..." 
                      />
                    </div>

                    <div className="pt-2">
                      <label className="block text-xs font-bold text-black mb-2">URL ACTUALIZAR (Opcional - Modificar Datos)</label>
                      <input 
                        type="url" name="urlPut" value={paConfig.urlPut} onChange={handleConfigChange}
                        className="w-full rounded-sm border-zinc-300 border p-3 focus:ring-1 focus:ring-black outline-none font-mono text-xs bg-zinc-50 focus:bg-white" 
                        placeholder="Dejar vacío si no usas flujo de actualización" 
                      />
                    </div>

                    <div className="flex items-center gap-4 mt-4 pt-2">
                      <button 
                        onClick={handleSaveConfig}
                        className="bg-black hover:bg-zinc-800 text-white px-6 py-3 rounded-sm font-bold text-sm transition-colors flex items-center gap-2"
                      >
                        <Save size={16} /> Guardar URLs
                      </button>
                      {saveConfigSuccess && (
                        <span className="text-sm font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                          <CheckCircle size={16} /> Guardado exitosamente
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}