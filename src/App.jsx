import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Save, Clock, User, Phone, Mail, FileText, 
  CheckCircle, Briefcase, ListPlus, 
  Star, Bell, X, Settings, Trash2, UserPlus,
  TableProperties, FilePlus2, RefreshCw, Loader2, Database,
  BarChart3, Target, TrendingUp, CalendarX, Moon, Layers, Activity,
  Search, Filter, ChevronUp, ChevronDown, Terminal, Edit2, Megaphone, Globe, ExternalLink, Link as LinkIcon, Download,
  LogIn, LogOut, UserX
} from 'lucide-react';

import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider, useMsal, useIsAuthenticated } from '@azure/msal-react';

// ============================================================================
// OBTENCIÓN SEGURA DE VARIABLES DE ENTORNO
// ============================================================================
const getEnvVar = (envName, fallback = "") => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[envName]) {
      return process.env[envName];
    }
  } catch (error) { }
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[envName]) {
      return import.meta.env[envName];
    }
  } catch (error) { }
  return fallback;
};

// Azure AD
const AZURE_CLIENT_ID = getEnvVar('VITE_AZURE_CLIENT_ID');
const AZURE_TENANT_ID = getEnvVar('VITE_AZURE_TENANT_ID');

// Power Automate (Con URLs por defecto para la vista previa)
const URL_DATOS = getEnvVar('VITE_PoAu_URL_EMBUDOCOM_DATOS');
const URL_CONFIG = getEnvVar('VITE_PoAu_URL_EMBUDOCOM_CONFIG');

// ============================================================================
// CONFIGURACIÓN DE MICROSOFT AZURE AD (ENTRA ID)
// ============================================================================
const msalConfig = {
  auth: {
    clientId: AZURE_CLIENT_ID || "CLIENT_ID_NO_CONFIGURADO",
    authority: `https://login.microsoftonline.com/${AZURE_TENANT_ID}`, 
    redirectUri: typeof window !== "undefined" ? window.location.origin : "/",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  }
};

// ============================================================================
const msalInstance = new PublicClientApplication(msalConfig);

// ==========================================
// ESQUEMA BASE VACÍO (PREVIENE ERROR 400 EN PA)
// ==========================================
const getBasePayload = () => ({
  titulo: "", email: "", fecha_ingreso: "", fecha_control: "",
  tiempo_respuesta_hrs: "", novedad_tiempo: "", fuente_medio: "", campania: "",
  celular: "", linea_interes: "", estado: "", asesor: "", calificacion_lead: "",
  razon_calificacion: "", notas_seguimiento: "", fecha_actualizacion_nota: "",
  fecha_seguimiento_dia: "", jornada_seguimiento: "", hora_seguimiento: "",
  accion: "", estado_orden: "", fecha_cierre: "", observaciones: "",
  programar_recordatorio: false, canal_recordatorio: "", email_asesor: "",
  fecha_registro_sistema: ""
});

// ==========================================
// COMPONENTE DE LOGIN
// ==========================================
function PantallaLoginMS() {
  const { instance } = useMsal();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLoginClick = () => {
    setIsLoggingIn(true);
    if (typeof instance.loginRedirect === 'function') {
      instance.loginRedirect({ scopes: ["user.read"] }).catch(e => {
        console.error(e);
        setIsLoggingIn(false);
      });
    } else if (typeof instance.loginPopup === 'function') {
      instance.loginPopup({ scopes: ["user.read"] }).catch(e => {
        console.error(e);
        setIsLoggingIn(false);
      });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-zinc-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

      <div className="bg-white p-10 rounded-sm shadow-xl border border-zinc-200 max-w-md w-full text-center flex flex-col items-center z-10 animate-in zoom-in-95 duration-500">
        <div className="h-24 mb-6 flex items-center justify-center">
          <img 
            src="/logo.jpg" 
            alt="Logo" 
            className="h-full object-contain"
            onError={(e) => {
              e.target.onerror = null; 
              e.target.style.display = 'none';
              const fallback = document.getElementById('fallback-login-logo');
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div id="fallback-login-logo" className="hidden w-20 h-20 bg-black rounded-sm flex-col items-center justify-center shadow-md">
            <span className="text-4xl font-black text-white tracking-tighter leading-none">pa</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-black mb-2">Embudo Comercial</h1>
        <p className="text-zinc-500 text-sm mb-8 leading-relaxed font-medium">
          Inicia sesión con tu cuenta corporativa de Microsoft para acceder a la gestión de leads.
        </p>
        <button 
          onClick={handleLoginClick}
          disabled={isLoggingIn}
          className="w-full bg-[#00A4EF] hover:bg-[#008bc9] disabled:bg-zinc-400 text-white px-6 py-4 rounded-sm font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-md"
        >
          {isLoggingIn ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
          {isLoggingIn ? 'Conectando...' : 'Iniciar sesión con Microsoft'}
        </button>
        <p className="text-xs text-zinc-400 font-semibold mt-6 px-4">
          El acceso está restringido al directorio activo corporativo (Azure AD).
        </p>
      </div>
    </div>
  );
}

// ==========================================
// APLICACIÓN PRINCIPAL
// ==========================================
function MainApp() {
  const { instance, accounts } = useMsal();
  const currentUser = accounts[0] || {};

  const initialState = {
    id: '', 
    titulo: '', fecha_ingreso: '', fecha_control: '',
    tiempo_respuesta_hrs: '', novedad_tiempo: '',
    fuente_medio: '', campania: '', celular: '', email: '',
    linea_interes: '',
    estado: 'Nuevo', asesor: '', calificacion_lead: 'Por evaluar',
    razon_calificacion: '', notas_seguimiento: '',
    fecha_actualizacion_nota: '', 
    fecha_seguimiento_dia: '', jornada_seguimiento: '', hora_seguimiento: '',
    accion: '', estado_orden: 'Abierta', fecha_cierre: '',
    observaciones: '',
    programar_recordatorio: false, canal_recordatorio: 'email',
    link_adjuntos: ''
  };

  const [formData, setFormData] = useState(initialState);
  const [savedLeads, setSavedLeads] = useState([]);
  
  const [toastAlert, setToastAlert] = useState({ show: false, message: '', type: 'success' }); 
  const [scheduledReminder, setScheduledReminder] = useState(null);
  const toastTimeoutRef = useRef(null); 
  
  const [currentView, setCurrentView] = useState('form'); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  
  const [isSyncingConfig, setIsSyncingConfig] = useState(false); 
  const [editingLeadId, setEditingLeadId] = useState(null); 
  const [showEditModal, setShowEditModal] = useState(false); 

  const [leadToDelete, setLeadToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [appLogs, setAppLogs] = useState([]);
  const [showLogsModal, setShowLogsModal] = useState(false);

  const addLog = (message, type = 'info') => {
    setAppLogs(prev => {
      const newLogs = [{ time: new Date().toLocaleTimeString(), message, type }, ...prev];
      return newLogs.slice(0, 100); 
    });
  };

  const showToast = (message, type = 'success') => {
    setToastAlert({ show: true, message, type });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    
    toastTimeoutRef.current = setTimeout(() => {
      setToastAlert({ show: false, message: '', type: 'success' });
      setScheduledReminder(null);
    }, 5000);
  };

  const hasLoggedAuth = useRef(false);
  useEffect(() => {
    if (currentUser.name && !hasLoggedAuth.current) {
      addLog(`Usuario autenticado: ${currentUser.name} (${currentUser.username || ''})`, 'success');
      hasLoggedAuth.current = true;
    }
  }, [currentUser.name, currentUser.username]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowAdminModal(false);
        setShowLogsModal(false);
        if (leadToDelete && !isDeleting) {
          setLeadToDelete(null);
        } else if (showEditModal && !isSubmitting) {
          handleCancelEdit();
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showEditModal, isSubmitting, leadToDelete, isDeleting]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterAsesor, setFilterAsesor] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterMes, setFilterMes] = useState(''); 
  const [filterFuente, setFilterFuente] = useState(''); 
  const [filterCampania, setFilterCampania] = useState(''); 
  const [reportFilterCalificacion, setReportFilterCalificacion] = useState(''); 
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'descending' });

  const getInitialList = (key, defaultList) => {
    try {
      const savedList = localStorage.getItem(key);
      if (!savedList) return defaultList;
      const parsed = JSON.parse(savedList);
      if (!Array.isArray(parsed)) return defaultList;
      
      return parsed
        .filter(item => item !== null && item !== undefined)
        .map(item => {
          if (typeof item === 'string') return item.trim();
          if (typeof item === 'object') return String(item.Value || item.nombre || item.Title || '').trim();
          return String(item).trim();
        })
        .filter(item => item !== '');
    } catch(e) {
      return defaultList;
    }
  };

  const getInitialAsesoresList = () => {
    try {
      const savedList = localStorage.getItem('asesoresList');
      if (!savedList) return [];
      const parsed = JSON.parse(savedList);
      if (!Array.isArray(parsed)) return [];
      
      const mapped = parsed.map(item => {
        if (typeof item === 'string') return { nombre: item.trim(), correo: '' };
        if (typeof item === 'object' && item !== null) {
          return { 
            nombre: String(item.nombre || item.Title || '').trim(), 
            correo: String(item.correo || item.email || '').trim() 
          };
        }
        return null;
      }).filter(a => a && a.nombre);
      
      return mapped.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } catch(e) {
      return [];
    }
  };
  
  const [asesoresList, setAsesoresList] = useState(getInitialAsesoresList);
  const [lineasList, setLineasList] = useState(() => getInitialList('lineasList', []));
  const [accionesList, setAccionesList] = useState(() => getInitialList('accionesList', []));
  const [fuentesList, setFuentesList] = useState(() => getInitialList('fuentesList', []));
  const [campaniasList, setCampaniasList] = useState(() => getInitialList('campaniasList', []));
  
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminTab, setAdminTab] = useState('asesores'); 
  
  const [newAsesorName, setNewAsesorName] = useState('');
  const [newAsesorEmail, setNewAsesorEmail] = useState('');
  const [newLineaName, setNewLineaName] = useState('');
  const [newAccionName, setNewAccionName] = useState('');
  const [newFuenteName, setNewFuenteName] = useState('');
  const [newCampaniaName, setNewCampaniaName] = useState('');

  useEffect(() => { localStorage.setItem('asesoresList', JSON.stringify(asesoresList)); }, [asesoresList]);
  useEffect(() => { localStorage.setItem('lineasList', JSON.stringify(lineasList)); }, [lineasList]);
  useEffect(() => { localStorage.setItem('accionesList', JSON.stringify(accionesList)); }, [accionesList]);
  useEffect(() => { localStorage.setItem('fuentesList', JSON.stringify(fuentesList)); }, [fuentesList]);
  useEffect(() => { localStorage.setItem('campaniasList', JSON.stringify(campaniasList)); }, [campaniasList]);

  const fetchConfigFromCloud = async () => {
    if (!URL_CONFIG) return;
    
    setIsSyncingConfig(true);
    addLog('Descargando configuración inicial...', 'info');
    
    try {
      const payloadGet = {
        tipo: "GET", id: "", Title: "", Título: "", CORREOS: "", LINEAS_INTERES: "",
        ACCIONES: "", FUENTES: "", CAMPANIAS: "", URL_DATOS: "", URL_CONFIG: ""
      };

      const response = await fetch(URL_CONFIG, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadGet)
      });

      if (response.status === 202) throw new Error("PA devolvió 202. Desactiva 'Respuesta asincrónica'.");
      if (!response.ok) throw new Error(`HTTP Status: ${response.status}`);
      
      const data = await response.json();
      let configData = data;
      if (data.body) configData = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
      if (configData.value) configData = Array.isArray(configData.value) ? configData.value[0] : configData.value;
      else if (Array.isArray(configData)) configData = configData[0];

      if (!configData) throw new Error("No se encontraron datos en la respuesta.");

      const parseSemicolonString = (str) => (str ? String(str).split(';').map(s => s.trim()).filter(Boolean) : []);

      const rawNombres = configData.Title || configData.Título || configData.Titulo || configData.TITULO || "";
      const nombresAsesores = parseSemicolonString(rawNombres);
      const correosAsesores = parseSemicolonString(configData.CORREOS);
      const extractedAsesores = nombresAsesores.map((nombre, i) => ({ 
        nombre, correo: correosAsesores[i] || '' 
      }));

      if(extractedAsesores.length > 0) setAsesoresList(extractedAsesores.sort((a, b) => (a?.nombre || '').localeCompare(b?.nombre || '')));
      if(configData.LINEAS_INTERES) setLineasList(parseSemicolonString(configData.LINEAS_INTERES).sort((a, b) => (a || '').localeCompare(b || '')));
      if(configData.ACCIONES) setAccionesList(parseSemicolonString(configData.ACCIONES).sort((a, b) => (a || '').localeCompare(b || '')));
      if(configData.FUENTES) setFuentesList(parseSemicolonString(configData.FUENTES).sort((a, b) => (a || '').localeCompare(b || '')));
      if(configData.CAMPANIAS) setCampaniasList(parseSemicolonString(configData.CAMPANIAS).sort((a, b) => (a || '').localeCompare(b || '')));

      addLog('Configuración sincronizada desde la Nube.', 'success');
    } catch (error) {
      console.error(error);
      addLog(`Fallo al descargar config: ${error.message}`, 'error');
    } finally {
      setIsSyncingConfig(false);
    }
  };

  const syncConfigToCloud = async (overrides = {}) => {
    if (!URL_CONFIG) return;

    setIsSyncingConfig(true);
    addLog('Sincronizando cambios de configuración con la Nube...', 'info');

    const currentAsesores = overrides.asesores || asesoresList;
    const currentLineas = overrides.lineas || lineasList;
    const currentAcciones = overrides.acciones || accionesList;
    const currentFuentes = overrides.fuentes || fuentesList;
    const currentCampanias = overrides.campanias || campaniasList;

    try {
      const payload = {
        tipo: "UPDATE",
        id: "1", 
        Title: currentAsesores.map(a => a.nombre).join(';') || "",
        Título: currentAsesores.map(a => a.nombre).join(';') || "", 
        CORREOS: currentAsesores.map(a => a.correo).join(';') || "",
        LINEAS_INTERES: currentLineas.join(';') || "",
        ACCIONES: currentAcciones.join(';') || "",
        FUENTES: currentFuentes.join(';') || "",
        CAMPANIAS: currentCampanias.join(';') || "",
        URL_DATOS: URL_DATOS || "",
        URL_CONFIG: URL_CONFIG || ""
      };

      const response = await fetch(URL_CONFIG, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.status === 202) throw new Error("PA devolvió 202. Desactiva 'Respuesta asincrónica'.");
      if (!response.ok) throw new Error(`HTTP Status: ${response.status}`);
      
      showToast('Configuración guardada exitosamente.', 'success');
    } catch (error) {
      console.error(error);
      showToast('Error al sincronizar con la nube.', 'error');
    } finally {
      setIsSyncingConfig(false);
    }
  };

  useEffect(() => {
    if (URL_CONFIG) fetchConfigFromCloud();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleAddAsesor = () => {
    const trimmedName = newAsesorName.trim();
    if (trimmedName && !asesoresList.some(a => a.nombre === trimmedName)) {
      const newList = [...asesoresList, { nombre: trimmedName, correo: newAsesorEmail.trim() }].sort((a, b) => (a?.nombre || '').localeCompare(b?.nombre || ''));
      setAsesoresList(newList);
      setNewAsesorName('');
      setNewAsesorEmail('');
      syncConfigToCloud({ asesores: newList });
    } else if (asesoresList.some(a => a.nombre === trimmedName)) {
      showToast("Ese asesor ya existe.", "warning");
    }
  };

  const handleRemoveAsesor = (asesorNombreToRemove) => {
    const newList = asesoresList.filter(a => a.nombre !== asesorNombreToRemove);
    setAsesoresList(newList);
    if (formData.asesor === asesorNombreToRemove) setFormData(prev => ({ ...prev, asesor: '' }));
    syncConfigToCloud({ asesores: newList });
  };

  const handleAddLinea = () => {
    if (newLineaName.trim() && !lineasList.includes(newLineaName.trim())) {
      const newList = [...lineasList, newLineaName.trim()].sort((a, b) => (a || '').localeCompare(b || ''));
      setLineasList(newList);
      setNewLineaName('');
      syncConfigToCloud({ lineas: newList });
    }
  };

  const handleRemoveLinea = (lineaToRemove) => {
    const newList = lineasList.filter(l => l !== lineaToRemove);
    setLineasList(newList);
    if (formData.linea_interes === lineaToRemove) setFormData(prev => ({ ...prev, linea_interes: '' }));
    syncConfigToCloud({ lineas: newList });
  };

  const handleAddAccion = () => {
    if (newAccionName.trim() && !accionesList.includes(newAccionName.trim())) {
      const newList = [...accionesList, newAccionName.trim()].sort((a, b) => (a || '').localeCompare(b || ''));
      setAccionesList(newList);
      setNewAccionName('');
      syncConfigToCloud({ acciones: newList });
    }
  };

  const handleRemoveAccion = (accionToRemove) => {
    const newList = accionesList.filter(a => a !== accionToRemove);
    setAccionesList(newList);
    if (formData.accion === accionToRemove) setFormData(prev => ({ ...prev, accion: '' }));
    syncConfigToCloud({ acciones: newList });
  };

  const handleAddFuente = () => {
    if (newFuenteName.trim() && !fuentesList.includes(newFuenteName.trim().toUpperCase())) {
      const newList = [...fuentesList, newFuenteName.trim().toUpperCase()].sort((a, b) => (a || '').localeCompare(b || ''));
      setFuentesList(newList);
      setNewFuenteName('');
      syncConfigToCloud({ fuentes: newList });
    }
  };

  const handleRemoveFuente = (fuenteToRemove) => {
    const newList = fuentesList.filter(f => f !== fuenteToRemove);
    setFuentesList(newList);
    if (formData.fuente_medio === fuenteToRemove) setFormData(prev => ({ ...prev, fuente_medio: '' }));
    syncConfigToCloud({ fuentes: newList });
  };

  const handleAddCampania = () => {
    if (newCampaniaName.trim() && !campaniasList.includes(newCampaniaName.trim())) {
      const newList = [...campaniasList, newCampaniaName.trim()].sort((a, b) => (a || '').localeCompare(b || ''));
      setCampaniasList(newList);
      setNewCampaniaName('');
      syncConfigToCloud({ campanias: newList });
    }
  };

  const handleRemoveCampania = (campaniaToRemove) => {
    const newList = campaniasList.filter(c => c !== campaniaToRemove);
    setCampaniasList(newList);
    if (formData.campania === campaniaToRemove) setFormData(prev => ({ ...prev, campania: '' }));
    syncConfigToCloud({ campanias: newList });
  };

  const extractDynamicOptions = (leadsData) => {
    if (!leadsData || !Array.isArray(leadsData) || leadsData.length === 0) return;
    let newAsesores = [...asesoresList]; 
    let newLineas = new Set(lineasList);
    let newAcciones = new Set(accionesList);
    let newFuentes = new Set(fuentesList);
    let newCampanias = new Set(campaniasList);

    leadsData.forEach(lead => {
      if (lead.asesor && typeof lead.asesor === 'string' && lead.asesor.trim() !== '') {
        const asesorNombre = lead.asesor.trim();
        if (!newAsesores.some(a => a?.nombre === asesorNombre)) {
          newAsesores.push({ nombre: asesorNombre, correo: '' });
        }
      }
      if (lead.linea_interes && typeof lead.linea_interes === 'string' && lead.linea_interes.trim() !== '') newLineas.add(lead.linea_interes.trim());
      if (lead.accion && typeof lead.accion === 'string' && lead.accion.trim() !== '') newAcciones.add(lead.accion.trim());
      if (lead.fuente_medio && typeof lead.fuente_medio === 'string' && lead.fuente_medio.trim() !== '') newFuentes.add(lead.fuente_medio.trim().toUpperCase());
      if (lead.campania && typeof lead.campania === 'string' && lead.campania.trim() !== '') newCampanias.add(lead.campania.trim());
    });

    if (newAsesores.length !== asesoresList.length) setAsesoresList(newAsesores.sort((a, b) => (a?.nombre || '').localeCompare(b?.nombre || '')));
    if (newLineas.size !== lineasList.length) setLineasList(Array.from(newLineas).sort((a, b) => (a || '').localeCompare(b || '')));
    if (newAcciones.size !== accionesList.length) setAccionesList(Array.from(newAcciones).sort((a, b) => (a || '').localeCompare(b || '')));
    if (newFuentes.size !== fuentesList.length) setFuentesList(Array.from(newFuentes).sort((a, b) => (a || '').localeCompare(b || '')));
    if (newCampanias.size !== campaniasList.length) setCampaniasList(Array.from(newCampanias).sort((a, b) => (a || '').localeCompare(b || '')));
  };

  useEffect(() => {
    if (formData.fecha_ingreso && formData.fecha_control) {
      const ingreso = new Date(formData.fecha_ingreso.length === 16 ? `${formData.fecha_ingreso}-05:00` : formData.fecha_ingreso);
      const control = new Date(formData.fecha_control.length === 16 ? `${formData.fecha_control}-05:00` : formData.fecha_control);
      if (!isNaN(ingreso.getTime()) && !isNaN(control.getTime())) {
        const diffMs = control - ingreso;
        const diffHrs = (diffMs / (1000 * 60 * 60)).toFixed(2);
        const newValue = diffHrs > 0 ? diffHrs : '0.00';
        setFormData(prev => prev.tiempo_respuesta_hrs !== newValue ? { ...prev, tiempo_respuesta_hrs: newValue } : prev);
      }
    } else {
      setFormData(prev => prev.tiempo_respuesta_hrs !== '' ? { ...prev, tiempo_respuesta_hrs: '' } : prev);
    }
  }, [formData.fecha_ingreso, formData.fecha_control]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // --- FUNCIÓN ROBUSTA PARA PROCESAR JSON DE SHAREPOINT ---
  const extractSingleItem = (data) => {
    let item = {};
    if (Array.isArray(data) && data.length > 0) item = data[0];
    else if (data.value && Array.isArray(data.value) && data.value.length > 0) item = data.value[0];
    else if (data.body && typeof data.body === 'object') {
       if (data.body.d) item = data.body.d; 
       else if (Array.isArray(data.body) && data.body.length > 0) item = data.body[0];
       else if (data.body.value && Array.isArray(data.body.value) && data.body.value.length > 0) item = data.body.value[0];
       else item = data.body;
    } else if (data.d && typeof data.d === 'object') item = data.d; 
    else if (typeof data === 'object') item = data;
    return item;
  };

  // --- FORMATEADORES SEGUROS DE HORA (Ajustan UTC a Local Bogotá para el Formulario) ---
  const formatDateTime = (val) => {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val).substring(0, 16);
      
      const f = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Bogota',
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', hour12: false
      });
      const parts = f.formatToParts(d);
      const map = {};
      parts.forEach(p => map[p.type] = p.value);
      
      let hr = map.hour;
      if (hr === '24') hr = '00';

      return `${map.year}-${map.month}-${map.day}T${hr}:${map.minute}`;
    } catch(e) {
      return String(val).substring(0, 16);
    }
  };

  const formatDate = (val) => {
    if (!val) return '';
    try {
       const d = new Date(val);
       if (isNaN(d.getTime())) return String(val).split('T')[0];
       const f = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Bogota',
          year: 'numeric', month: '2-digit', day: '2-digit'
       });
       const parts = f.formatToParts(d);
       const map = {};
       parts.forEach(p => map[p.type] = p.value);
       return `${map.year}-${map.month}-${map.day}`;
    } catch(e) {
       return String(val).split('T')[0];
    }
  };

  const formatTime = (val) => {
     if (!val) return '';
     return String(val).substring(0, 5);
  };

  // Convertidor Local -> UTC para enviar a SharePoint 
  const toSPDate = (localStr) => {
    if (!localStr) return "";
    try { 
      let dateStr = localStr;
      // Si viene del input local (YYYY-MM-DDTHH:mm), forzamos la zona horaria de Bogotá (UTC-5)
      if (dateStr.length === 16) {
          dateStr = `${dateStr}-05:00`;
      }
      return new Date(dateStr).toISOString(); 
    } 
    catch(e) { return localStr; }
  };

  const mapItemToFormData = (item) => {
    const extractValue = (field) => {
      if (field === null || field === undefined) return '';
      if (typeof field === 'object') {
        if (field.Value !== undefined) return String(field.Value);
        if (field.Title !== undefined) return String(field.Title);
        return ''; 
      }
      return String(field);
    };

    return {
      id: item.ID || item.Id || item.id || item.ItemInternalId || '',
      titulo: extractValue(item.Title || item.titulo || item.TITULO),
      fecha_ingreso: formatDateTime(item.FECHA_INGRESO || item.fecha_ingreso),
      fecha_control: formatDateTime(item.FECHA_CONTROL || item.fecha_control),
      tiempo_respuesta_hrs: String(item.TIEMPO_RESPUESTA_HRS ?? item.tiempo_respuesta_hrs ?? ''),
      novedad_tiempo: extractValue(item.NOVEDAD_TIEMPO || item.novedad_tiempo),
      fuente_medio: extractValue(item.FUENTE_MEDIO || item.fuente_medio),
      campania: extractValue(item.CAMPANIA || item.campania),
      celular: extractValue(item.CELULAR || item.celular),
      email: extractValue(item.EMAIL || item.email),
      linea_interes: extractValue(item.LINEA_INTERES || item.LINEAS_INTERES || item.linea_interes),
      estado: extractValue(item.ESTADO || item.estado) || 'Nuevo',
      asesor: extractValue(item.ASESOR || item.asesor),
      calificacion_lead: extractValue(item.CALIFICACION_LEAD || item.calificacion_lead) || 'Por evaluar',
      razon_calificacion: extractValue(item.RAZON_CALIFICACION || item.razon_calificacion),
      notas_seguimiento: extractValue(item.NOTAS_SEGUIMIENTO || item.notas_seguimiento),
      fecha_actualizacion_nota: formatDate(item.FECHA_ACTUALIZACION_NOTA || item.fecha_actualizacion_nota),
      fecha_seguimiento_dia: formatDate(item.FECHA_SEGUIMIENTO_DIA || item.fecha_seguimiento_dia),
      jornada_seguimiento: extractValue(item.JORNADA_SEGUIMIENTO || item.jornada_seguimiento),
      hora_seguimiento: formatTime(item.HORA_SEGUIMIENTO || item.hora_seguimiento),
      accion: extractValue(item.ACCION || item.accion),
      estado_orden: extractValue(item.ESTADO_ORDEN || item.estado_orden) || 'Abierta',
      fecha_cierre: formatDateTime(item.FECHA_CIERRE || item.fecha_cierre),
      observaciones: extractValue(item.OBSERVACIONES || item.observaciones),
      programar_recordatorio: String(item.PROGRAMAR_RECORDATORIO).toLowerCase() === 'true',
      canal_recordatorio: extractValue(item.CANAL_RECORDATORIO || item.canal_recordatorio) || 'email',
      link_adjuntos: extractValue(item.LINK_ADJUNTOS || item.link_adjuntos || item['{Link}'])
    };
  };

  // --- LÓGICA: GET DETAILS ---
  const handleEditLead = async (lead) => {
    if (!URL_DATOS) return showToast("Falta URL de Datos", "error");
    
    setIsFetchingDetails(true);
    addLog(`Consultando detalles completos para ID [${lead.id}]...`, 'info');

    try {
      const payloadGetDetails = {
        tipo: "GET_DETAILS",
        id: String(lead.id),
        ...getBasePayload() 
      };

      const response = await fetch(URL_DATOS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadGetDetails)
      });

      if (response.status === 202) throw new Error("PA devolvió 202.");
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      const textData = await response.text();
      const rawData = JSON.parse(textData);
      
      const item = extractSingleItem(rawData);
      const safeLead = mapItemToFormData(item);

      setFormData({ ...initialState, ...safeLead });
      setEditingLeadId(lead.id);
      setShowEditModal(true);
      addLog(`Edición abierta para ID [${lead.id}].`, 'success');

    } catch (error) {
      console.error(error);
      showToast("Error al obtener detalles del lead.", "error");
      addLog(`Fallo GET_DETAILS: ${error.message}`, 'error');
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingLeadId(null);
    setFormData(initialState);
    setShowEditModal(false);
    addLog('Edición cancelada.', 'warning');
  };

  const executeDelete = async () => {
    if (!leadToDelete) return;
    if (!URL_DATOS) {
       showToast("Falta VITE_PoAu_URL_EMBUDOCOM_DATOS", "error");
       return;
    }

    setIsDeleting(true);
    addLog(`Enviando DELETE ID [${leadToDelete.id}]...`, 'info');

    try {
      const payloadDelete = {
        tipo: "DELETE",
        id: String(leadToDelete.id),
        ...getBasePayload()
      };

      const response = await fetch(URL_DATOS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadDelete)
      });

      if (response.status === 202) throw new Error("PA devolvió 202.");
      if (!response.ok) throw new Error(`HTTP Status: ${response.status}`);
      
      showToast(`Lead eliminado de SharePoint.`, 'success');
      setLeadToDelete(null);
      fetchLeadsData(false); 
      
    } catch (error) {
      console.error(error);
      showToast(`Error al eliminar. Revisa logs.`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!URL_DATOS) {
       showToast("Falta VITE_PoAu_URL_EMBUDOCOM_DATOS en .env", "error");
       return;
    }

    setIsSubmitting(true);
    const isUpdate = !!editingLeadId; 
    const tipoMetodo = isUpdate ? "UPDATE" : "POST";
    const targetId = isUpdate ? String(editingLeadId) : "";
    
    try {
      const asesorSeleccionadoNombre = formData.asesor ? formData.asesor.trim() : '';
      const selectedAsesorObj = asesoresList.find(a => a.nombre.trim() === asesorSeleccionadoNombre);
      
      const payload = {
        tipo: tipoMetodo,
        id: targetId,
        titulo: formData.titulo || "",
        email: formData.email || "", 
        fecha_ingreso: toSPDate(formData.fecha_ingreso),
        fecha_control: toSPDate(formData.fecha_control),
        tiempo_respuesta_hrs: String(formData.tiempo_respuesta_hrs || ""),
        novedad_tiempo: formData.novedad_tiempo || "",
        fuente_medio: formData.fuente_medio || "",
        campania: formData.campania || "",
        celular: String(formData.celular || ""), 
        linea_interes: formData.linea_interes || "",
        estado: formData.estado || "",
        asesor: formData.asesor || "",
        calificacion_lead: formData.calificacion_lead || "",
        razon_calificacion: formData.razon_calificacion || "",
        notas_seguimiento: formData.notas_seguimiento || "",
        fecha_actualizacion_nota: formData.fecha_actualizacion_nota || "",
        fecha_seguimiento_dia: formData.fecha_seguimiento_dia || "",
        jornada_seguimiento: formData.jornada_seguimiento || "",
        hora_seguimiento: formData.hora_seguimiento || "",
        accion: formData.accion || "",
        estado_orden: formData.estado_orden || "",
        fecha_cierre: toSPDate(formData.fecha_cierre),
        observaciones: formData.observaciones || "",
        programar_recordatorio: Boolean(formData.programar_recordatorio),
        canal_recordatorio: formData.canal_recordatorio || "",
        fecha_registro_sistema: new Date().toISOString(), 
        email_asesor: selectedAsesorObj ? selectedAsesorObj.correo : '' 
      };

      addLog(`Enviando JSON -> tipo: "${payload.tipo}", id: "${payload.id}"`, 'info');

      const response = await fetch(URL_DATOS, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.status === 202) throw new Error("PA devolvió 202.");
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      
      showToast(`Lead ${isUpdate ? 'actualizado' : 'guardado'} con éxito.`, 'success');

      if (formData.programar_recordatorio && formData.fecha_seguimiento_dia) {
        const timeString = formData.hora_seguimiento || '00:00';
        const fechaSeg = new Date(`${formData.fecha_seguimiento_dia}T${timeString}:00-05:00`);
        fechaSeg.setHours(fechaSeg.getHours() - 1);
        
        setScheduledReminder({ 
          fecha: fechaSeg.toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'short' }), 
          canal: formData.canal_recordatorio === 'teams' ? 'Microsoft Teams' : 'Correo Electrónico' 
        });
      }
      
      setFormData(initialState);
      if(editingLeadId) setShowEditModal(false);
      setEditingLeadId(null);

      setTimeout(() => {
        if(currentView === 'data' || currentView === 'reports') fetchLeadsData(false); 
      }, 1500); 
      
    } catch (error) {
      console.error("Error al procesar:", error);
      showToast(`Error de envío. Revisa Logs.`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchLeadsData = async (showSuccessToast = true) => {
    if (!URL_DATOS) {
      showToast("Falta VITE_PoAu_URL_EMBUDOCOM_DATOS en .env", "error");
      return;
    }

    setIsLoadingData(true);
    addLog('Consultando leads (Vista rápida)...', 'info');
    try {
      const payloadGet = {
          tipo: "GET",
          id: "",
          ...getBasePayload()
      };

      const response = await fetch(URL_DATOS, {
         method: 'POST', 
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payloadGet)
      });

      if (response.status === 202) throw new Error("PA devolvió 202.");
      if (!response.ok) throw new Error(`HTTP Status: ${response.status}`);

      const textData = await response.text();
      if (!textData || textData.trim() === '') {
         setSavedLeads([]);
         return;
      }

      try {
          const data = JSON.parse(textData);
          
          let rawLeads = [];
          if (Array.isArray(data)) rawLeads = data;
          else if (data.value && Array.isArray(data.value)) rawLeads = data.value;
          else if (data.body && typeof data.body === 'object') {
             if (data.body.d) rawLeads = Array.isArray(data.body.d) ? data.body.d : [data.body.d];
             else if (Array.isArray(data.body)) rawLeads = data.body;
             else if (data.body.value && Array.isArray(data.body.value)) rawLeads = data.body.value;
             else if (data.body.Title || data.body.titulo) rawLeads = [data.body]; 
          } else if (data.d && typeof data.d === 'object') {
             rawLeads = Array.isArray(data.d) ? data.d : [data.d];
          } else if (typeof data === 'object' && (data.Title || data.titulo)) {
             rawLeads = [data];
          }

          const extractValue = (field) => {
            if (field === null || field === undefined) return '';
            if (typeof field === 'object') {
              if (field.Value !== undefined) return String(field.Value);
              if (field.Title !== undefined) return String(field.Title);
              return ''; 
            }
            return String(field);
          };

          const mappedLeads = rawLeads.map(item => ({
            id: item.ID || item.Id || item.id || item.ItemInternalId || '',
            titulo: extractValue(item.Title || item.titulo || item.TITULO),
            fecha_ingreso: item.FECHA_INGRESO || item.fecha_ingreso || '',
            tiempo_respuesta_hrs: String(item.TIEMPO_RESPUESTA_HRS || item.tiempo_respuesta_hrs || ''),
            fuente_medio: extractValue(item.FUENTE_MEDIO || item.fuente_medio),
            campania: extractValue(item.CAMPANIA || item.campania),
            celular: extractValue(item.CELULAR || item.celular),
            email: extractValue(item.EMAIL || item.email),
            linea_interes: extractValue(item.LINEA_INTERES || item.LINEAS_INTERES || item.linea_interes),
            estado: extractValue(item.ESTADO || item.estado) || 'Nuevo',
            asesor: extractValue(item.ASESOR || item.asesor),
            calificacion_lead: extractValue(item.CALIFICACION_LEAD || item.calificacion_lead) || 'Por evaluar',
            notas_seguimiento: extractValue(item.NOTAS_SEGUIMIENTO || item.notas_seguimiento),
            accion: extractValue(item.ACCION || item.accion),
            estado_orden: extractValue(item.ESTADO_ORDEN || item.estado_orden) || 'Abierta',
            link_adjuntos: extractValue(item.LINK_ADJUNTOS || item.link_adjuntos || item['{Link}'])
          }));

          setSavedLeads(mappedLeads);
          extractDynamicOptions(mappedLeads);

          if(currentView === 'data' && showSuccessToast) {
            showToast('Datos actualizados correctamente.', 'success');
          }
      } catch(parseError) {
          console.error(parseError);
          throw new Error("JSON Inválido de SP.");
      }

    } catch (error) {
      console.error(error);
      addLog(`Fallo al cargar leads: ${error.message}`, 'error');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if ((currentView === 'data' || currentView === 'reports') && URL_DATOS && savedLeads.length === 0) {
      fetchLeadsData(false); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  const filteredAndSortedLeads = useMemo(() => {
    let items = [...savedLeads];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      items = items.filter(lead => 
        (lead.titulo || '').toLowerCase().includes(lowerSearch) ||
        (lead.celular || '').includes(searchTerm) ||
        (lead.email || '').toLowerCase().includes(lowerSearch) ||
        String(lead.id).includes(searchTerm)
      );
    }

    if (filterMes) items = items.filter(lead => lead.fecha_ingreso && lead.fecha_ingreso.startsWith(filterMes));
    if (filterAsesor) items = items.filter(lead => lead.asesor === filterAsesor);
    if (filterEstado) items = items.filter(lead => lead.estado === filterEstado);
    if (filterFuente) items = items.filter(lead => lead.fuente_medio === filterFuente);
    if (filterCampania) items = items.filter(lead => lead.campania === filterCampania);

    if (sortConfig !== null) {
      items.sort((a, b) => {
        let aValue = a[sortConfig.key] || '';
        let bValue = b[sortConfig.key] || '';
        
        if (sortConfig.key === 'tiempo_respuesta_hrs') {
          aValue = parseFloat(aValue) || 0;
          bValue = parseFloat(bValue) || 0;
        } else if (sortConfig.key === 'id') {
          aValue = parseInt(aValue, 10) || 0;
          bValue = parseInt(bValue, 10) || 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }

    return items;
  }, [savedLeads, searchTerm, filterMes, filterAsesor, filterEstado, filterFuente, filterCampania, sortConfig]);

  const reportes = useMemo(() => {
    let itemsForReports = savedLeads;
    if (filterMes) itemsForReports = itemsForReports.filter(lead => lead.fecha_ingreso && lead.fecha_ingreso.startsWith(filterMes));
    if (reportFilterCalificacion) itemsForReports = itemsForReports.filter(lead => lead.calificacion_lead === reportFilterCalificacion);

    const total = itemsForReports.length;
    if (total === 0) return null;

    let potenciales = 0, calificados = 0, noCalificados = 0, ventasCerradas = 0, totalPerdidos = 0;
    let organicos = 0, pauta = 0, finDeSemana = 0, fueraHorario = 0;
    let ordenesAbiertas = 0, ordenesCerradas = 0;
    const calificacionCount = {};
    const lineasCount = {};
    const accionesCount = {};
    const rendimientoAsesores = {};

    itemsForReports.forEach(lead => {
      const calif = lead.calificacion_lead || 'Por evaluar';
      calificacionCount[calif] = (calificacionCount[calif] || 0) + 1;
      
      const asesorName = lead.asesor || 'Sin asignar';
      if (!rendimientoAsesores[asesorName]) {
        rendimientoAsesores[asesorName] = { asignados: 0, ventas: 0, perdidos: 0 };
      }
      rendimientoAsesores[asesorName].asignados++;

      // Mantenemos a los tibios y calientes como calificados, pero SOLO calientes para potenciales clientes
      if (calif === 'Caliente') { potenciales++; }
      if (calif === 'Caliente' || calif === 'Tibio') { calificados++; } else { noCalificados++; }
      
      if (lead.accion === 'Venta') {
        ventasCerradas++;
        rendimientoAsesores[asesorName].ventas++;
      }

      if (lead.estado_orden === 'Cerrada') ordenesCerradas++;
      else if (lead.estado_orden === 'Abierta') ordenesAbiertas++;

      if (lead.estado === 'Perdido') {
        totalPerdidos++;
        rendimientoAsesores[asesorName].perdidos++;
      }

      const acc = lead.accion || 'Sin asignar';
      accionesCount[acc] = (accionesCount[acc] || 0) + 1;

      const fuente = (lead.fuente_medio || '').toLowerCase();
      if (fuente.includes('orgánico') || fuente.includes('organico') || fuente.includes('seo') || fuente.includes('directo')) {
        organicos++;
      } else if (fuente) {
        pauta++;
      }

      if (lead.fecha_ingreso) {
        const fecha = new Date(lead.fecha_ingreso);
        if (!isNaN(fecha.getTime())) {
            const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Bogota', weekday: 'short', hour: 'numeric', hour12: false });
            const parts = formatter.formatToParts(fecha);
            const map = {};
            parts.forEach(p => map[p.type] = p.value);
            
            const dayStr = map.weekday; 
            let hora = parseInt(map.hour, 10);
            if (map.hour === '24') hora = 0;
            
            if (dayStr === 'Sat' || dayStr === 'Sun') finDeSemana++;
            else if (hora < 8 || hora >= 18) fueraHorario++;
        }
      }

      const linea = lead.linea_interes || 'No especificada';
      lineasCount[linea] = (lineasCount[linea] || 0) + 1;
    });

    const efectividadPorcentaje = ((ventasCerradas / total) * 100).toFixed(1);

    const rendimientoArray = Object.entries(rendimientoAsesores).map(([nombre, datos]) => {
      return {
        nombre,
        ...datos,
        efectividad: datos.asignados > 0 ? ((datos.ventas / datos.asignados) * 100).toFixed(1) : '0.0'
      };
    }).sort((a, b) => b.ventas - a.ventas); // Ordenamos de mayor a menor venta

    return {
      total, potenciales, calificados, noCalificados, ventasCerradas, totalPerdidos, efectividadPorcentaje,
      organicos, pauta, finDeSemana, fueraHorario, calificacionCount, lineasCount,
      ordenesAbiertas, ordenesCerradas, accionesCount, rendimientoArray
    };
  }, [savedLeads, filterMes, reportFilterCalificacion]);

  const handleDownloadCSV = () => {
    if (!reportes) return;
    const csvRows = [];
    csvRows.push(['Metrica', 'Valor']);
    csvRows.push(['Total Leads', reportes.total]);
    csvRows.push(['Ventas', reportes.ventasCerradas]);
    csvRows.push(['Leads Perdidos', reportes.totalPerdidos]);
    csvRows.push(['Efectividad (%)', reportes.efectividadPorcentaje]);
    csvRows.push(['Potenciales (Calientes)', reportes.potenciales]);
    csvRows.push(['Calificados', reportes.calificados]);
    csvRows.push(['No Calificados', reportes.noCalificados]);
    csvRows.push(['Órdenes Abiertas', reportes.ordenesAbiertas]);
    csvRows.push(['Órdenes Cerradas', reportes.ordenesCerradas]);
    csvRows.push(['Organico / SEO', reportes.organicos]);
    csvRows.push(['Pauta / Pago', reportes.pauta]);
    csvRows.push(['Fuera de Horario', reportes.fueraHorario]);
    csvRows.push(['Fin de Semana', reportes.finDeSemana]);
    
    csvRows.push([]);
    csvRows.push(['Desglose por Calificacion', 'Cantidad']);
    Object.entries(reportes.calificacionCount).forEach(([k, v]) => csvRows.push([k, v]));

    csvRows.push([]);
    csvRows.push(['Acciones', 'Cantidad']);
    Object.entries(reportes.accionesCount).forEach(([k, v]) => csvRows.push([k, v]));

    csvRows.push([]);
    csvRows.push(['Lineas de Interes Solicitadas', 'Cantidad']);
    Object.entries(reportes.lineasCount).forEach(([k, v]) => csvRows.push([k, v]));

    csvRows.push([]);
    csvRows.push(['Análisis de Asesores', 'Asignados', 'Ventas', 'Perdidos', 'Efectividad (%)']);
    reportes.rendimientoArray.forEach(a => {
      csvRows.push([a.nombre, a.asignados, a.ventas, a.perdidos, a.efectividad]);
    });

    const csvContent = csvRows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Metricas_Embudo_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderFormFields = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-1">
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
            <label className="block text-xs font-bold text-zinc-600 mb-2">Email del Lead</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-zinc-400" size={16} />
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-3 pl-10 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white transition-colors" placeholder="correo@ejemplo.com" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-2">Fuente / Medio</label>
            <select name="fuente_medio" value={formData.fuente_medio} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white transition-colors cursor-pointer">
              <option value="">Seleccione...</option>
              {fuentesList.map((fuente, i) => (
                <option key={`fuente-${i}`} value={fuente}>{fuente}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-2">Campaña</label>
            <select name="campania" value={formData.campania} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white transition-colors cursor-pointer">
              <option value="">Seleccione...</option>
              {campaniasList.map((campania, i) => (
                <option key={`campania-${i}`} value={campania}>{campania}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 border-t border-zinc-100 pt-3">
            <label className="block text-xs font-bold text-zinc-600 mb-2">Línea de Interés</label>
            <select name="linea_interes" value={formData.linea_interes} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white transition-colors cursor-pointer">
              <option value="">No especificada</option>
              {lineasList.map((linea, i) => (
                <option key={`linea-${i}`} value={linea}>{linea}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

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
              <input type="text" name="tiempo_respuesta_hrs" readOnly value={formData.tiempo_respuesta_hrs} className="w-full rounded-sm border-zinc-300 bg-zinc-100 text-black border p-3 text-sm font-mono font-semibold outline-none cursor-not-allowed" placeholder="0.00" />
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
              {asesoresList.map((asesor, i) => (
                <option key={`asesor-${i}`} value={asesor.nombre}>{asesor.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

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
              <select name="hora_seguimiento" value={formData.hora_seguimiento} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-white transition-colors cursor-pointer">
                <option value="">Seleccione...</option>
                {Array.from({length: 24}, (_, i) => {
                   const hour = i.toString().padStart(2, '0') + ":00";
                   return <option key={hour} value={hour}>{hour}</option>
                })}
              </select>
            </div>
          </div>

          <div className="md:col-span-2 bg-zinc-50 p-4 rounded-sm border border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-2">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="recordatorio" name="programar_recordatorio" checked={formData.programar_recordatorio} onChange={handleChange} className="w-4 h-4 text-black rounded-sm border-zinc-400 focus:ring-black cursor-pointer" />
              <label htmlFor="recordatorio" className="text-sm font-bold text-zinc-700 flex items-center gap-2 cursor-pointer">
                <Bell size={16} className={formData.programar_recordatorio ? "text-black" : "text-zinc-400"} /> 
                Programar recordatorio (1 hora antes)
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
              {accionesList.map((accion, i) => (
                <option key={`accion-${i}`} value={accion}>{accion}</option>
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
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-zinc-600 mb-2">Observaciones Finales</label>
            <textarea name="observaciones" rows="2" value={formData.observaciones} onChange={handleChange} className="w-full rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-zinc-50 focus:bg-white transition-colors resize-none"></textarea>
          </div>
          
          {/* Visualización de Enlace de Archivo Existente (Solo en modo edición) */}
          {editingLeadId && (
             <div className="md:col-span-2 bg-blue-50 border border-blue-200 p-4 rounded-sm flex items-start gap-3 mt-2">
                <FileText className="text-blue-500 shrink-0 mt-0.5" size={18} />
                <div>
                   <h4 className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-1">Gestión de Archivos</h4>
                   <p className="text-sm text-blue-700 mb-2">Los archivos adjuntos de este lead se gestionan directamente en tu lista de SharePoint.</p>
                   {formData.link_adjuntos ? (
                     <a 
                        href={formData.link_adjuntos} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-2 text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-sm hover:bg-blue-700 transition-colors"
                     >
                       Abrir Registro en SharePoint <ExternalLink size={14} />
                     </a>
                   ) : (
                     <span className="inline-flex items-center gap-2 text-xs font-bold bg-blue-200 text-blue-800 px-3 py-1.5 rounded-sm cursor-not-allowed" title="SharePoint no devolvió un enlace de adjuntos para este registro.">
                       Enlace no disponible <ExternalLink size={14} />
                     </span>
                   )}
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 p-4 md:p-8 font-sans selection:bg-zinc-300 relative">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-6 rounded-sm shadow-sm border border-zinc-200 gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 pr-5 border-r border-zinc-200 h-16">
              <img 
                src="/logo.jpg" 
                alt="Logo" 
                className="h-full object-contain py-1"
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.style.display = 'none';
                  const fallback = document.getElementById('fallback-main-logo');
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div id="fallback-main-logo" className="hidden h-full w-16 bg-black flex-col items-center justify-center rounded-sm">
                <h1 className="text-3xl font-black text-white tracking-tighter leading-none">pa</h1>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-black tracking-wide">Embudo Comercial</h2>
              <p className="text-zinc-500 text-sm mt-1">Gestión de Leads</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
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

            <div className="flex items-center gap-4 ml-auto lg:ml-2">
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setShowLogsModal(true)}
                  className="bg-zinc-100 hover:bg-zinc-200 text-black px-3 py-2.5 rounded-sm font-medium border border-zinc-200 transition-colors"
                  title="Ver Logs del Sistema"
                >
                  <Terminal size={18} />
                </button>
                <button 
                  type="button"
                  onClick={() => setShowAdminModal(true)}
                  className="bg-zinc-100 hover:bg-zinc-200 text-black px-3 py-2.5 rounded-sm font-medium border border-zinc-200 transition-colors"
                  title="Configuración"
                >
                  <Settings size={18} />
                </button>
              </div>

              <div className="flex items-center gap-3 pl-4 border-l border-zinc-200">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-black leading-none">{currentUser?.name || 'Usuario'}</p>
                  <p className="text-[10px] text-zinc-500 mt-1 truncate max-w-[120px]">{currentUser?.username || 'Email no disponible'}</p>
                </div>
                <button 
                  onClick={() => instance.logoutPopup()} 
                  className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {toastAlert.show && (
          <div className="fixed top-6 right-6 z-[100] space-y-2 animate-in slide-in-from-top-2 fade-in duration-300 max-w-sm w-full">
            <div className={`text-white p-4 rounded-sm border-l-4 flex items-start gap-3 shadow-2xl ${toastAlert.type === 'error' ? 'bg-red-600 border-red-800' : toastAlert.type === 'warning' ? 'bg-amber-500 border-amber-700' : 'bg-black border-zinc-400'}`}>
              {toastAlert.type === 'error' || toastAlert.type === 'warning' ? <X size={20} className="text-white/70 shrink-0 mt-0.5" /> : <CheckCircle size={20} className="text-zinc-300 shrink-0 mt-0.5" />}
              <div className="flex-1">
                 <span className="text-sm font-medium leading-tight block">
                   {toastAlert.message}
                 </span>
              </div>
              <button onClick={() => setToastAlert({ show: false, message: '', type: 'success' })} className="text-white/70 hover:text-white shrink-0">
                <X size={16} />
              </button>
            </div>
            {scheduledReminder && toastAlert.type === 'success' && (
              <div className="bg-white text-black p-4 rounded-sm border-l-4 border-black flex items-center gap-3 shadow-xl border-y border-r border-zinc-200 z-[100]">
                <Bell size={20} className="text-zinc-500 shrink-0" />
                <span className="text-sm">Recordatorio programado para el <strong>{scheduledReminder.fecha}</strong> vía {scheduledReminder.canal}.</span>
              </div>
            )}
          </div>
        )}

        {/* SPINNER DE CARGA GLOBAL AL OBTENER DETALLES */}
        {isFetchingDetails && (
          <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in">
             <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center gap-4 border border-zinc-200">
                <Loader2 size={32} className="animate-spin text-black" />
                <p className="font-bold text-sm text-zinc-800">Cargando detalles del registro...</p>
             </div>
          </div>
        )}

        {currentView === 'form' && !showEditModal && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
            {renderFormFields()}
            <div className="flex justify-end items-center gap-4 pt-4 pb-12">
              <button disabled={isSubmitting} type="submit" className="w-full sm:w-auto bg-black hover:bg-zinc-800 disabled:bg-zinc-400 text-white px-10 py-4 rounded-sm font-bold text-sm transition-all flex items-center justify-center gap-3">
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isSubmitting ? 'Guardando...' : 'Guardar Registro'}
              </button>
            </div>
          </form>
        )}

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
              
              <div className="flex flex-wrap items-center gap-3 w-full justify-end">
                <div className="relative flex-1 md:w-48 min-w-[150px]">
                  <Search className="absolute left-3 top-3 text-zinc-400" size={16} />
                  <input type="text" placeholder="Buscar lead, correo, cel..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 p-2.5 text-xs font-medium border border-zinc-300 rounded-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition-all" />
                </div>

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
                  {fuentesList.map((f, i) => <option key={`filtro-fuente-${i}`} value={f}>{f}</option>)}
                </select>

                <select value={filterCampania} onChange={e => setFilterCampania(e.target.value)} className="p-2.5 text-xs font-medium border border-zinc-300 rounded-sm focus:border-black outline-none cursor-pointer bg-white">
                  <option value="">Todas las campañas</option>
                  {campaniasList.map((c, i) => <option key={`filtro-camp-${i}`} value={c}>{c}</option>)}
                </select>

                <select value={filterAsesor} onChange={e => setFilterAsesor(e.target.value)} className="p-2.5 text-xs font-medium border border-zinc-300 rounded-sm focus:border-black outline-none cursor-pointer bg-white">
                  <option value="">Todos los asesores</option>
                  {asesoresList.map((a, i) => <option key={`filtro-ase-${i}`} value={a.nombre}>{a.nombre}</option>)}
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
                  onClick={() => fetchLeadsData(true)}
                  disabled={isLoadingData}
                  className="bg-white border border-zinc-200 hover:border-black text-black px-4 py-2.5 rounded-sm font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                  title="Traer datos de SharePoint"
                >
                  <RefreshCw size={14} className={isLoadingData ? "animate-spin" : ""} />
                  <span className="hidden sm:inline">Actualizar</span>
                </button>
              </div>
            </div>
            
            <div className="overflow-auto w-full max-h-[calc(100vh-240px)] min-h-[400px] custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1600px]">
                <thead className="sticky top-0 z-20 shadow-md">
                  <tr className="bg-black text-white text-[10px] tracking-widest uppercase border-b border-black">
                    <th className="p-4 font-bold cursor-pointer hover:bg-zinc-800 transition-colors group bg-black" onClick={() => requestSort('id')}>
                      <div className="flex items-center gap-2">ID {sortConfig?.key === 'id' ? (sortConfig.direction === 'ascending' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : <span className="opacity-0 group-hover:opacity-50 transition-opacity"><ChevronUp size={14}/></span>}</div>
                    </th>
                    <th className="p-4 font-bold cursor-pointer hover:bg-zinc-800 transition-colors group bg-black" onClick={() => requestSort('titulo')}>
                      <div className="flex items-center gap-2">Título / Nombre {sortConfig?.key === 'titulo' ? (sortConfig.direction === 'ascending' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : <span className="opacity-0 group-hover:opacity-50 transition-opacity"><ChevronUp size={14}/></span>}</div>
                    </th>
                    <th className="p-4 font-bold cursor-pointer hover:bg-zinc-800 transition-colors group bg-black" onClick={() => requestSort('fecha_ingreso')}>
                      <div className="flex items-center gap-2">Fecha Ingreso {sortConfig?.key === 'fecha_ingreso' ? (sortConfig.direction === 'ascending' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : <span className="opacity-0 group-hover:opacity-50 transition-opacity"><ChevronUp size={14}/></span>}</div>
                    </th>
                    <th className="p-4 font-bold cursor-pointer hover:bg-zinc-800 transition-colors group bg-black" onClick={() => requestSort('asesor')}>
                      <div className="flex items-center gap-2">Asesor {sortConfig?.key === 'asesor' ? (sortConfig.direction === 'ascending' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : <span className="opacity-0 group-hover:opacity-50 transition-opacity"><ChevronUp size={14}/></span>}</div>
                    </th>
                    <th className="p-4 font-bold cursor-pointer hover:bg-zinc-800 transition-colors group bg-black" onClick={() => requestSort('linea_interes')}>
                      <div className="flex items-center gap-2">Línea Interés {sortConfig?.key === 'linea_interes' ? (sortConfig.direction === 'ascending' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : <span className="opacity-0 group-hover:opacity-50 transition-opacity"><ChevronUp size={14}/></span>}</div>
                    </th>
                    <th className="p-4 font-bold cursor-pointer hover:bg-zinc-800 transition-colors group bg-black" onClick={() => requestSort('fuente_medio')}>
                      <div className="flex items-center gap-2">Fuente/Medio {sortConfig?.key === 'fuente_medio' ? (sortConfig.direction === 'ascending' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : <span className="opacity-0 group-hover:opacity-50 transition-opacity"><ChevronUp size={14}/></span>}</div>
                    </th>
                    <th className="p-4 font-bold cursor-pointer hover:bg-zinc-800 transition-colors group bg-black" onClick={() => requestSort('campania')}>
                      <div className="flex items-center gap-2">Campaña {sortConfig?.key === 'campania' ? (sortConfig.direction === 'ascending' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : <span className="opacity-0 group-hover:opacity-50 transition-opacity"><ChevronUp size={14}/></span>}</div>
                    </th>
                    <th className="p-4 font-bold cursor-pointer hover:bg-zinc-800 transition-colors group bg-black" onClick={() => requestSort('estado')}>
                      <div className="flex items-center gap-2">Estado {sortConfig?.key === 'estado' ? (sortConfig.direction === 'ascending' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : <span className="opacity-0 group-hover:opacity-50 transition-opacity"><ChevronUp size={14}/></span>}</div>
                    </th>
                    <th className="p-4 font-bold cursor-pointer hover:bg-zinc-800 transition-colors group bg-black" onClick={() => requestSort('calificacion_lead')}>
                      <div className="flex items-center gap-2">Calificación {sortConfig?.key === 'calificacion_lead' ? (sortConfig.direction === 'ascending' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : <span className="opacity-0 group-hover:opacity-50 transition-opacity"><ChevronUp size={14}/></span>}</div>
                    </th>
                    <th className="p-4 font-bold bg-black">Notas</th>
                    <th className="p-4 font-bold cursor-pointer hover:bg-zinc-800 transition-colors group bg-black" onClick={() => requestSort('estado_orden')}>
                      <div className="flex items-center gap-2">Estado Orden {sortConfig?.key === 'estado_orden' ? (sortConfig.direction === 'ascending' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : <span className="opacity-0 group-hover:opacity-50 transition-opacity"><ChevronUp size={14}/></span>}</div>
                    </th>
                    <th className="p-4 font-bold text-center cursor-pointer hover:bg-zinc-800 transition-colors group bg-black" onClick={() => requestSort('tiempo_respuesta_hrs')}>
                      <div className="flex items-center justify-center gap-2">T. Resp {sortConfig?.key === 'tiempo_respuesta_hrs' ? (sortConfig.direction === 'ascending' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : <span className="opacity-0 group-hover:opacity-50 transition-opacity"><ChevronUp size={14}/></span>}</div>
                    </th>
                    <th className="p-4 font-bold text-center bg-black">Adjuntos</th>
                    <th className="p-4 font-bold text-center bg-zinc-900 border-l border-zinc-800">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredAndSortedLeads.length === 0 ? (
                    <tr>
                      <td colSpan="14" className="p-16 text-center text-zinc-500 text-sm">
                        {isLoadingData ? 'Cargando datos desde SharePoint...' : searchTerm || filterAsesor || filterEstado || filterMes || filterFuente || filterCampania ? 'No se encontraron resultados para los filtros actuales.' : 'No hay datos registrados. Haz clic en "Actualizar" para traerlos de SharePoint.'}
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedLeads.map((lead, index) => (
                      <tr key={`lead-${lead.id || index}`} className="hover:bg-zinc-50 transition-colors group text-sm text-zinc-700">
                        <td className="p-4 font-black text-indigo-600 text-center">#{lead.id}</td>
                        <td className="p-4 font-bold text-black">{lead.titulo || '-'}</td>
                        <td className="p-4">{lead.fecha_ingreso ? new Date(lead.fecha_ingreso).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'short' }) : '-'}</td>
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
                            <a 
                              href={lead.link_adjuntos} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center justify-center p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                              title="Abrir adjuntos"
                            >
                              <LinkIcon size={18} />
                            </a>
                          ) : (
                            <div 
                              className="inline-flex items-center justify-center p-2 text-zinc-300 cursor-not-allowed"
                              title="Sin adjuntos"
                            >
                              <LinkIcon size={18} />
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-center border-l border-zinc-200 bg-zinc-50 group-hover:bg-zinc-100 transition-colors">
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              onClick={() => handleEditLead(lead)} 
                              className="p-2 text-zinc-500 hover:text-black hover:bg-white border border-transparent hover:border-zinc-300 hover:shadow-sm rounded-sm transition-all flex items-center justify-center"
                              title="Editar Registro"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => setLeadToDelete(lead)} 
                              className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 hover:shadow-sm rounded-sm transition-all flex items-center justify-center"
                              title="Eliminar Registro"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {leadToDelete && (
          <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-sm w-full max-w-md shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden border border-zinc-200">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4 text-red-600">
                  <Trash2 size={24} />
                  <h3 className="text-lg font-bold text-black tracking-wide">Eliminar Registro</h3>
                </div>
                <p className="text-sm text-zinc-600 leading-relaxed mb-1">
                  ¿Estás seguro de que deseas eliminar permanentemente a <strong className="text-black">{leadToDelete.titulo || 'este lead'}</strong>?
                </p>
                <p className="text-xs text-zinc-500 font-medium">Esta acción eliminará el registro en SharePoint y no se puede deshacer.</p>
              </div>
              <div className="bg-zinc-50 border-t border-zinc-200 p-4 flex justify-end items-center gap-3">
                <button 
                  onClick={() => setLeadToDelete(null)} 
                  disabled={isDeleting} 
                  className="bg-white hover:bg-zinc-100 text-zinc-700 px-5 py-2.5 rounded-sm font-bold text-sm border border-zinc-300 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={executeDelete} 
                  disabled={isDeleting} 
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-2.5 rounded-sm font-bold text-sm transition-all flex items-center gap-2 shadow-sm"
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && editingLeadId && (
           <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
             <div className="bg-zinc-100 rounded-sm w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] border border-zinc-300 animate-in zoom-in-95 duration-200">
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
                
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                   <form id="editForm" onSubmit={handleSubmit} className="space-y-6">
                      {renderFormFields()}
                   </form>
                </div>

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

        {currentView === 'reports' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-sm shadow-sm border border-zinc-200">
               <h2 className="text-sm font-bold text-black uppercase tracking-widest flex items-center gap-2">
                 <BarChart3 size={18}/> Panel de Métricas
               </h2>
               
               <div className="flex flex-wrap items-center gap-4">
                 <button 
                   onClick={handleDownloadCSV}
                   disabled={!reportes}
                   className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border border-blue-200 px-4 py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   title="Descargar Reporte en CSV"
                 >
                   <Download size={16} />
                   <span className="hidden sm:inline">Descargar CSV</span>
                 </button>
                 
                 <div className="w-px h-8 bg-zinc-200 hidden md:block"></div>

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
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Efectividad (Ventas)</h3>
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
                      <span className="text-xs text-zinc-500 font-bold uppercase">Calientes</span>
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
                  {/* Gráfico de Barras Vertical: Calificación */}
                  <div className="bg-white p-6 rounded-sm shadow-sm border border-zinc-200 flex flex-col">
                    <h3 className="text-sm font-bold text-black uppercase tracking-wide mb-6 border-b border-zinc-100 pb-3">Desglose por Calificación</h3>
                    <div className="flex h-48 items-end justify-around gap-4 mt-auto border-b border-zinc-100 pb-2">
                      {['Caliente', 'Tibio', 'Frío', 'Por evaluar'].map(cat => {
                        const count = reportes.calificacionCount[cat] || 0;
                        const percent = reportes.total > 0 ? (count / reportes.total) * 100 : 0;
                        return (
                          <div key={cat} className="flex flex-col items-center justify-end w-full group h-full">
                            <span className="text-xs font-bold text-zinc-500 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">{count} ({percent.toFixed(0)}%)</span>
                            <div 
                              className={`w-full max-w-[40px] rounded-t-sm transition-all duration-500 hover:opacity-80 ${cat === 'Caliente' ? 'bg-red-500' : cat === 'Tibio' ? 'bg-orange-400' : cat === 'Frío' ? 'bg-blue-400' : 'bg-purple-500'}`} 
                              style={{ height: `${Math.max(percent, 2)}%` }}
                            ></div>
                            <span className="text-[10px] font-bold text-zinc-600 mt-2 text-center break-words w-full px-1">{cat}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Origen de Captación */}
                  <div className="bg-white p-6 rounded-sm shadow-sm border border-zinc-200">
                    <h3 className="text-sm font-bold text-black uppercase tracking-wide mb-6 border-b border-zinc-100 pb-3">Origen de Captación</h3>
                    <div className="flex items-center justify-center gap-12 h-48">
                      <div className="text-center group">
                        <div className="w-24 h-24 rounded-full border-[8px] border-emerald-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                          <p className="text-2xl font-black text-black">{reportes.organicos}</p>
                        </div>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Orgánico / SEO</p>
                      </div>
                      <div className="w-px h-24 bg-zinc-200"></div>
                      <div className="text-center group">
                        <div className="w-24 h-24 rounded-full border-[8px] border-indigo-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                          <p className="text-2xl font-black text-black">{reportes.pauta}</p>
                        </div>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Pauta / Pago</p>
                      </div>
                    </div>
                  </div>

                  {/* Estado de las Órdenes */}
                  <div className="bg-white p-6 rounded-sm shadow-sm border border-zinc-200">
                    <h3 className="text-sm font-bold text-black uppercase tracking-wide mb-6 border-b border-zinc-100 pb-3 flex items-center gap-2">
                       Estado de las Órdenes
                    </h3>
                    <div className="flex items-center justify-center gap-8 h-48">
                      <div className="text-center group flex-1 bg-zinc-50 p-4 rounded-sm border border-zinc-200 hover:border-black transition-colors">
                        <Briefcase size={28} className="text-zinc-400 mb-3 mx-auto" />
                        <p className="text-4xl font-black text-black">{reportes.ordenesAbiertas}</p>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-2">Abiertas</p>
                      </div>
                      <div className="text-center group flex-1 bg-zinc-50 p-4 rounded-sm border border-zinc-200 hover:border-black transition-colors">
                        <CheckCircle size={28} className="text-zinc-400 mb-3 mx-auto" />
                        <p className="text-4xl font-black text-black">{reportes.ordenesCerradas}</p>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-2">Cerradas</p>
                      </div>
                    </div>
                  </div>

                  {/* Horarios de Ingreso */}
                  <div className="bg-white p-6 rounded-sm shadow-sm border border-zinc-200">
                    <h3 className="text-sm font-bold text-black uppercase tracking-wide mb-6 border-b border-zinc-100 pb-3 flex items-center gap-2">
                       Tiempos de Ingreso
                    </h3>
                    <div className="grid grid-cols-2 gap-4 h-full">
                      <div className="bg-zinc-50 p-4 rounded-sm border border-zinc-200 flex flex-col items-center justify-center text-center hover:border-black transition-colors">
                        <Moon size={28} className="text-zinc-400 mb-3" />
                        <p className="text-4xl font-black text-black">{reportes.fueraHorario}</p>
                        <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wide mt-2">Fuera de Horario</p>
                        <p className="text-[10px] text-zinc-400 mt-1">(Antes 8am / Desp 6pm)</p>
                      </div>
                      <div className="bg-zinc-50 p-4 rounded-sm border border-zinc-200 flex flex-col items-center justify-center text-center hover:border-black transition-colors">
                        <CalendarX size={28} className="text-zinc-400 mb-3" />
                        <p className="text-4xl font-black text-black">{reportes.finDeSemana}</p>
                        <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wide mt-2">Fin de Semana</p>
                        <p className="text-[10px] text-zinc-400 mt-1">(Sábados y Domingos)</p>
                      </div>
                    </div>
                  </div>

                  {/* Gráfico Barras Horizontales: Acciones */}
                  <div className="bg-white p-6 rounded-sm shadow-sm border border-zinc-200">
                    <h3 className="text-sm font-bold text-black uppercase tracking-wide mb-6 border-b border-zinc-100 pb-3">Embudo de Acciones</h3>
                    <div className="space-y-5 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                      {Object.entries(reportes.accionesCount).sort((a,b) => b[1] - a[1]).map(([accion, count]) => {
                        const percent = reportes.total > 0 ? (count / reportes.total) * 100 : 0;
                        return (
                          <div key={accion} className="group">
                            <div className="flex justify-between text-xs font-bold mb-1.5">
                              <span className="text-zinc-700">{accion}</span>
                              <span className="text-black">{count} <span className="text-zinc-400 text-[10px]">({percent.toFixed(0)}%)</span></span>
                            </div>
                            <div className="w-full bg-zinc-100 h-3 rounded-sm overflow-hidden">
                              <div className="h-full rounded-sm bg-emerald-500 group-hover:bg-emerald-600 transition-colors" style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Gráfico Barras Horizontales: Líneas de Interés */}
                  <div className="bg-white p-6 rounded-sm shadow-sm border border-zinc-200">
                    <h3 className="text-sm font-bold text-black uppercase tracking-wide mb-6 border-b border-zinc-100 pb-3">Líneas de Interés Solicitadas</h3>
                    <div className="space-y-5 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                      {Object.entries(reportes.lineasCount).sort((a,b) => b[1] - a[1]).map(([linea, count]) => {
                        const percent = reportes.total > 0 ? (count / reportes.total) * 100 : 0;
                        return (
                          <div key={linea} className="group">
                            <div className="flex justify-between text-xs font-bold mb-1.5">
                              <span className="text-zinc-700">{linea}</span>
                              <span className="text-black">{count} <span className="text-zinc-400 text-[10px]">({percent.toFixed(0)}%)</span></span>
                            </div>
                            <div className="w-full bg-zinc-100 h-3 rounded-sm overflow-hidden">
                              <div className="h-full rounded-sm bg-black group-hover:bg-indigo-600 transition-colors" style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Métrica de Leads Perdidos reubicada */}
                  <div className="bg-red-50 p-6 rounded-sm shadow-sm border border-red-100 flex flex-col justify-center items-center text-center group transition-colors hover:bg-red-100 min-h-[200px]">
                    <UserX size={48} className="text-red-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="text-sm font-bold text-red-800 uppercase tracking-wide mb-2">Total Leads Perdidos</h3>
                    <p className="text-6xl font-black text-red-600">{reportes.totalPerdidos}</p>
                    <p className="text-xs text-red-500 mt-2 font-medium">En el periodo seleccionado</p>
                  </div>

                  {/* Métrica de Ventas Cerradas (Nueva) */}
                  <div className="bg-emerald-50 p-6 rounded-sm shadow-sm border border-emerald-100 flex flex-col justify-center items-center text-center group transition-colors hover:bg-emerald-100 min-h-[200px]">
                    <TrendingUp size={48} className="text-emerald-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wide mb-2">Total Ventas Cerradas</h3>
                    <p className="text-6xl font-black text-emerald-600">{reportes.ventasCerradas}</p>
                    <p className="text-xs text-emerald-500 mt-2 font-medium">En el periodo seleccionado</p>
                  </div>
                </div>

                {/* Análisis de Rendimiento por Asesor (Tabla Completa) */}
                <div className="bg-white rounded-sm shadow-sm border border-zinc-200 overflow-hidden mt-6">
                  <div className="p-6 border-b border-zinc-100 bg-zinc-50">
                    <h3 className="text-sm font-bold text-black uppercase tracking-wide flex items-center gap-2">
                      <Briefcase size={18} className="text-black" /> Análisis de Rendimiento por Asesor
                    </h3>
                  </div>
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-white text-zinc-500 text-[10px] tracking-widest uppercase border-b border-zinc-200">
                          <th className="p-4 font-bold">Nombre del Asesor</th>
                          <th className="p-4 font-bold text-center border-l border-zinc-100">Leads Asignados</th>
                          <th className="p-4 font-bold text-center border-l border-zinc-100 text-emerald-600">Ventas Cerradas</th>
                          <th className="p-4 font-bold text-center border-l border-zinc-100 text-red-500">Leads Perdidos</th>
                          <th className="p-4 font-bold text-center border-l border-zinc-100 text-black bg-zinc-50">% Efectividad</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-sm">
                        {reportes.rendimientoArray.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="p-8 text-center text-zinc-500 text-xs">No hay datos de asesores en el periodo seleccionado.</td>
                          </tr>
                        ) : (
                          reportes.rendimientoArray.map((asesor, index) => (
                            <tr key={asesor.nombre || index} className="hover:bg-zinc-50 transition-colors group text-zinc-700">
                              <td className="p-4 font-bold text-black">{asesor.nombre}</td>
                              <td className="p-4 text-center font-medium">{asesor.asignados}</td>
                              <td className="p-4 text-center font-bold text-emerald-600 bg-emerald-50/30">{asesor.ventas}</td>
                              <td className="p-4 text-center font-bold text-red-500 bg-red-50/30">{asesor.perdidos}</td>
                              <td className="p-4 text-center font-black text-black bg-zinc-50 group-hover:bg-zinc-100 transition-colors border-l border-zinc-100">{asesor.efectividad}%</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {showLogsModal && (
          <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
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
                           <div key={`log-${i}`} className="flex gap-4 border-b border-zinc-800 pb-2">
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

        {showAdminModal && (
          <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
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
                </div>
                
                <button 
                  onClick={() => setShowAdminModal(false)} 
                  className="p-4 text-zinc-500 hover:text-black transition-colors bg-white border-l border-zinc-200 shrink-0 z-10 drop-shadow-sm"
                  title="Cerrar (ESC)"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-7 overflow-y-auto flex-1 custom-scrollbar">
                {adminTab === 'asesores' && (
                  <div className="animate-in fade-in">
                    <div className="flex flex-col gap-3 mb-6 bg-zinc-50 p-4 border border-zinc-200 rounded-sm">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input 
                          type="text" value={newAsesorName} onChange={(e) => setNewAsesorName(e.target.value)}
                          placeholder="Nombre del asesor..."
                          className="flex-1 rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-white"
                        />
                        <input 
                          type="email" value={newAsesorEmail} onChange={(e) => setNewAsesorEmail(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddAsesor()}
                          placeholder="Correo del asesor..."
                          className="flex-1 rounded-sm border-zinc-300 border p-3 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-white"
                        />
                        <button onClick={handleAddAsesor} disabled={!newAsesorName.trim()} className="bg-black hover:bg-zinc-800 disabled:bg-zinc-300 text-white px-5 py-3 rounded-sm font-bold text-sm transition-colors flex items-center justify-center gap-2 sm:w-auto w-full">
                          <UserPlus size={16} /> Agregar
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 pr-2">
                      {asesoresList.map(asesor => (
                        <div key={asesor.nombre} className="flex items-center justify-between bg-white border border-zinc-200 p-3.5 rounded-sm hover:border-black transition-colors">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-black">{asesor.nombre}</span>
                            {asesor.correo && <span className="text-xs text-zinc-500 font-mono mt-0.5">{asesor.correo}</span>}
                          </div>
                          <button onClick={() => handleRemoveAsesor(asesor.nombre)} className="text-zinc-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ============================================================================
// PUNTO DE ENTRADA Y ENVOLTORIO PRINCIPAL
// ============================================================================
export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Esperamos a que MSAL (o el Mock) se inicialice correctamente antes de renderizar
    msalInstance.initialize().then(() => {
      setIsInitialized(true);
    });
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50">
        <Loader2 size={32} className="animate-spin text-zinc-400 mb-4" />
        <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Iniciando seguridad...</p>
      </div>
    );
  }

  return (
    <MsalProvider instance={msalInstance}>
      <AuthGuard />
    </MsalProvider>
  );
}

function AuthGuard() {
  const isAuthenticated = useIsAuthenticated();
  return isAuthenticated ? <MainApp /> : <PantallaLoginMS />;
}