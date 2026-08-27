import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { LayoutDashboard, Package, ShoppingCart, Users, ClipboardList, Wallet, Receipt, BarChart3, Plus, Search, Save, Microscope, Pencil, Trash2, RotateCcw, Settings } from 'lucide-react';
import './styles.css';
import initialInventory from './inventory-data.json';
import initialCrystalCatalog from './crystal-catalog.json';

const SUPABASE_URL = 'https://dnxrmgpjzwodtlcchqsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRueHJtZ3BqendvZHRsY2NocXN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NDMyMjksImV4cCI6MjEwMjQxOTIyOX0.W-MyD3umnTM1H7ICfvrBvx-eOFnxUlXmGs0fexK1Skg';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const CLOUD_STATE_ID = 'gafascity-main';
const ADMIN_EMAILS = ['admin@gafascity.com'];
const EMPLOYEE_EMAILS = ['empleado1@gafascity.com','empleado2@gafascity.com','empleado3@gafascity.com','empleado4@gafascity.com'];
const STAFF_NAMES = {
  'admin@gafascity.com': 'Administrador',
  'empleado1@gafascity.com': 'Rhoy',
  'empleado2@gafascity.com': 'Ely',
  'empleado3@gafascity.com': 'Anyi',
  'empleado4@gafascity.com': 'Yngrid'
};
const SUPERVISOR_CODE = '2468';
const SALE_COMMISSION = 0.50;
const ELY_LAB_COMMISSION = 0.25;
const getUserRole = (email = '') => { const e = email.toLowerCase(); if (ADMIN_EMAILS.includes(e)) return 'admin'; if (e === 'empleado4@gafascity.com') return 'formula'; return 'empleado'; };
const getStaffName = (email = '') => STAFF_NAMES[email.toLowerCase()] || email || 'Usuario';

const today = () => new Intl.DateTimeFormat('en-CA',{timeZone:'America/Caracas',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const money = (n) => `$${Number(n || 0).toFixed(2)}`;
const uid = () => Math.random().toString(36).slice(2, 9);
const bs = (n) => `Bs. ${Number(n || 0).toFixed(2)}`;
const csvText = (rows) => {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const clean = (v) => `"${String(v ?? '').replaceAll('\"', '\"\"')}"`;
  return [headers.join(','), ...rows.map(row => headers.map(h => clean(row[h])).join(','))].join('\n');
};
const downloadCSV = (name, rows) => {
  if (!rows.length) return alert('No hay datos para exportar');
  const blob = new Blob([csvText(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}-${today()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
const inDateRange = (date, from, to) => (!from || date >= from) && (!to || date <= to);
const containsText = (obj, query) => !query || JSON.stringify(obj).toLowerCase().includes(query.toLowerCase());
const fieldHelp = (label = '') => {
  const l = String(label).toLowerCase();
  const required = ['codigo', 'descripcion', 'nombre', 'telefono', 'producto', 'cantidad', 'monto total', 'total', 'laboratorio', 'fecha'].some(x => l.includes(x));
  let text = 'Complete este campo según la operación que está registrando.';
  if (l.includes('codigo')) text = 'Use el código interno del producto u orden. Ejemplo: OK1602, RB101 o GC-0001.';
  else if (l.includes('fecha')) text = 'Seleccione la fecha real del movimiento para que filtros, caja y reportes cuadren.';
  else if (l.includes('categoria')) text = 'Clasifique el registro. Ejemplo: Montura, Cristal, Accesorio, Servicio u Otros.';
  else if (l.includes('descripcion')) text = 'Escriba el nombre claro del producto o concepto. Ejemplo: Oakley Conductor.';
  else if (l.includes('cantidad')) text = 'Indique cuántas unidades entran, salen o se venden.';
  else if (l.includes('costo')) text = 'Monto que le cuesta a la tienda. Sirve para calcular valor de inventario.';
  else if (l.includes('precio')) text = 'Precio de venta al cliente en USD.';
  else if (l.includes('stock')) text = 'Existencia disponible. Si registra una venta, baja automáticamente.';
  else if (l.includes('cliente') || l.includes('nombre')) text = 'Escriba nombre y apellido del cliente para poder buscarlo después.';
  else if (l.includes('telefono')) text = 'Número de contacto para seguimiento, entrega o notificación.';
  else if (l.includes('laboratorio')) text = 'Seleccione el laboratorio responsable del trabajo para poder filtrarlo luego.';
  else if (l.includes('cristal')) text = 'Tipo de cristal solicitado. Ejemplo: monofocal, bifocal, progresivo.';
  else if (l.includes('tratamiento')) text = 'Tratamiento del cristal. Ejemplo: antirreflejo, blue, fotocromático.';
  else if (l.includes('formula')) text = 'Coloque la fórmula tal como aparece en el récipe.';
  else if (l.includes('montura')) text = 'Indique la montura asociada al trabajo, si aplica.';
  else if (l.includes('metodo')) text = 'Seleccione cómo pagó el cliente. Esto alimenta Caja diaria.';
  else if (l.includes('abono')) text = 'Monto abonado por el cliente. La resta se calcula automáticamente.';
  else if (l.includes('referencia')) text = 'Coloque referencia de pago móvil, transferencia u observación del pago.';
  else if (l.includes('resta')) text = 'Saldo pendiente del cliente. Se calcula con total menos abono.';
  else if (l.includes('estatus')) text = 'Estado real del trabajo: en tienda, enviado, proceso o entregado.';
  else if (l.includes('pago laboratorio')) text = 'Indique si el laboratorio ya fue pagado o queda pendiente.';
  else if (l.includes('notificado')) text = 'Marque si ya se avisó al cliente que el trabajo está listo o en seguimiento.';
  else if (l.includes('garantia')) text = 'Indique si la venta u orden aplica garantía.';
  else if (l.includes('tasa')) text = 'Coloque la tasa BCV del día para convertir USD a bolívares.';
  return { required, text };
};
const paymentOptions = ['Efectivo','Pago movil','Divisas','Transferencia','Mixto','Zelle','Binance','Punto','Cashea'];
const saleCategoryOptions = ['Montura','Lentes de sol','Accesorios','Servicios','Examen','Montaje','Exhibidores','Estuches','Otros'];
const salePaid = (sale) => Number(sale?.paidAmount ?? sale?.total ?? 0);
const saleBalance = (sale) => Math.max(0, Number(sale?.balance ?? (Number(sale?.total||0) - salePaid(sale))));
const salePaymentStatus = (sale) => saleBalance(sale) <= 0 ? 'Pagado' : (salePaid(sale) > 0 ? 'Abonado' : 'Pendiente');
const defaultLabs = ['Novak', 'Opas (Vector)', 'Liberty', 'Prats', 'Jesus Tallador', 'Fer Visprolentes'];

const seed = {
  products: initialInventory,
  crystalCatalog: initialCrystalCatalog,
  customers: [
    { id:'c1', name:'Cliente prueba 1', phone:'0412-0000000', notes:'Cliente frecuente' },
    { id:'c2', name:'Cliente prueba 2', phone:'0414-0000000', notes:'Pendiente por retirar' }
  ],
  laboratories: defaultLabs.map((name, i) => ({ id:`lab${i+1}`, name, phone:'', notes:'' })),
  sales: [
    { id:'s1', date:today(), customerName:'Cliente prueba 1', productId:'p1', productCodeName:'OK1602 - Oakley Conductor', category:'Montura', description:'Oakley Conductor', qty:1, payment:'Efectivo', total:25, warranty:'No', cancelled:false }
  ],
  orders: [
    { id:'o1', number:'GC-0001', date:today(), responsible:'Admin', customer:'Cliente prueba 2', idCard:'', age:'', phone:'0414-0000000', lab:'Novak', lens:'Monofocal', treatment:'Antirreflejo', prescription:'OD -1.25 / OI -1.00', frame:'', total:80, paymentMethod:'Efectivo', deposit:40, depositReference:'', balance:40, balanceReference:'', status:'En la tienda', labPayment:'No pago', sentDate:'', deliveredDate:'', notifiedClient:'No', opticalAmount:0, deliveryDate:today(), warranty:'No', notes:'' }
  ],
  expenses: [{ id:'e1', date:today(), category:'Operativo', description:'Fundas', amount:10 }],
  cash: { opening:100, usdReceived:0, pagoMovilReceived:0, transferReceived:0, divisasReceived:0, purchases:0, otherExpenses:0, closingCash:0, closingPagoMovil:0, notes:'' },
  settings: { businessName:'GafasCity ERP', subtitle:'Gestion optica interna', logo:'', versionTitle:'Producción Final cliente consolidada', versionDescription:'Inventario físico y catálogo de cristales separados', commissionsEnabled:false, exchangeRate:0, exchangeRateDate:today() }
};

function normalizeStore(raw = {}) {
  const base = seed;
  raw = raw || {};
  return {
    ...base,
    ...raw,
    products: (!Array.isArray(raw.products) || raw.products.length<100 || raw.products.some(p=>String(p.id||'').startsWith('imp-cr-'))) ? initialInventory : raw.products.filter(p=>p.category!=='Cristales'),
    crystalCatalog: Array.isArray(raw.crystalCatalog) && raw.crystalCatalog.length ? raw.crystalCatalog : initialCrystalCatalog,
    customers: Array.isArray(raw.customers) ? raw.customers : [],
    laboratories: Array.isArray(raw.laboratories) && raw.laboratories.length ? raw.laboratories : base.laboratories,
    sales: Array.isArray(raw.sales) ? raw.sales : [],
    orders: Array.isArray(raw.orders) ? raw.orders : [],
    expenses: Array.isArray(raw.expenses) ? raw.expenses : [],
    payments: Array.isArray(raw.payments) ? raw.payments : [],
    cashHistory: Array.isArray(raw.cashHistory) ? raw.cashHistory : [],
    cash: { ...base.cash, ...(raw.cash || {}) },
    settings: { ...base.settings, ...(raw.settings || {}) }
  };
}

function loadStore(){
  try {
    const raw = localStorage.getItem('gafascity-store-v2');
    return normalizeStore(raw ? JSON.parse(raw) : seed);
  } catch (error) {
    console.error('Error cargando datos locales', error);
    return normalizeStore(seed);
  }
}

class ErrorBoundary extends React.Component {
  constructor(props){super(props);this.state={error:null};}
  static getDerivedStateFromError(error){return {error};}
  componentDidCatch(error, info){console.error(error, info);}
  render(){
    if(this.state.error){return <div className="appError"><h2>Ocurrió un error controlado</h2><p>{String(this.state.error?.message || this.state.error)}</p><button onClick={()=>{localStorage.removeItem('gafascity-store-v2');location.reload();}}>Limpiar datos locales y recargar</button></div>;}
    return this.props.children;
  }
}

function App(){
  const [active,setActive] = useState('dashboard');
  const [store,setStore] = useState(loadStore);
  const [query,setQuery] = useState('');
  const [session,setSession] = useState(null);
  const [cloudStatus,setCloudStatus] = useState('Sin sincronizar');
  const [sidebarCollapsed,setSidebarCollapsed]=useState(()=>localStorage.getItem('gc-sidebar-collapsed')==='1');
  const toggleSidebar=()=>setSidebarCollapsed(v=>{localStorage.setItem('gc-sidebar-collapsed',v?'0':'1');return !v});

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session)=>setSession(session));
    return ()=>listener.subscription.unsubscribe();
  },[]);

  useEffect(()=>localStorage.setItem('gafascity-store-v2', JSON.stringify(store)), [store]);

  const setList = (key, updater) => setStore(prev => ({...prev, [key]: typeof updater === 'function' ? updater(prev[key]) : updater}));

  const saveCloud = async () => {
    setCloudStatus('Guardando en Supabase...');
    const { error } = await supabase.from('app_state').upsert({ id: CLOUD_STATE_ID, data: store, updated_at: new Date().toISOString() });
    if(error){ setCloudStatus('Error guardando'); alert(error.message); return; }
    setCloudStatus('Guardado en nube');
  };

  const updateStoreAndCloud = (updater, message='Guardado automático') => {
    setStore(prev => {
      const next = normalizeStore(typeof updater === 'function' ? updater(normalizeStore(prev)) : updater);
      localStorage.setItem('gafascity-store-v2', JSON.stringify(next));
      setCloudStatus('Guardando automático...');
      supabase.from('app_state').upsert({ id: CLOUD_STATE_ID, data: next, updated_at: new Date().toISOString() })
        .then(({ error }) => setCloudStatus(error ? 'Error guardando' : message));
      return next;
    });
  };

  const loadCloud = async () => {
    setCloudStatus('Cargando desde Supabase...');
    const { data, error } = await supabase.from('app_state').select('data').eq('id', CLOUD_STATE_ID).maybeSingle();
    if(error){ setCloudStatus('Error cargando'); alert(error.message); return; }
    if(data?.data){ setStore(normalizeStore(data.data)); setCloudStatus('Cargado desde nube'); }
    else { setCloudStatus('No hay respaldo en nube'); alert('Todavía no hay datos guardados en Supabase. Guarda primero desde esta app.'); }
  };

  const stats = useMemo(()=>{
    const activeSales = (store.sales||[]).filter(s=>!s.cancelled);
    const salesToday = activeSales.filter(s=>s.date===today()).reduce((a,s)=>a+Number(s.total),0);
    const salesByMethod = {
      efectivo: activeSales.filter(s=>s.date===today() && s.payment==='Efectivo').reduce((a,s)=>a+Number(s.total),0),
      pagoMovil: activeSales.filter(s=>s.date===today() && s.payment==='Pago movil').reduce((a,s)=>a+Number(s.total),0),
      divisas: activeSales.filter(s=>s.date===today() && s.payment==='Divisas').reduce((a,s)=>a+Number(s.total),0),
      transferencia: activeSales.filter(s=>s.date===today() && s.payment==='Transferencia').reduce((a,s)=>a+Number(s.total),0),
      mixto: activeSales.filter(s=>s.date===today() && s.payment==='Mixto').reduce((a,s)=>a+Number(s.total),0),
      punto: activeSales.filter(s=>s.date===today() && s.payment==='Punto').reduce((a,s)=>a+Number(s.total),0),
      cashea: activeSales.filter(s=>s.date===today() && s.payment==='Cashea').reduce((a,s)=>a+Number(s.total),0)
    };
    const expensesToday = (store.expenses||[]).filter(e=>e.date===today()).reduce((a,e)=>a+Number(e.amount),0);
    const lowStock = (store.products||[]).filter(p=>Number(p.stock)<Number(p.minStock||1));
    const pendingOrders = (store.orders||[]).filter(o=>o.status!=='Entregado');
    const cash = store.cash || {};
    const manualIncome = Number(cash.usdReceived||0) + Number(cash.pagoMovilReceived||0) + Number(cash.transferReceived||0) + Number(cash.divisasReceived||0);
    const manualOut = Number(cash.purchases||0) + Number(cash.otherExpenses||0);
    const cashBalance = Number(cash.opening||0) + salesToday + manualIncome - expensesToday - manualOut;
    const expectedCashClose = Number(cash.opening||0) + salesByMethod.efectivo + Number(cash.usdReceived||0) + Number(cash.divisasReceived||0) - expensesToday - manualOut;
    const expectedPagoMovilClose = salesByMethod.pagoMovil + Number(cash.pagoMovilReceived||0);
    const expectedTransferClose = salesByMethod.transferencia + Number(cash.transferReceived||0);
    const closingDiff = Number(cash.closingCash||0) + Number(cash.closingPagoMovil||0) - cashBalance;
    const pendingBalances = (store.orders||[]).reduce((a,o)=>a+Number(o.balance||0),0);
    return { activeSales, salesToday, salesByMethod, expensesToday, lowStock, pendingOrders, cashBalance, expectedCashClose, expectedPagoMovilClose, expectedTransferClose, closingDiff, pendingBalances };
  },[store]);
  const userEmail = session?.user?.email?.toLowerCase() || '';
  const role = getUserRole(userEmail);
  const isAdmin = role === 'admin';
  const isFormulaUser = role === 'formula';
  const adminNav = [
    ['dashboard','Inicio',LayoutDashboard], ['sales','Ventas',ShoppingCart], ['payments','Abonos / Cuentas',Wallet], ['clinical','Fórmulas / Historial',ClipboardList], ['orders','Trabajo óptico',ClipboardList], ['labs','Laboratorios',Microscope], ['inventory','Inventario',Package], ['crystals','Catálogo cristales',Search], ['customers','Clientes',Users], ['cash','Caja diaria',Wallet], ['expenses','Gastos',Receipt], ['commissions','Comisiones',BarChart3], ['delayed','Límite de entrega',Receipt], ['reports','Reportes',BarChart3], ['config','Configuracion',Settings]
  ];
  const employeeNav = [
    ['sales','Registrar venta',ShoppingCart], ['inventoryAdd','Agregar inventario',Package], ['orders','Trabajo óptico',ClipboardList], ['payments','Abonos',Wallet], ['labs','Laboratorios',Microscope], ['tracking','Seguimiento de trabajos',ClipboardList]
  ];
  const formulaNav = [
    ['clinical','Fórmulas / Historial',ClipboardList], ['tracking','Seguimiento de trabajos',ClipboardList]
  ];
  const nav = isAdmin ? adminNav : (isFormulaUser ? formulaNav : employeeNav);
  const displayActive = nav.some(n => n[0] === active) ? active : (isAdmin ? 'dashboard' : (isFormulaUser ? 'clinical' : 'sales'));

  if(!session) return <Login settings={store.settings||{}} />;

  return <div className={`app ${sidebarCollapsed?'sidebarCollapsed':''}`}><aside className="sidebar"><button className="sidebarToggle" onClick={toggleSidebar} title={sidebarCollapsed?'Abrir menú':'Cerrar menú'}>{sidebarCollapsed?'›':'‹'}</button><div className="brand">{store.settings?.logo ? <img className="logoImg" src={store.settings.logo} alt="Logo"/> : <span>GC</span>}<div><b>{store.settings?.businessName || 'GafasCity ERP'}</b><small>{store.settings?.subtitle || 'Gestion optica interna'}</small></div></div><nav>{nav.map(([id,label,Icon])=><button key={id} onClick={()=>setActive(id)} className={displayActive===id?'active':''}><Icon size={18}/><span className="navLabel">{label}</span></button>)}</nav><div className="statusBox"><b>{store.settings?.versionTitle || 'Version 4'}</b><span>{store.settings?.versionDescription || 'Caja diaria mejorada y logo editable.'}</span></div></aside><main><header className="topbar"><div><h1>{nav.find(n=>n[0]===displayActive)?.[1]}</h1><p>Flujo basado en inventario, ventas, trabajos de formula y laboratorios.</p></div><div className="actions topActions"><span className="badge">{isAdmin ? 'Admin' : (isFormulaUser ? 'Fórmulas' : 'Empleado')} - {cloudStatus}</span>{isAdmin&&<button className="secondary" onClick={loadCloud}>Cargar nube</button>}{isAdmin&&<button onClick={saveCloud}>Guardar nube</button>}<button className="ghost" onClick={()=>supabase.auth.signOut()}>Salir</button>{isAdmin&&<button className="ghost" onClick={()=>{if(confirm('Esto reinicia los datos locales.')){localStorage.removeItem('gafascity-store-v2');location.reload();}}}>Reiniciar local</button>}</div></header>{isAdmin && displayActive==='dashboard'&&<Dashboard store={store} stats={stats}/>} {isAdmin && displayActive==='inventory'&&<Inventory products={store.products||[]} setList={setList} query={query} setQuery={setQuery}/>} {isAdmin && displayActive==='crystals'&&<CrystalCatalog catalog={store.crystalCatalog||[]} setStore={updateStoreAndCloud}/>}  {displayActive==='sales'&&(isAdmin ? <Sales store={store} setStore={updateStoreAndCloud} currentUser={userEmail}/> : <EmployeeSales store={store} setStore={updateStoreAndCloud} currentUser={userEmail}/>) } {displayActive==='payments'&&<PaymentsModule store={store} setStore={updateStoreAndCloud} currentUser={userEmail}/>} {displayActive==='clinical'&&<ClinicalModule store={store} setStore={updateStoreAndCloud} currentUser={userEmail}/>} {displayActive==='orders'&&<Orders store={store} setStore={updateStoreAndCloud} currentUser={userEmail} isAdmin={isAdmin}/>} {displayActive==='labs'&&<Laboratories labs={store.laboratories||[]} orders={store.orders||[]} setList={setList} isAdmin={isAdmin}/>} {displayActive==='inventoryAdd'&&<EmployeeInventoryAdd store={store} setStore={updateStoreAndCloud} currentUser={userEmail}/>} {isAdmin && displayActive==='customers'&&<Customers customers={store.customers||[]} setList={setList}/>} {isAdmin && displayActive==='cash'&&<Cash store={store} setStore={setStore} stats={stats}/>} {isAdmin && displayActive==='expenses'&&<Expenses expenses={store.expenses||[]} setList={setList}/>} {isAdmin && displayActive==='commissions'&&<CommissionsModule sales={store.sales||[]} orders={store.orders||[]} enabled={store.settings?.commissionsEnabled===true}/>} {isAdmin && displayActive==='delayed'&&<DelayedSalesModule orders={store.orders||[]} labs={store.laboratories||[]}/>} {isAdmin && displayActive==='reports'&&<Reports store={store} stats={stats}/>} {isAdmin && displayActive==='config'&&<Config store={store} setStore={setStore}/>} {displayActive==='tracking'&&<EmployeeTracking orders={store.orders||[]} labs={store.laboratories||[]} setStore={updateStoreAndCloud} canEdit={!isAdmin}/>}</main></div>;
}

function KPI({label,value,hint}){return <div className="kpi"><span>{label}</span><b>{value}</b>{hint&&<small>{hint}</small>}</div>}
function Card({title,children,action,wide}){return <section className={wide?'card wide':'card'}><div className="cardHead"><h2>{title}</h2>{action}</div>{children}</section>}
function FieldLabel({p}){const h=fieldHelp(p);return <span className="fieldTitle">{p}{h.required&&<b>*</b>}<em title={h.text}>?</em></span>}
function Input({v,on,p,type='text'}){return <label className="field compactField"><FieldLabel p={p}/><input value={v??''} type={type} placeholder={p} onChange={e=>on(e.target.value)}/></label>}
function TextArea({v,on,p,rows=4}){return <label className="field compactField spanAll"><FieldLabel p={p}/><textarea rows={rows} value={v??''} placeholder={p} onChange={e=>on(e.target.value)}/></label>}
function ProductFinder({products,value,onSelect}){
  const [term,setTerm]=useState('');
  const selected=products.find(p=>p.id===value);
  const list=products.filter(p=>containsText({code:p.code,description:p.description,category:p.category},term)).slice(0,10);
  return <div className="productFinder"><label className="field compactField"><FieldLabel p="Código de lente"/><input value={term||selected?.code||''} placeholder="Escribir código o descripción" onChange={e=>setTerm(e.target.value)} /></label>{term&&<div className="finderResults">{list.map(p=><button type="button" className="finderOption" key={p.id} onClick={()=>{onSelect(p.id);setTerm('')}}><b>{p.code}</b><span>{p.description} · Stock {p.stock}</span></button>)}</div>}</div>;}
function SmartFinder({items,value,onSelect,onClear,label,mode='all',placeholder,showMeta=false}){
  const [term,setTerm]=useState(''),[open,setOpen]=useState(false);
  const wrapRef=useRef(null),selected=items.find(x=>x.id===value);
  useEffect(()=>{const close=e=>{if(wrapRef.current&&!wrapRef.current.contains(e.target))setOpen(false)};document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close)},[]);
  const normalizeSearch=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/,/g,'.').replace(/[^a-z0-9.]+/g,' ').trim();
  const getText=x=>mode==='code'?String(x.code||''):mode==='description'?String(x.description||''):[x.code,x.description,x.crystal,x.treatment,x.colors,x.range,x.price].filter(Boolean).join(' ');
  const tokens=normalizeSearch(term).split(' ').filter(Boolean);
  const list=items.filter(x=>tokens.every(t=>normalizeSearch(getText(x)).includes(t)));
  const display=open?term:(mode==='code'?(selected?.code||''):mode==='description'?(selected?.description||''):(selected?[selected.crystal,selected.treatment].filter(Boolean).join(' · '):''));
  return <div className="smartFinder" ref={wrapRef}><label className="field compactField"><FieldLabel p={label}/><div className="finderInputWrap"><input value={display} placeholder={placeholder||label} onFocus={()=>{setOpen(true);setTerm('')}} onChange={e=>{setTerm(e.target.value);setOpen(true)}}/>{selected&&onClear&&<button type="button" className="clearSelection" onClick={()=>{onClear();setTerm('');setOpen(false)}} title="Limpiar selección">×</button>}</div></label>{open&&<div className="finderResults floatingFinder">{list.length?list.map(x=><button type="button" className="finderOption" key={x.id} onClick={()=>{onSelect(x);setOpen(false);setTerm('')}}><b>{x.code||x.crystal}</b><span>{x.description||[x.treatment,x.colors,x.range,money(x.price)].filter(Boolean).join(' · ')}</span>{showMeta&&x.code&&<small>Stock: {Number(x.stock||0)} · {Number(x.price||0)>0?`Precio: ${money(x.price)}`:'Precio pendiente'}</small>}</button>):<div className="noResults">Sin coincidencias</div>}</div>}</div>}
function Select({v,on,opts,p}){const control=<select value={v??''} onChange={e=>on(e.target.value)}>{opts.map(([val,label])=><option key={val} value={val}>{label}</option>)}</select>; if(!p)return control; return <label className="field compactField"><FieldLabel p={p}/>{control}</label>}
function Table({rows,columns,empty='Sin registros'}){if(!rows.length)return <p className="muted">{empty}</p>;return <div className="tableWrap"><table><thead><tr>{columns.map(c=><th key={c[0]}>{c[1]}</th>)}</tr></thead><tbody>{rows.map((r,idx)=><tr key={r.id||idx}>{columns.map(([key,,fmt])=><td key={key}>{fmt?fmt(r[key],r):r[key]}</td>)}</tr>)}</tbody></table></div>}

function Login({settings={}}){
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [mode,setMode]=useState('login');
  const [loading,setLoading]=useState(false);
  const submit = async () => {
    if(!email || !password) return alert('Correo y contraseña son obligatorios');
    setLoading(true);
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setLoading(false);
    if(result.error) return alert(result.error.message);
    if(mode === 'signup') alert('Usuario creado. Si Supabase pide confirmación, revisa el correo antes de entrar.');
  };
  return <div className="loginPage loginV2">
    <div className="loginAurora auroraA"></div><div className="loginAurora auroraB"></div>
    <div className="opticalOrb orbA"></div><div className="opticalOrb orbB"></div><div className="opticalBridge"></div>
    <main className="loginV2Shell">
      <section className="loginHeroPanel">
        <div className="heroBrand">{settings.logo ? <img className="heroLogo" src={settings.logo} alt="Logo GafasCity"/> : <div className="heroLogoFallback">GC</div>}<div><span>GAFASCITY</span><small>Sistema de gestión óptica</small></div></div>
        <div className="heroCopy"><span className="heroPill">OPERACIÓN INTELIGENTE</span><h2>Todo el control de la óptica en un solo lugar.</h2><p>Ventas, inventario, fórmulas, órdenes y laboratorios conectados en una experiencia clara y segura.</p><div className="heroFeatures"><span>✓ Acceso por empleado</span><span>✓ Información sincronizada</span><span>✓ Seguimiento en tiempo real</span></div></div>
        <div className="heroFoot">GafasCity ERP <span>•</span> Producción 3.2</div>
      </section>
      <section className="loginFormPanel">
        <div className="mobileLoginLogo">{settings.logo ? <img src={settings.logo} alt="Logo GafasCity"/> : <span>GC</span>}</div>
        <div className="loginFormHead"><span className="loginMiniLabel">ACCESO SEGURO</span><h1>{mode === 'login' ? 'Iniciar sesión' : 'Crear usuario'}</h1><p>{mode === 'login'?'Ingresa tus datos para continuar al sistema.':'Crea una cuenta autorizada para ingresar.'}</p></div>
        <div className="loginFormBody"><label className="loginV2Field"><span>Correo electrónico</span><div><span className="inputGlyph">@</span><input value={email} placeholder="usuario@gafascity.com" onChange={e=>setEmail(e.target.value)}/></div></label><label className="loginV2Field"><span>Contraseña</span><div><span className="inputGlyph">●</span><input value={password} placeholder="Escribe tu contraseña" type="password" onChange={e=>setPassword(e.target.value)}/></div></label><button className="loginV2Primary" onClick={submit} disabled={loading}>{loading ? 'Procesando...' : (mode === 'login' ? 'Entrar a GafasCity' : 'Crear usuario')}</button><button className="loginV2Link" onClick={()=>setMode(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? '¿Necesitas crear un usuario?' : 'Volver a iniciar sesión'}</button></div>
        <div className="loginSecurity">🔒 Conexión protegida y acceso autorizado</div>
      </section>
    </main>
  </div>  
}

function Guide({title,items}){return <details className="guideCompact"><summary>{title}<span>Ver ayuda</span></summary><ul className="guideList">{items.map((item,index)=><li key={index}>{item}</li>)}</ul></details>}

function EmployeeSales({store,setStore,currentUser}){return <Sales store={store} setStore={setStore} currentUser={currentUser} employeeMode/>;}
function EmployeeTracking({orders,labs,setStore,canEdit}){
  const [filters,setFilters]=useState({q:'',lab:'Todos',status:'Todos'});
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeLabs = Array.isArray(labs) ? labs : [];
  const rows = safeOrders.filter(o => (filters.lab==='Todos'||o.lab===filters.lab) && (filters.status==='Todos'||o.status===filters.status) && containsText(o, filters.q));
  const update=(id,patch)=>{ if(!canEdit || !setStore) return; setStore(prev=>({...prev,orders:(prev.orders||[]).map(o=>o.id===id?{...o,...patch}:o)}),'Estatus actualizado'); };
  return <div className="stack">
    <Guide title="Seguimiento de trabajos" items={["Busca por nombre, teléfono o código de orden.","Usa filtros de laboratorio y estatus para ubicar trabajos.","Actualiza estatus o notificación cuando corresponda."]}/>
    <Card title="Buscar trabajo de paciente" wide><div className="formGrid"><Input v={filters.q} p="Buscar cliente, teléfono u orden" on={v=>setFilters({...filters,q:v})}/><Select p="Laboratorio" v={filters.lab} on={v=>setFilters({...filters,lab:v})} opts={['Todos',...safeLabs.map(l=>l.name)].map(x=>[x,x])}/><Select p="Estatus" v={filters.status} on={v=>setFilters({...filters,status:v})} opts={['Todos','En la tienda','Enviado','Proceso','Entregado'].map(x=>[x,x])}/><div className="totalBox">Resultados:<b>{rows.length}</b></div></div></Card>
    <Card title="Trabajos encontrados" wide><Table rows={rows} columns={[["number","Orden"],["customer","Cliente"],["phone","Teléfono"],["lab","Laboratorio"],["status","Estatus",(v,r)=>canEdit?<select value={v||'En la tienda'} onChange={e=>update(r.id,{status:e.target.value})}>{['En la tienda','Enviado','Proceso','Entregado'].map(x=><option key={x}>{x}</option>)}</select>:(v||'-')],["sentDate","Enviado"],["deliveredDate","Entregado"],["notifiedClient","Notificado",(v,r)=>canEdit?<select value={v||'No'} onChange={e=>update(r.id,{notifiedClient:e.target.value})}>{['No','Si'].map(x=><option key={x}>{x}</option>)}</select>:(v||'No')],["notes","Observaciones"]]}/></Card>
  </div>;
}

function EmployeeInventoryAdd({store,setStore}){
 const blank={code:'',date:today(),category:'Montura',description:'',qty:'',cost:'',price:'',stock:'',minStock:'1'};
 const [form,setForm]=useState(blank),[selectedId,setSelectedId]=useState(null),[filters,setFilters]=useState({code:'',description:''});
 const products=store.products||[],selected=products.find(p=>p.id===selectedId),current=Number(selected?.stock||0),incoming=Number(form.qty||0),newStock=current+incoming;
 const choose=p=>{setSelectedId(p.id);setForm({...blank,...p,qty:'',stock:p.stock,minStock:p.minStock??1})};
 const save=()=>{if(!form.code||!form.description)return alert('Código y descripción son obligatorios');if(incoming<=0)return alert('Indica la cantidad a ingresar');if(selected){setStore(prev=>({...prev,products:(prev.products||[]).map(p=>p.id===selected.id?{...p,stock:newStock,qty:Number(p.qty||0)+incoming}:p)}),'Stock actualizado');}else{const duplicate=products.find(p=>String(p.code).toLowerCase()===String(form.code).toLowerCase());if(duplicate)return alert(`El código ya pertenece a ${duplicate.description}. Selecciónalo en el buscador.`);setStore(prev=>({...prev,products:[...(prev.products||[]),{...form,id:uid(),qty:incoming,stock:incoming,minStock:Number(form.minStock||1),cost:Number(form.cost||0),price:0,pricePending:true}]}),'Producto agregado');}setForm(blank);setSelectedId(null)};
 const filtered=products.filter(p=>(!filters.code||String(p.code).toLowerCase().includes(filters.code.toLowerCase()))&&(!filters.description||String(p.description).toLowerCase().includes(filters.description.toLowerCase())));
 return <div className="stack"><Guide title="Agregar inventario" items={["Busca por código o descripción para sumar existencias sin duplicar productos.","Las monturas no tienen precio fijo; el precio se coloca al registrar cada venta u orden."]}/><Card title={selected?'Sumar existencias':'Agregar producto'} wide><div className="inventorySearchGrid"><SmartFinder items={products} value={selectedId} onSelect={choose} label="Buscar por código" mode="code"/><SmartFinder items={products} value={selectedId} onSelect={choose} label="Buscar por descripción" mode="description"/></div><div className="formGrid"><Input v={form.code} p="Código" on={v=>{setSelectedId(null);setForm({...form,code:v})}}/><Input v={form.date} p="Fecha" type="date" on={v=>setForm({...form,date:v})}/><Select p="Categoría" v={form.category} on={v=>setForm({...form,category:v})} opts={saleCategoryOptions.filter(x=>x!=='Cristales').map(x=>[x,x])}/><Input v={form.description} p="Descripción" on={v=>{setSelectedId(null);setForm({...form,description:v})}}/><Input v={form.qty} p={selected?'Cantidad a ingresar':'Cantidad inicial'} type="number" on={v=>setForm({...form,qty:v})}/><div className="totalBox"><span>Stock actual</span><b>{selected?current:0}</b></div><div className="totalBox strong"><span>Nuevo stock</span><b>{selected?newStock:incoming}</b></div><Input v={form.minStock} p="Nivel mínimo de alerta" type="number" on={v=>setForm({...form,minStock:v})}/>{!selected&&<Input v={form.cost} p="Costo" type="number" on={v=>setForm({...form,cost:v})}/>}<button onClick={save}><Save size={16}/>{selected?'Sumar al inventario':'Agregar producto'}</button></div></Card><Card title="Consultar inventario" wide><div className="formGrid"><Input v={filters.code} p="Filtrar código" on={v=>setFilters({...filters,code:v})}/><Input v={filters.description} p="Filtrar descripción" on={v=>setFilters({...filters,description:v})}/></div><div className="innerScroll"><Table rows={filtered} columns={[["code","Código"],["category","Categoría"],["description","Descripción"],["stock","Stock actual"],["minStock","Nivel mínimo"]]}/></div></Card></div>;
}

function PaymentsModule({store,setStore,currentUser}){
  const [q,setQ]=useState('');
  const [form,setForm]=useState({accountId:'',date:today(),amount:'',method:'Efectivo',reference:'',notes:''});
  const sales=Array.isArray(store.sales)?store.sales:[];
  const orders=(Array.isArray(store.orders)?store.orders:[]).filter(o=>!o.clinical);
  const accounts=[
    ...sales.filter(s=>!s.cancelled&&saleBalance(s)>0).map(s=>({id:`sale:${s.id}`,source:'Venta',sourceId:s.id,number:s.number||s.id,customer:s.customerName||'',idCard:s.idCard||'',phone:s.phone||'',total:Number(s.total||0),paid:salePaid(s),balance:saleBalance(s),date:s.date||'',description:s.productCodeName||s.description||'Venta'})),
    ...orders.filter(o=>Number(o.balance||0)>0).map(o=>({id:`order:${o.id}`,source:'Trabajo óptico',sourceId:o.id,number:o.number||o.id,customer:o.customer||'',idCard:o.idCard||'',phone:o.phone||'',total:Number(o.total||0),paid:Math.max(0,Number(o.total||0)-Number(o.balance||0)),balance:Number(o.balance||0),date:o.date||'',description:`Orden y fórmula ${o.number||''}`}))
  ];
  const filtered=accounts.filter(a=>containsText(a,q));
  const selected=accounts.find(a=>a.id===form.accountId)||filtered[0];
  const register=()=>{if(!selected)return alert('Selecciona una venta u orden pendiente');const amount=Number(form.amount);if(!Number.isFinite(amount)||amount<=0)return alert('Monto inválido');if(amount>Number(selected.balance||0))return alert(`El abono no puede superar el saldo pendiente de ${money(selected.balance)}`);const newBalance=Math.max(0,Number(selected.balance)-amount);const payment={id:uid(),accountId:selected.id,source:selected.source,sourceId:selected.sourceId,saleId:selected.source==='Venta'?selected.sourceId:null,orderId:selected.source==='Trabajo óptico'?selected.sourceId:null,number:selected.number,customer:selected.customer,idCard:selected.idCard,date:form.date||today(),amount,method:form.method,reference:form.reference,notes:form.notes,previousBalance:Number(selected.balance),newBalance,registeredBy:getStaffName(currentUser),registeredEmail:currentUser};setStore(prev=>({...prev,payments:[...(prev.payments||[]),payment],sales:(prev.sales||[]).map(s=>selected.source==='Venta'&&s.id===selected.sourceId?{...s,paidAmount:salePaid(s)+amount,balance:newBalance,paymentStatus:newBalance<=0?'Pagado':'Abonado'}:s),orders:(prev.orders||[]).map(o=>selected.source==='Trabajo óptico'&&o.id===selected.sourceId?{...o,totalPaid:Number(o.total||0)-newBalance,balance:newBalance,balanceBs:newBalance*Number(prev.settings?.exchangeRate||0),paymentStatus:newBalance<=0?'Pagado':'Abonado',paymentHistory:[...(o.paymentHistory||[]),payment]}:o)}),'Abono guardado');setForm({accountId:'',date:today(),amount:'',method:'Efectivo',reference:'',notes:''});};
  const history=(store.payments||[]).slice().reverse();
  return <div className="stack"><Guide title="Abonos / Cuentas por cobrar" items={["Busca por cliente, cédula, teléfono, venta o número de orden.","Selecciona exactamente la cuenta pendiente antes de registrar el abono.","El saldo se actualiza en la venta u orden y cada pago queda en el historial."]}/><Card title="Registrar abono" wide><div className="formGrid"><Input v={q} p="Buscar cliente, cédula o trabajo" on={setQ}/><Select p="Cuenta pendiente" v={form.accountId||selected?.id||''} on={v=>setForm({...form,accountId:v})} opts={filtered.map(a=>[a.id,`${a.source} · ${a.number} · ${a.customer}${a.idCard?` · CI ${a.idCard}`:''} · Saldo ${money(a.balance)}`])}/><Input v={form.date} p="Fecha del abono" type="date" on={v=>setForm({...form,date:v})}/><Input v={form.amount} p="Monto abonado USD" type="number" on={v=>setForm({...form,amount:v})}/><div className="totalBox">Abono Bs.:<b>{store.settings?.exchangeRate?bs(Number(form.amount||0)*Number(store.settings.exchangeRate)):'Configurar tasa'}</b></div><Select p="Método de pago" v={form.method} on={v=>setForm({...form,method:v})} opts={paymentOptions.map(x=>[x,x])}/><Input v={form.reference} p="Referencia" on={v=>setForm({...form,reference:v})}/><Input v={form.notes} p="Observaciones" on={v=>setForm({...form,notes:v})}/><button onClick={register}>Registrar abono</button></div>{selected&&<div className="accountSummary"><div><span>Origen</span><b>{selected.source}</b></div><div><span>Cuenta</span><b>{selected.number}</b></div><div><span>Cliente</span><b>{selected.customer}</b></div><div><span>Cédula</span><b>{selected.idCard||'-'}</b></div><div><span>Total</span><b>{money(selected.total)}</b></div><div><span>Abonado</span><b>{money(selected.paid)}</b></div><div><span>Saldo pendiente</span><b>{money(selected.balance)}</b></div></div>}</Card><Card title={`Cuentas pendientes (${filtered.length})`} wide><div className="innerScroll"><Table rows={filtered} columns={[["source","Origen"],["number","Venta / Trabajo óptico"],["customer","Cliente"],["idCard","Cédula"],["date","Fecha"],["total","Total",money],["paid","Abonado",money],["balance","Saldo",money],["actions","Acción",(_,r)=><button className="mini secondary" onClick={()=>setForm({...form,accountId:r.id})}>Seleccionar</button>]]}/></div></Card><Card title="Historial de abonos" wide><Table rows={history} columns={[["date","Fecha"],["source","Origen"],["number","Venta / Trabajo óptico"],["customer","Cliente"],["idCard","Cédula"],["amount","Abono",money],["method","Método"],["reference","Referencia"],["previousBalance","Saldo previo",money],["newBalance","Nuevo saldo",money],["registeredBy","Registrado por"]]}/></Card></div>;
}

function ClinicalModule({store,setStore,currentUser}){
 const blank={number:`HC-${String((store.orders||[]).filter(o=>o.clinical).length+1).padStart(4,'0')}`,date:today(),customer:'',phone:'',idCard:'',age:'',address:'',clinicalHistory:'',reason:'',odEsf:'',odCil:'',odEje:'',odAdd:'',oiEsf:'',oiCil:'',oiEje:'',oiAdd:'',dp:'',height:'',notes:'',doctorPaid:false,doctorPaidDate:''};
 const [form,setForm]=useState(blank),[q,setQ]=useState(''),[editing,setEditing]=useState(null),[payFilter,setPayFilter]=useState('Todos'); const isAdmin=getUserRole(currentUser)==='admin';
 const save=()=>{if(!form.customer||!form.idCard)return alert('Paciente y cédula obligatorios');const prescription=`OD: Esf ${form.odEsf||'-'} | Cil ${form.odCil||'-'} | Eje ${form.odEje||'-'} | Add ${form.odAdd||'-'} / OI: Esf ${form.oiEsf||'-'} | Cil ${form.oiCil||'-'} | Eje ${form.oiEje||'-'} | Add ${form.oiAdd||'-'} / DP: ${form.dp||'-'} / Altura: ${form.height||'-'}`;const record={...form,id:editing||uid(),orderNumber:form.number,prescription,clinical:true,createdBy:getStaffName(currentUser),createdEmail:currentUser};setStore(prev=>({...prev,orders:editing?(prev.orders||[]).map(o=>o.id===editing?record:o):[...(prev.orders||[]),record]}),'Historia clínica guardada');setForm(blank);setEditing(null)};
 const rows=(store.orders||[]).filter(o=>o.clinical&&containsText(o,q)&&(payFilter==='Todos'||(payFilter==='Pagado'?o.doctorPaid:!o.doctorPaid))).slice().reverse();
 const togglePaid=r=>{if(!isAdmin)return;setStore(prev=>({...prev,orders:(prev.orders||[]).map(o=>o.id===r.id?{...o,doctorPaid:!o.doctorPaid,doctorPaidDate:!o.doctorPaid?today():'',doctorPaidBy:getStaffName(currentUser)}:o)}),'Pago a Yngrid actualizado')};
 return <div className="stack"><Card title="Fórmulas / Historial clínico — Yngrid" wide><div className="formGrid"><Input v={form.number} p="Código" on={v=>setForm({...form,number:v})}/><Input v={form.date} p="Fecha" type="date" on={v=>setForm({...form,date:v})}/><Input v={form.customer} p="Nombre y apellido" on={v=>setForm({...form,customer:v})}/><Input v={form.idCard} p="Cédula" on={v=>setForm({...form,idCard:v})}/><Input v={form.phone} p="Teléfono" on={v=>setForm({...form,phone:v})}/><Input v={form.age} p="Edad" type="number" on={v=>setForm({...form,age:v})}/><Input v={form.address} p="Dirección" on={v=>setForm({...form,address:v})}/><Input v={form.reason} p="Motivo de consulta" on={v=>setForm({...form,reason:v})}/><TextArea v={form.clinicalHistory} p="Historial clínico" rows={3} on={v=>setForm({...form,clinicalHistory:v})}/><div className="rxBox compactRx"><div className="rxTitle">Prescripción óptica</div><div className="rxGrid rxHeader"><span></span><span>Esf</span><span>Cil</span><span>Eje</span><span>Add</span></div><div className="rxGrid"><b>OD</b><Input v={form.odEsf} p="OD Esf" on={v=>setForm({...form,odEsf:v})}/><Input v={form.odCil} p="OD Cil" on={v=>setForm({...form,odCil:v})}/><Input v={form.odEje} p="OD Eje" on={v=>setForm({...form,odEje:v})}/><Input v={form.odAdd} p="OD Add" on={v=>setForm({...form,odAdd:v})}/></div><div className="rxGrid"><b>OI</b><Input v={form.oiEsf} p="OI Esf" on={v=>setForm({...form,oiEsf:v})}/><Input v={form.oiCil} p="OI Cil" on={v=>setForm({...form,oiCil:v})}/><Input v={form.oiEje} p="OI Eje" on={v=>setForm({...form,oiEje:v})}/><Input v={form.oiAdd} p="OI Add" on={v=>setForm({...form,oiAdd:v})}/></div><div className="rxGrid rxTwo"><Input v={form.dp} p="DP" on={v=>setForm({...form,dp:v})}/><Input v={form.height} p="Altura" on={v=>setForm({...form,height:v})}/></div></div><TextArea v={form.notes} p="Observaciones" rows={3} on={v=>setForm({...form,notes:v})}/><button onClick={save}><Save size={16}/>Guardar historia clínica</button></div></Card><Card title="Historial clínico" wide><div className="formGrid clinicalFilters"><div className="search"><Search size={16}/><input value={q} placeholder="Buscar paciente, cédula o teléfono" onChange={e=>setQ(e.target.value)}/></div><Select p="Pago a Yngrid" v={payFilter} on={setPayFilter} opts={['Todos','Pendiente','Pagado'].map(x=>[x,x])}/></div><div className="clinicalCards">{rows.map(r=><details className="clinicalCard" key={r.id}><summary><div><b>{r.customer}</b><span>{r.number} · {r.date} · CI {r.idCard}</span></div><span className={`paymentState ${r.doctorPaid?'paid':'pending'}`}>{r.doctorPaid?'Pagado':'Pendiente'}</span></summary><div className="clinicalBody"><div className="patientMeta"><span>Teléfono <b>{r.phone||'-'}</b></span><span>Dirección <b>{r.address||'-'}</b></span></div><div className="rxReadGrid compact"><b></b><b>Esf</b><b>Cil</b><b>Eje</b><b>Add</b><strong>OD</strong><span>{r.odEsf||'-'}</span><span>{r.odCil||'-'}</span><span>{r.odEje||'-'}</span><span>{r.odAdd||'-'}</span><strong>OI</strong><span>{r.oiEsf||'-'}</span><span>{r.oiCil||'-'}</span><span>{r.oiEje||'-'}</span><span>{r.oiAdd||'-'}</span></div><div className="rxBottom"><span>DP: <b>{r.dp||'-'}</b></span><span>Altura: <b>{r.height||'-'}</b></span></div>{r.notes&&<p className="notesBox">{r.notes}</p>}<div className="rowActions">{isAdmin&&<button className={r.doctorPaid?'secondary':'warn'} onClick={()=>togglePaid(r)}>{r.doctorPaid?'Marcar pendiente':'Marcar pagado a Yngrid'}</button>}<button className="secondary" onClick={()=>{setEditing(r.id);setForm({...blank,...r});window.scrollTo({top:0})}}>Editar historia</button></div></div></details>)}</div></Card></div>;
}

function Dashboard({store,stats}){
  const rate=Number(store.settings?.exchangeRate||0);
  const [openLow,setOpenLow]=useState(false),[lowQuery,setLowQuery]=useState('');
  const lowStock=(store.products||[]).filter(p=>Number(p.stock||0)<Number(p.minStock||1));
  const visibleLow=lowStock.filter(p=>containsText(p,lowQuery));
  return <div className="grid dashboardGrid"><KPI label="Ventas hoy" value={money(stats.salesToday)} hint="Ventas activas del día"/><KPI label="Caja disponible" value={money(stats.cashBalance)} hint="Caja inicial + ventas - gastos"/><KPI label="Órdenes pendientes" value={stats.pendingOrders.length} hint="No entregadas"/><KPI label="Tasa BCV" value={rate?bs(rate):'Sin tasa'} hint={store.settings?.exchangeRateDate||'Configurar tasa'}/><KPI label="Ventas hoy en Bs." value={rate?bs(stats.salesToday*rate):'Sin tasa'} hint="Calculado con tasa guardada"/><KPI label="Stock bajo" value={lowStock.length} hint="Productos físicos por reponer"/><Card title="Inventario bajo" wide action={<div className="actions"><button className="secondary" onClick={()=>setOpenLow(!openLow)}>{openLow?'Ocultar productos':'Ver productos'}</button></div>}><div className="lowStockSummary"><span>{lowStock.length?`${lowStock.length} productos requieren reposición`:'No hay productos por debajo del mínimo'}</span></div>{openLow&&<><div className="search lowStockSearch"><Search size={16}/><input value={lowQuery} placeholder="Buscar código o producto" onChange={e=>setLowQuery(e.target.value)}/></div><div className="lowStockScroll"><Table rows={visibleLow} columns={[["code","Código"],["description","Producto"],["stock","Stock"],["minStock","Mínimo"]]}/></div></>}</Card><Card title="Órdenes pendientes" wide><Table rows={stats.pendingOrders.slice(0,8)} columns={[["number","Orden"],["customer","Cliente"],["lab","Laboratorio"],["status","Estatus"],["balance","Resta",money]]}/></Card></div>;
}

function CrystalCatalog({catalog,setStore,priceOnly=false,currentUser=''}){
  const [q,setQ]=useState(''),[editing,setEditing]=useState(null),[form,setForm]=useState({crystal:'',treatment:'',colors:'',price:'',range:''});
  const rows=(catalog||[]).filter(x=>containsText(x,q));
  const beginEdit=r=>{setEditing(r.id);setForm({...r})};
  const cancel=()=>{setEditing(null);setForm({crystal:'',treatment:'',colors:'',price:'',range:''})};
  const save=()=>{if(Number(form.price)<=0)return alert('El precio debe ser mayor que cero');if(!priceOnly&&(!form.crystal||!form.treatment))return alert('Cristal y tratamiento son obligatorios');const old=(catalog||[]).find(x=>x.id===editing);const item=priceOnly?{...old,price:Number(form.price),lastPriceChange:{previous:Number(old?.price||0),new:Number(form.price),by:getStaffName(currentUser),email:currentUser,date:today()}}:{...form,id:editing||uid(),price:Number(form.price)};setStore(prev=>({...prev,crystalCatalog:editing?(prev.crystalCatalog||[]).map(x=>x.id===editing?item:x):[...(prev.crystalCatalog||[]),item]}),'Precio de cristal actualizado');cancel()};
  return <div className="stack"><Card title="Catálogo de cristales" wide><div className="catalogNotice">Los cristales no manejan stock físico. {priceOnly?'Puedes editar únicamente su precio.':'El administrador puede gestionar el catálogo completo.'}</div>{!priceOnly&&<div className="formGrid"><Input v={form.crystal} p="Cristal" on={v=>setForm({...form,crystal:v})}/><Input v={form.treatment} p="Tratamiento" on={v=>setForm({...form,treatment:v})}/><Input v={form.colors} p="Colores" on={v=>setForm({...form,colors:v})}/><Input v={form.range} p="Rango de dioptrías" on={v=>setForm({...form,range:v})}/><Input v={form.price} p="Precio" type="number" on={v=>setForm({...form,price:v})}/><button onClick={save}>{editing?'Guardar cambios':'Agregar opción'}</button></div>}{priceOnly&&editing&&<div className="priceEditor"><div><b>{form.crystal}</b><span>{[form.treatment,form.colors,form.range].filter(Boolean).join(' · ')}</span><small>Precio actual: {money((catalog||[]).find(x=>x.id===editing)?.price)}</small></div><Input v={form.price} p="Nuevo precio USD" type="number" on={v=>setForm({...form,price:v})}/><button onClick={save}>Guardar precio</button><button className="secondary" onClick={cancel}>Cancelar</button></div>}</Card><Card title={`Opciones de cristales (${rows.length})`} wide><div className="search"><Search size={16}/><input value={q} placeholder="Buscar cristal, tratamiento, color o rango" onChange={e=>setQ(e.target.value)}/></div><div className="catalogScroll"><Table rows={rows} columns={[["crystal","Cristal"],["treatment","Tratamiento"],["colors","Colores"],["range","Rango"],["price","Precio",money],["actions","Acción",(_,r)=><button className="mini secondary" onClick={()=>beginEdit(r)}>Editar precio</button>]]}/></div></Card></div>;
}

function Inventory({products,setList}){
  const blank={date:today(),category:'Montura',code:'',description:'',qty:'',cost:'',price:'',stock:'',minStock:'5'};
  const [form,setForm]=useState(blank),[editing,setEditing]=useState(null),[filters,setFilters]=useState({code:'',description:'',category:'Todos'});
  const costTotal=Number(form.qty||0)*Number(form.cost||0);
  const filtered=(products||[]).filter(p=>(filters.category==='Todos'||p.category===filters.category)&&(!filters.code||String(p.code).toLowerCase().includes(filters.code.toLowerCase()))&&(!filters.description||String(p.description).toLowerCase().includes(filters.description.toLowerCase())));
  const reset=()=>{setForm(blank);setEditing(null)};
  const save=()=>{if(!form.code||!form.description)return alert('Código y descripción son obligatorios');const qty=Number(form.qty||0);const item={...form,category:form.category==='Cristal'?'Cristales':form.category,qty,cost:+form.cost,costTotal,price:+form.price,stock:Number(form.stock||qty),minStock:+form.minStock};if(editing)setList('products',list=>list.map(p=>p.id===editing?{...item,id:editing}:p));else setList('products',list=>[...list,{...item,id:uid()}]);reset();};
  return <div className="stack"><Card title={editing?'Editar producto':'Inventario / nuevo producto'} wide action={editing&&<button className="secondary" onClick={reset}>Cancelar</button>}><div className="inventoryLine"><Input v={form.date} p="Fecha" type="date" on={v=>setForm({...form,date:v})}/><Select p="Categoría" v={form.category} on={v=>setForm({...form,category:v})} opts={saleCategoryOptions.map(x=>[x,x])}/><Input v={form.code} p="Código" on={v=>setForm({...form,code:v})}/><Input v={form.description} p="Descripción" on={v=>setForm({...form,description:v})}/></div><div className="inventoryLine six"><Input v={form.qty} p="Cantidad" type="number" on={v=>setForm({...form,qty:v,stock:v})}/><Input v={form.cost} p="Costo unitario" type="number" on={v=>setForm({...form,cost:v})}/><div className="totalBox">Costo total:<b>{money(costTotal)}</b></div><Input v={form.price} p="Precio" type="number" on={v=>setForm({...form,price:v})}/><Input v={form.stock} p="Stock" type="number" on={v=>setForm({...form,stock:v})}/><Input v={form.minStock} p="Stock mínimo" type="number" on={v=>setForm({...form,minStock:v})}/></div><button onClick={save}><Save size={16}/>{editing?'Guardar cambios':'Agregar producto'}</button></Card><Card title="Buscar inventario" wide><div className="formGrid"><Input v={filters.code} p="Filtrar por código" on={v=>setFilters({...filters,code:v})}/><Input v={filters.description} p="Filtrar por descripción" on={v=>setFilters({...filters,description:v})}/><Select p="Categoría" v={filters.category} on={v=>setFilters({...filters,category:v})} opts={['Todos',...saleCategoryOptions].map(x=>[x,x])}/></div><Table rows={filtered} columns={[["date","Fecha"],["category","Categoría"],["code","Código"],["description","Descripción"],["qty","Cantidad"],["cost","Costo u.",money],["costTotal","Costo total",(v,r)=>money(v??Number(r.qty||0)*Number(r.cost||0))],["price","Precio",money],["stock","Stock"],["minStock","Mínimo"],["actions","Acciones",(_,r)=><div className="rowActions"><button className="mini secondary" onClick={()=>{setEditing(r.id);setForm({...r});window.scrollTo({top:0})}}>Editar</button><button className="mini danger" onClick={()=>confirm('¿Eliminar producto?')&&setList('products',l=>l.filter(p=>p.id!==r.id))}>Eliminar</button></div>]]}/></Card></div>;
}
function Sales({store,setStore,currentUser,employeeMode=false}){
  const physicalProducts=store.products||[];
  const crystalProducts=(store.crystalCatalog||[]).map(c=>({
    id:c.id,
    code:`${c.crystal} / ${c.treatment}`,
    category:'Cristales',
    description:[c.crystal,c.treatment,c.colors,c.range].filter(Boolean).join(' · '),
    price:Number(c.price||0),
    stock:999999,
    catalogItem:true
  }));
  const products=[...physicalProducts,...crystalProducts],rate=Number(store.settings?.exchangeRate||0),sellerName=getStaffName(currentUser);
  const makeLine=()=>({id:uid(),category:'Montura',productId:'',manualDescription:'',qty:1,agreedPrice:''});
  const [sale,setSale]=useState({date:today(),customerName:'',idCard:'',payment:'Efectivo',initialPayment:'',reference:'',discountType:'Sin descuento',discountValue:'',lines:[makeLine()]});
  const [filters,setFilters]=useState({q:'',from:'',to:'',payment:'Todos',status:'Todos'});
  const updateLine=(id,patch)=>setSale({...sale,lines:sale.lines.map(l=>l.id===id?{...l,...patch}:l)});
  const manualCats=['Servicios','Montaje','Otros'];const stockCats=['Montura','Lentes de sol','Accesorios','Exhibidores','Estuches'];const lineRows=sale.lines.map(l=>{const p=products.find(x=>x.id===l.productId);const isExam=l.category==='Examen',isManual=manualCats.includes(l.category),unitPrice=isExam?12.5:(l.category==='Montura'||l.category==='Lentes de sol'||l.category==='Accesorios'||l.category==='Exhibidores'||l.category==='Estuches'||isManual)?Number(l.agreedPrice||0):Number(p?.price||0);return {...l,product:p,description:isExam?'Examen visual':isManual?l.manualDescription:(p?.description||''),unitPrice,lineTotal:unitPrice*Number(l.qty||0),requiresProduct:stockCats.includes(l.category)}});
  const subtotal=lineRows.reduce((a,l)=>a+l.lineTotal,0);const rawDiscount=Number(sale.discountValue||0);const discountAmount=sale.discountType==='Porcentaje'?Math.min(subtotal,subtotal*Math.min(100,Math.max(0,rawDiscount))/100):sale.discountType==='Monto fijo USD'?Math.min(subtotal,Math.max(0,rawDiscount)):0;const total=Math.max(0,subtotal-discountAmount), totalBs=total*rate, paid=Math.min(total,Number(sale.initialPayment||0)), balance=Math.max(0,total-paid);
  const complete=()=>{if(!sale.customerName)return alert('Nombre del cliente obligatorio');if(!sale.idCard)return alert('Cédula del cliente obligatoria');if(!lineRows.length||lineRows.some(l=>l.requiresProduct&&!l.product)||lineRows.some(l=>['Servicios','Montaje','Otros'].includes(l.category)&&!l.description))return alert('Completa todos los productos o servicios de la venta');if(lineRows.some(l=>Number(l.qty)<=0||(l.requiresProduct&&Number(l.product?.stock||0)<Number(l.qty))))return alert('Cantidad inválida o stock insuficiente');const newSale={id:uid(),date:sale.date,registeredDate:today(),customerName:sale.customerName,idCard:sale.idCard,items:lineRows.map(l=>({productId:l.product.id,code:l.product.code,description:l.product.description,category:l.product.category,catalogItem:!!l.product.catalogItem,qty:Number(l.qty),unitPrice:l.unitPrice,total:l.lineTotal})),productCodeName:lineRows.map(l=>`${l.product.code} - ${l.product.description}`).join(' + '),qty:lineRows.reduce((a,l)=>a+Number(l.qty),0),payment:sale.payment,reference:sale.reference,subtotal,discountType:sale.discountType,discountValue:rawDiscount,discountAmount,total,totalBs,paidAmount:paid,paidAmountBs:paid*rate,balance,balanceBs:balance*rate,paymentStatus:balance<=0?'Pagado':(paid>0?'Abonado':'Pendiente'),exchangeRate:rate,sellerName,sellerEmail:currentUser,delayed:sale.date!==today(),omitCommission:false,cancelled:false};setStore(prev=>({...prev,sales:[...(prev.sales||[]),newSale],products:(prev.products||[]).map(p=>{const sold=lineRows.filter(l=>l.product.id===p.id).reduce((a,l)=>a+Number(l.qty),0);return sold?{...p,stock:Number(p.stock)-sold}:p})}),'Venta guardada');setSale({date:today(),customerName:'',idCard:'',payment:'Efectivo',initialPayment:'',reference:'',discountType:'Sin descuento',discountValue:'',lines:[makeLine()]});};
  const filtered=(store.sales||[]).filter(x=>inDateRange(x.date,filters.from,filters.to)&&(filters.payment==='Todos'||x.payment===filters.payment)&&(filters.status==='Todos'||(filters.status==='Activas'?!x.cancelled:x.cancelled))&&containsText(x,filters.q));
  const cancelSale=(x)=>{if(x.cancelled||!confirm('¿Anular venta y devolver inventario?'))return;setStore(prev=>({...prev,sales:(prev.sales||[]).map(s=>s.id===x.id?{...s,cancelled:true}:s),products:(prev.products||[]).map(p=>{const items=x.items||[{productId:x.productId,qty:x.qty}];const qty=items.filter(i=>i.productId===p.id).reduce((a,i)=>a+Number(i.qty||0),0);return qty?{...p,stock:Number(p.stock)+qty}:p})}),'Venta anulada');};
  return <div className="stack"><Card title="Registrar venta" wide><div className="sellerBanner">Venta registrada por: <b>{sellerName}</b></div><div className="salesHeader"><Input v={sale.date} p="Fecha" type="date" on={v=>setSale({...sale,date:v})}/><Input v={sale.customerName} p="Nombre y apellido" on={v=>setSale({...sale,customerName:v})}/><Input v={sale.idCard} p="Cédula" on={v=>setSale({...sale,idCard:v})}/></div><div className="saleLines">{lineRows.map((l,index)=><div className="saleLine saleProductCard" key={l.id}><div className="saleProductTop"><Select p="Categoría" v={l.category} on={v=>updateLine(l.id,{category:v,productId:'',agreedPrice:''})} opts={saleCategoryOptions.map(x=>[x,x])}/>{!['Servicios','Examen','Montaje','Otros'].includes(l.category)&&<SmartFinder items={products.filter(p=>{const pc=p.category==='Cristal'?'Cristales':p.category;return pc===l.category||(l.category==='Accesorios'&&pc==='Accesorio')||(l.category==='Servicios'&&pc==='Servicio')})} value={l.productId} onSelect={p=>updateLine(l.id,{productId:p.id})} onClear={()=>updateLine(l.id,{productId:'',agreedPrice:''})} label="Código" mode="code"/>}{['Servicios','Montaje','Otros'].includes(l.category)?<Input v={l.manualDescription} p="Descripción" on={v=>updateLine(l.id,{manualDescription:v})}/>:l.category==='Examen'?<div className="totalBox">Examen visual <b>$12.50</b></div>:<SmartFinder items={products.filter(p=>{const pc=p.category==='Cristal'?'Cristales':p.category;return pc===l.category||(l.category==='Accesorios'&&pc==='Accesorio')})} value={l.productId} onSelect={p=>updateLine(l.id,{productId:p.id})} onClear={()=>updateLine(l.id,{productId:'',agreedPrice:''})} label="Descripción" mode="description"/>}</div><div className="saleProductBottom"><Input v={l.qty} p="Cantidad" type="number" on={v=>updateLine(l.id,{qty:v})}/>{l.category==='Examen'?<div className="totalBox">Precio fijo <b>$12.50</b></div>:l.category!=='Cristales'?<Input v={l.agreedPrice} p="Precio acordado USD" type="number" on={v=>updateLine(l.id,{agreedPrice:v})}/>:<div className="totalBox">Precio cristal:<b>{money(l.unitPrice)}</b></div>}<div className="totalBox">Precio total:<b>{money(l.lineTotal)}</b></div><button className="secondary mini" disabled={!l.productId} onClick={()=>updateLine(l.id,{productId:'',qty:1,agreedPrice:''})}>Limpiar producto</button><button className="mini danger" onClick={()=>sale.lines.length===1?updateLine(l.id,{productId:'',qty:1,agreedPrice:''}):setSale({...sale,lines:sale.lines.filter(x=>x.id!==l.id)})}>{sale.lines.length===1?'Limpiar fila':'Quitar fila'}</button></div></div>)}</div><button className="secondary addLine" onClick={()=>setSale({...sale,lines:[...sale.lines,makeLine()]})}><Plus size={16}/> Agregar otro producto o servicio</button><div className="discountBlock"><h3>DESCUENTO</h3><div className="formGrid"><div className="totalBox">Subtotal:<b>{money(subtotal)}</b></div><Select p="Tipo de descuento" v={sale.discountType} on={v=>setSale({...sale,discountType:v,discountValue:''})} opts={['Sin descuento','Porcentaje','Monto fijo USD'].map(x=>[x,x])}/>{sale.discountType!=='Sin descuento'&&<Input v={sale.discountValue} p={sale.discountType==='Porcentaje'?'Descuento %':'Descuento USD'} type="number" on={v=>setSale({...sale,discountValue:v})}/>}<div className="totalBox">Descuento:<b>{money(discountAmount)}</b></div><div className="totalBox strong">Total final:<b>{money(total)}</b></div></div></div><div className="paymentBlock"><h3>MÉTODO DE PAGO</h3><div className="formGrid"><Select p="Método de pago" v={sale.payment} on={v=>setSale({...sale,payment:v})} opts={paymentOptions.map(x=>[x,x])}/><div className="totalBox">Monto total USD:<b>{money(total)}</b></div><div className="totalBox">Monto total Bs.:<b>{rate?bs(totalBs):'Configurar tasa'}</b></div><Input v={sale.initialPayment} p="Abono inicial USD" type="number" on={v=>setSale({...sale,initialPayment:v})}/><div className="totalBox">Abono Bs.:<b>{rate?bs(paid*rate):'Configurar tasa'}</b></div><Input v={sale.reference} p="Referencia" on={v=>setSale({...sale,reference:v})}/><div className="totalBox">Saldo USD:<b>{money(balance)}</b></div><div className="totalBox">Saldo Bs.:<b>{rate?bs(balance*rate):'Configurar tasa'}</b></div><button onClick={complete}><Save size={16}/>Registrar venta</button></div></div></Card>{!employeeMode&&<Card title="Filtros e historial" wide><div className="formGrid"><Input v={filters.q} p="Buscar cliente, código o producto" on={v=>setFilters({...filters,q:v})}/><Input v={filters.from} p="Desde" type="date" on={v=>setFilters({...filters,from:v})}/><Input v={filters.to} p="Hasta" type="date" on={v=>setFilters({...filters,to:v})}/><Select p="Método" v={filters.payment} on={v=>setFilters({...filters,payment:v})} opts={['Todos',...paymentOptions].map(x=>[x,x])}/><Select p="Estado" v={filters.status} on={v=>setFilters({...filters,status:v})} opts={['Todos','Activas','Anuladas'].map(x=>[x,x])}/></div><Table rows={filtered.slice().reverse()} columns={[["date","Fecha"],["customerName","Cliente"],["productCodeName","Productos"],["qty","Cant."],["total","Total",money],["paidAmount","Abonado",money],["balance","Saldo",money],["payment","Pago"],["reference","Referencia"],["sellerName","Vendedor"],["cancelled","Estado",v=>v?'Anulada':'Activa'],["actions","Acción",(_,r)=><button className="mini danger" disabled={r.cancelled} onClick={()=>cancelSale(r)}>Anular</button>]]}/></Card>}</div>;
}
function Orders({store,setStore,currentUser,isAdmin}){
 const labs=store.laboratories||[],products=(store.products||[]).filter(p=>p.category!=='Cristales'),catalog=store.crystalCatalog||[],rate=Number(store.settings?.exchangeRate||0),responsible=getStaffName(currentUser);
 const makeRx=()=>({id:uid(),odEsf:'',odCil:'',odEje:'',odAdd:'',oiEsf:'',oiCil:'',oiEje:'',oiAdd:'',dp:'',height:'',notes:''});
 const makeWork=()=>({id:uid(),open:true,prescriptionIndex:0,frameOrigin:'La compró aquí',externalFrameCode:'',externalFrameDescription:'',externalFrameColor:'',frameId:'',frameQty:1,frameAgreedPrice:'',frameWarranty:'No',crystalId:'',crystalQty:1,crystalWarranty:'No',additionals:[]});
 const blank=()=>({number:`GC-${String((store.orders||[]).length+1).padStart(4,'0')}`,date:today(),customer:'',idCard:'',paymentMethod:'Efectivo',deposit:'',depositReference:'',lab:labs[0]?.name||'',status:'En la tienda',sentDate:'',storeArrivalDate:'',notifiedClient:'No',labPayment:'No pagado',labAmount:'',labWorkCount:'1',notes:'',discountType:'Sin descuento',discountValue:'',externalFormula:false,externalRx:makeRx(),works:[makeWork()]});
 const [form,setForm]=useState(blank()),[editing,setEditing]=useState(null),[filters,setFilters]=useState({q:'',lab:'Todos',status:'Todos'}),[showExternal,setShowExternal]=useState(false);
 const histories=(store.orders||[]).filter(o=>o.clinical&&(String(o.customer).toLowerCase()===String(form.customer).toLowerCase()||String(o.idCard)===String(form.idCard)));
 const patient=histories[0],prescriptions=patient?(Array.isArray(patient.prescriptions)&&patient.prescriptions.length?patient.prescriptions:[patient]):(form.externalFormula?[form.externalRx]:[]);
 const patchWork=(id,patch)=>setForm({...form,works:form.works.map(w=>w.id===id?{...w,...patch}:w)});
 const addAdditional=id=>patchWork(id,{additionals:[...(form.works.find(w=>w.id===id)?.additionals||[]),{id:uid(),description:'',price:''}]});
 const totals=form.works.map(w=>{const frame=products.find(p=>p.id===w.frameId),crystal=catalog.find(c=>c.id===w.crystalId);const ft=w.frameOrigin==='La trajo'?0:Number(w.frameAgreedPrice||0)*Number(w.frameQty||0),ct=Number(crystal?.price||0)*Number(w.crystalQty||0),at=(w.additionals||[]).reduce((a,x)=>a+Number(x.price||0),0);return {...w,frame,crystal,frameUnitPrice:Number(w.frameAgreedPrice||0),frameTotal:ft,crystalTotal:ct,additionalTotal:at,total:ft+ct+at}});
 const subtotal=totals.reduce((a,w)=>a+w.total,0),discountValue=Number(form.discountValue||0),discountAmount=form.discountType==='Porcentaje'?Math.min(subtotal,subtotal*Math.min(100,Math.max(0,discountValue))/100):form.discountType==='Monto fijo USD'?Math.min(subtotal,Math.max(0,discountValue)):0,total=Math.max(0,subtotal-discountAmount),deposit=Number(form.deposit||0),balance=Math.max(0,total-deposit);
 const save=()=>{if(!form.customer||!form.idCard)return alert('Nombre y cédula son obligatorios');if(!prescriptions.length)return alert('Selecciona una fórmula de Yngrid o agrega una fórmula externa');if(totals.some(w=>w.frameOrigin!=='La trajo'&&w.frame&&Number(w.frameUnitPrice||0)<=0))return alert('Indica el precio acordado de cada montura');if(totals.some(w=>w.frameOrigin!=='La trajo'&&w.frame&&Number(w.frame.stock||0)<Number(w.frameQty||0)))return alert('Stock insuficiente en una montura');const order={...form,id:editing||uid(),subtotal,discountType:form.discountType,discountValue,discountAmount,total,totalBs:total*rate,deposit,depositBs:deposit*rate,balance,balanceBs:balance*rate,responsible,responsibleEmail:currentUser,clinical:false,works:totals.map(w=>({...w,frame:w.frame?{id:w.frame.id,code:w.frame.code,description:w.frame.description,price:w.frameUnitPrice}:null,crystal:w.crystal?{...w.crystal}:null})),formulaOrigin:form.externalFormula?'Externa':'GafasCity'};setStore(prev=>({...prev,orders:editing?(prev.orders||[]).map(o=>o.id===editing?order:o):[...(prev.orders||[]),order],products:(prev.products||[]).map(p=>{const used=totals.filter(w=>w.frameOrigin!=='La trajo'&&w.frame?.id===p.id).reduce((a,w)=>a+Number(w.frameQty||0),0);return used&&!editing?{...p,stock:Number(p.stock)-used}:p})}),'Orden guardada');setForm(blank());setEditing(null);setShowExternal(false)};
 const rx=prescriptions[0]; const rows=(store.orders||[]).filter(o=>!o.clinical&&(filters.lab==='Todos'||o.lab===filters.lab)&&(filters.status==='Todos'||o.status===filters.status)&&containsText(o,filters.q));
 return <div className="stack"><Card title={editing?'Editar orden':'Trabajo óptico'} wide><div className="sectionTitle">PACIENTE</div><div className="formGrid"><Input v={form.number} p="Código de trabajo" on={v=>setForm({...form,number:v})}/><Input v={form.date} p="Fecha" type="date" on={v=>setForm({...form,date:v})}/><Input v={form.customer} p="Nombre y apellido" on={v=>setForm({...form,customer:v})}/><Input v={form.idCard} p="Cédula" on={v=>setForm({...form,idCard:v})}/></div>{rx?<details className="rxDisplay" open><summary>Prescripción óptica — {form.externalFormula?'Fórmula externa · examen no realizado en GafasCity':'Registrada por Yngrid'}</summary><div className="rxReadGrid"><b></b><b>Esf</b><b>Cil</b><b>Eje</b><b>Add</b><strong>OD</strong><span>{rx.odEsf||'-'}</span><span>{rx.odCil||'-'}</span><span>{rx.odEje||'-'}</span><span>{rx.odAdd||'-'}</span><strong>OI</strong><span>{rx.oiEsf||'-'}</span><span>{rx.oiCil||'-'}</span><span>{rx.oiEje||'-'}</span><span>{rx.oiAdd||'-'}</span></div><div className="rxBottom"><span>DP: <b>{rx.dp||'-'}</b></span><span>Altura: <b>{rx.height||'-'}</b></span></div></details>:<div className="noFormula"><p>Este paciente no tiene una fórmula registrada en GafasCity.</p><button className="secondary" onClick={()=>setShowExternal(true)}>Agregar fórmula externa</button></div>}{showExternal&&<div className="externalRx"><div className="sectionTitle">FÓRMULA EXTERNA — EXAMEN NO REALIZADO EN GAFASCITY</div><div className="rxGrid"><b>OD</b><Input v={form.externalRx.odEsf} p="OD Esf" on={v=>setForm({...form,externalFormula:true,externalRx:{...form.externalRx,odEsf:v}})}/><Input v={form.externalRx.odCil} p="OD Cil" on={v=>setForm({...form,externalFormula:true,externalRx:{...form.externalRx,odCil:v}})}/><Input v={form.externalRx.odEje} p="OD Eje" on={v=>setForm({...form,externalFormula:true,externalRx:{...form.externalRx,odEje:v}})}/><Input v={form.externalRx.odAdd} p="OD Add" on={v=>setForm({...form,externalFormula:true,externalRx:{...form.externalRx,odAdd:v}})}/></div><div className="rxGrid"><b>OI</b><Input v={form.externalRx.oiEsf} p="OI Esf" on={v=>setForm({...form,externalRx:{...form.externalRx,oiEsf:v}})}/><Input v={form.externalRx.oiCil} p="OI Cil" on={v=>setForm({...form,externalRx:{...form.externalRx,oiCil:v}})}/><Input v={form.externalRx.oiEje} p="OI Eje" on={v=>setForm({...form,externalRx:{...form.externalRx,oiEje:v}})}/><Input v={form.externalRx.oiAdd} p="OI Add" on={v=>setForm({...form,externalRx:{...form.externalRx,oiAdd:v}})}/></div><div className="formGrid"><Input v={form.externalRx.dp} p="DP" on={v=>setForm({...form,externalRx:{...form.externalRx,dp:v}})}/><Input v={form.externalRx.height} p="Altura" on={v=>setForm({...form,externalRx:{...form.externalRx,height:v}})}/></div></div>}<div className="sectionTitle">TRABAJOS ÓPTICOS</div><div className="worksList">{totals.map((w,index)=><details className="opticalWork" open={w.open} key={w.id}><summary>Trabajo {index+1} <b>{money(w.total)}</b></summary><div className="workSection"><h4>MONTURA</h4><Select p="Origen de la montura" v={w.frameOrigin||'La compró aquí'} on={v=>patchWork(w.id,{frameOrigin:v,frameId:'',frameAgreedPrice:'',externalFrameCode:'',externalFrameDescription:'',externalFrameColor:''})} opts={[['La compró aquí','La compró aquí'],['La trajo','La trajo']]}/>{w.frameOrigin==='La trajo'?<div className="externalFrame"><Input v={w.externalFrameCode} p="Código o referencia" on={v=>patchWork(w.id,{externalFrameCode:v})}/><Input v={w.externalFrameDescription} p="Descripción" on={v=>patchWork(w.id,{externalFrameDescription:v})}/><Input v={w.externalFrameColor} p="Color" on={v=>patchWork(w.id,{externalFrameColor:v})}/><div className="employeeNotice">Montura proporcionada por el cliente, sin descuento de stock ni garantía de GafasCity.</div></div>:<div className="frameSelector"><div className="frameSearchRow"><SmartFinder items={products} value={w.frameId} onSelect={p=>patchWork(w.id,{frameId:p.id})} onClear={()=>patchWork(w.id,{frameOrigin:'La compró aquí',externalFrameCode:'',externalFrameDescription:'',externalFrameColor:'',frameId:'',frameQty:1,frameAgreedPrice:'',frameWarranty:'No'})} label="Código" mode="code" showMeta/><SmartFinder items={products} value={w.frameId} onSelect={p=>patchWork(w.id,{frameId:p.id})} onClear={()=>patchWork(w.id,{frameOrigin:'La compró aquí',externalFrameCode:'',externalFrameDescription:'',externalFrameColor:'',frameId:'',frameQty:1,frameAgreedPrice:'',frameWarranty:'No'})} label="Descripción" mode="description" showMeta/></div><div className="frameDataRow"><Input v={w.frameQty} p="Cantidad" type="number" on={v=>patchWork(w.id,{frameQty:v})}/><Input v={w.frameAgreedPrice} p="Precio acordado USD" type="number" on={v=>patchWork(w.id,{frameAgreedPrice:v})}/><div className="totalBox">Precio total <b>{money(w.frameTotal)}</b></div><Select p="Garantía" v={w.frameWarranty} on={v=>patchWork(w.id,{frameWarranty:v})} opts={[["No","Sin garantía"],["Si","Con garantía"]]}/><button className="secondary" disabled={!w.frameId} onClick={()=>patchWork(w.id,{frameOrigin:'La compró aquí',externalFrameCode:'',externalFrameDescription:'',externalFrameColor:'',frameId:'',frameQty:1,frameAgreedPrice:'',frameWarranty:'No'})}>Cambiar / quitar montura</button></div>{w.frame&&<div className="selectionSummary"><div><b>{w.frame.code}</b><span>{w.frame.description}</span></div><small>Stock disponible: {w.frame.stock} · Precio definido en esta operación</small></div>}</div>}</div><div className="workSection"><h4>CRISTAL</h4><div className="crystalWorkGrid"><SmartFinder items={catalog} value={w.crystalId} onSelect={c=>patchWork(w.id,{crystalId:c.id})} onClear={()=>patchWork(w.id,{crystalId:'',crystalQty:1,crystalWarranty:'No'})} label="Buscar cristal" mode="all" placeholder="Escribe cristal, tratamiento, color o rango"/><div className="crystalFull"><span>Cristal</span><b>{w.crystal?.crystal||'-'}</b></div><div className="infoBox"><span>Tratamiento</span><b>{w.crystal?.treatment||'-'}</b></div><div className="infoBox"><span>Colores</span><b>{w.crystal?.colors||'-'}</b></div><div className="infoBox"><span>Rango</span><b>{w.crystal?.range||'-'}</b></div><Input v={w.crystalQty} p="Cantidad" type="number" on={v=>patchWork(w.id,{crystalQty:v})}/><div className="totalBox">Precio unitario <b>{money(w.crystal?.price)}</b></div><div className="totalBox">Precio total <b>{money(w.crystalTotal)}</b></div><Select p="Garantía" v={w.crystalWarranty} on={v=>patchWork(w.id,{crystalWarranty:v})} opts={[["No","Sin garantía"],["Si","Con garantía"]]}/><button className="secondary" disabled={!w.crystalId} onClick={()=>patchWork(w.id,{crystalId:'',crystalQty:1,crystalWarranty:'No'})}>Cambiar / quitar cristal</button></div></div><div className="workSection"><h4>ADICIONALES</h4>{(w.additionals||[]).map(a=><div className="additionalRow" key={a.id}><Input v={a.description} p="Descripción adicional" on={v=>patchWork(w.id,{additionals:w.additionals.map(x=>x.id===a.id?{...x,description:v}:x)})}/><Input v={a.price} p="Precio" type="number" on={v=>patchWork(w.id,{additionals:w.additionals.map(x=>x.id===a.id?{...x,price:v}:x)})}/><button className="mini danger" onClick={()=>patchWork(w.id,{additionals:w.additionals.filter(x=>x.id!==a.id)})}>Quitar</button></div>)}<button className="secondary" onClick={()=>addAdditional(w.id)}><Plus size={16}/>Agregar adicional</button></div><div className="workSummary"><span>Montura {money(w.frameTotal)}</span><span>Cristal {money(w.crystalTotal)}</span><span>Adicionales {money(w.additionalTotal)}</span><b>Total trabajo {money(w.total)}</b></div>{form.works.length>1&&<button className="mini danger" onClick={()=>setForm({...form,works:form.works.filter(x=>x.id!==w.id)})}>Quitar trabajo</button>}</details>)}</div><button className="secondary" onClick={()=>setForm({...form,works:[...form.works,makeWork()]})}><Plus size={16}/>Agregar otro trabajo</button><div className="orderDiscount"><div className="sectionTitle">DESCUENTO DE LA ORDEN</div><div className="formGrid"><div className="totalBox">Subtotal <b>{money(subtotal)}</b></div><Select p="Tipo de descuento" v={form.discountType} on={v=>setForm({...form,discountType:v,discountValue:''})} opts={['Sin descuento','Porcentaje','Monto fijo USD'].map(x=>[x,x])}/>{form.discountType!=='Sin descuento'&&<Input v={form.discountValue} p={form.discountType==='Porcentaje'?'Descuento %':'Descuento USD'} type="number" on={v=>setForm({...form,discountValue:v})}/>}<div className="totalBox">Monto descontado <b>{money(discountAmount)}</b></div><div className="totalBox strong">Total final <b>{money(total)}</b></div></div></div><div className="sectionTitle">MÉTODO DE PAGO</div><div className="formGrid"><Select p="Método de pago" v={form.paymentMethod} on={v=>setForm({...form,paymentMethod:v})} opts={paymentOptions.map(x=>[x,x])}/><div className="totalBox strong">Monto total USD <b>{money(total)}</b></div><div className="totalBox">Monto total Bs. <b>{bs(total*rate)}</b></div><Input v={form.deposit} p="Pago inicial USD" type="number" on={v=>setForm({...form,deposit:v})}/><div className="totalBox">Pago inicial Bs. <b>{bs(deposit*rate)}</b></div><Input v={form.depositReference} p="Referencia" on={v=>setForm({...form,depositReference:v})}/><div className="totalBox">Saldo USD <b>{money(balance)}</b></div><button onClick={save}><Save size={16}/>Guardar trabajo óptico</button></div></Card><Card title="Trabajos ópticos registrados" wide><div className="formGrid"><Input v={filters.q} p="Buscar cliente, cédula o trabajo" on={v=>setFilters({...filters,q:v})}/><Select p="Laboratorio" v={filters.lab} on={v=>setFilters({...filters,lab:v})} opts={['Todos',...labs.map(l=>l.name)].map(x=>[x,x])}/><Select p="Estatus" v={filters.status} on={v=>setFilters({...filters,status:v})} opts={['Todos','En la tienda','Enviado','Proceso','Entregado'].map(x=>[x,x])}/></div><div className="innerScroll"><Table rows={rows.slice().reverse()} columns={[["number","Orden"],["customer","Cliente"],["formulaOrigin","Origen fórmula"],["total","Total",money],["balance","Saldo",money],["responsible","Responsable"]]}/></div></Card></div>;
}

function Laboratories({labs,orders,setList,isAdmin}){
  const safeLabs=labs||[],safeOrders=orders||[];
  const [selected,setSelected]=useState(safeLabs[0]?.name||'Novak');
  const [form,setForm]=useState({name:'',phone:'',notes:'',deliveryLimitDays:7});
  const filtered=safeOrders.filter(o=>!o.clinical&&o.lab===selected);
  const addLab=()=>{if(!form.name)return alert('Nombre obligatorio');setList('laboratories',list=>[...list,{...form,deliveryLimitDays:Number(form.deliveryLimitDays||7),id:uid()}]);setSelected(form.name);setForm({name:'',phone:'',notes:'',deliveryLimitDays:7});};
  const removeLab=id=>{if(confirm('¿Eliminar laboratorio? Las órdenes no se eliminan.'))setList('laboratories',list=>list.filter(l=>l.id!==id));};
  return <div className="stack"><Card title="Laboratorios" wide><div className="tabs">{safeLabs.map(l=><button key={l.id} onClick={()=>setSelected(l.name)} className={selected===l.name?'active':''}>{l.name}</button>)}</div>{isAdmin&&<div className="formGrid"><Input v={form.name} p="Nuevo laboratorio" on={v=>setForm({...form,name:v})}/><Input v={form.phone} p="Teléfono/contacto" on={v=>setForm({...form,phone:v})}/><Input v={form.deliveryLimitDays} p="Límite entrega (días)" type="number" on={v=>setForm({...form,deliveryLimitDays:v})}/><Input v={form.notes} p="Observaciones" on={v=>setForm({...form,notes:v})}/><button onClick={addLab}>Agregar laboratorio</button></div>}</Card><div className="grid"><KPI label={`Órdenes en ${selected}`} value={filtered.length}/><KPI label="Pendientes" value={filtered.filter(o=>o.status!=='Entregado').length}/><KPI label="Pagadas" value={filtered.filter(o=>o.labPayment==='Pagado'||o.labPayment==='Pago').length}/>{isAdmin&&<KPI label="Monto lab." value={money(filtered.reduce((a,o)=>a+Number(o.labAmount||o.opticalAmount||0),0))}/>}</div><Card title={`Órdenes de ${selected}`} wide><Table rows={filtered} columns={[["number","Orden"],["customer","Cliente"],["responsible","Responsable"],["status","Estatus"],["sentDate","Enviado"],["storeArrivalDate","Llegó tienda"],["notifiedClient","Notificado"],...(isAdmin?[["labPayment","Pago lab"],["labAmount","Monto",money]]:[]),["notes","Observaciones"]]}/></Card>{isAdmin&&<Card title="Administrar laboratorios" wide><Table rows={safeLabs} columns={[["name","Laboratorio"],["phone","Contacto"],["deliveryLimitDays","Límite días"],["notes","Notas"],["actions","Acciones",(_,r)=><button className="mini danger" onClick={()=>removeLab(r.id)}>Eliminar</button>]]}/></Card>}</div>;
}
function Customers({customers,setList}){const blank={name:'',phone:'',notes:''};const [form,setForm]=useState(blank);const [editing,setEditing]=useState(null);const save=()=>{if(!form.name)return alert('Nombre obligatorio');if(editing)setList('customers',list=>list.map(c=>c.id===editing?{...form,id:editing}:c));else setList('customers',list=>[...list,{...form,id:uid()}]);setForm(blank);setEditing(null);};const edit=c=>{setEditing(c.id);setForm({...c});};const remove=id=>{if(confirm('Eliminar cliente?'))setList('customers',list=>list.filter(c=>c.id!==id));};return <div className="stack"><Card title={editing?'Editar cliente':'Nuevo cliente'}><div className="formGrid"><Input v={form.name} p="Nombre" on={v=>setForm({...form,name:v})}/><Input v={form.phone} p="Telefono" on={v=>setForm({...form,phone:v})}/><Input v={form.notes} p="Observaciones" on={v=>setForm({...form,notes:v})}/><button onClick={save}>{editing?'Guardar':'Agregar cliente'}</button></div></Card><Card title="Clientes" wide><Table rows={customers} columns={[["name","Nombre"],["phone","Telefono"],["notes","Notas"],["actions","Acciones",(_,r)=><div className="rowActions"><button className="mini secondary" onClick={()=>edit(r)}>Editar</button><button className="mini danger" onClick={()=>remove(r.id)}>Eliminar</button></div>]]}/></Card></div>}
function Expenses({expenses,setList}){const [form,setForm]=useState({date:today(),category:'Operativo',description:'',amount:''});const [editing,setEditing]=useState(null);const [filters,setFilters]=useState({q:'',from:'',to:'',category:''});const filteredExpenses=expenses.filter(e=>inDateRange(e.date,filters.from,filters.to)&&(!filters.category||e.category.toLowerCase().includes(filters.category.toLowerCase()))&&containsText(e,filters.q));const filteredTotal=filteredExpenses.reduce((a,e)=>a+Number(e.amount||0),0);const save=()=>{if(!form.description)return alert('Descripcion obligatoria');if(editing)setList('expenses',l=>l.map(e=>e.id===editing?{...form,id:editing,amount:+form.amount}:e));else setList('expenses',l=>[...l,{...form,id:uid(),amount:+form.amount}]);setForm({date:today(),category:'Operativo',description:'',amount:''});setEditing(null);};const remove=id=>{if(confirm('Eliminar gasto?'))setList('expenses',l=>l.filter(e=>e.id!==id));};return <div className="stack"><Card title={editing?'Editar gasto':'Registrar gasto'}><div className="formGrid"><Input v={form.date} p="Fecha" type="date" on={v=>setForm({...form,date:v})}/><Input v={form.category} p="Categoria" on={v=>setForm({...form,category:v})}/><Input v={form.description} p="Descripcion" on={v=>setForm({...form,description:v})}/><Input v={form.amount} p="Monto" type="number" on={v=>setForm({...form,amount:v})}/><button onClick={save}>Guardar gasto</button></div></Card><Card title="Filtros de gastos" wide><div className="formGrid"><Input v={filters.q} p="Buscar gasto" on={v=>setFilters({...filters,q:v})}/><Input v={filters.from} p="Desde" type="date" on={v=>setFilters({...filters,from:v})}/><Input v={filters.to} p="Hasta" type="date" on={v=>setFilters({...filters,to:v})}/><Input v={filters.category} p="Categoria" on={v=>setFilters({...filters,category:v})}/><div className="totalBox">Registros:<b>{filteredExpenses.length}</b></div><div className="totalBox">Total:<b>{money(filteredTotal)}</b></div><button className="secondary" onClick={()=>downloadCSV('gastos-filtrados',filteredExpenses)}>Exportar filtrado</button></div></Card><Card title="Gastos" wide><Table rows={filteredExpenses} columns={[["date","Fecha"],["category","Categoria"],["description","Descripcion"],["amount","Monto",money],["actions","Acciones",(_,r)=><div className="rowActions"><button className="mini secondary" onClick={()=>{setEditing(r.id);setForm({...r})}}>Editar</button><button className="mini danger" onClick={()=>remove(r.id)}>Eliminar</button></div>]]}/></Card></div>}

function Cash({store,setStore}){
  const [selectedDate,setSelectedDate]=useState(today());
  const saved=(store.cashHistory||[]).find(c=>c.date===selectedDate)||{date:selectedDate,opening:0,purchases:0,otherExpenses:0,notes:''};
  const sales=(store.sales||[]).filter(s=>s.date===selectedDate&&!s.cancelled),expenses=(store.expenses||[]).filter(e=>e.date===selectedDate);
  const totals=Object.fromEntries(paymentOptions.map(m=>[m,sales.filter(s=>s.payment===m).reduce((a,s)=>a+Number(s.total||0),0)]));
  const salesTotal=sales.reduce((a,s)=>a+Number(s.total||0),0),expensesTotal=expenses.reduce((a,e)=>a+Number(e.amount||0),0);
  const [form,setForm]=useState(saved);useEffect(()=>setForm(saved),[selectedDate,store.cashHistory]);
  const save=()=>setStore(prev=>({...prev,cashHistory:[...(prev.cashHistory||[]).filter(c=>c.date!==selectedDate),{...form,date:selectedDate}]}));
  return <div className="stack"><Card title="Caja diaria por fecha" wide><div className="formGrid"><Input v={selectedDate} p="Fecha" type="date" on={setSelectedDate}/><Input v={form.opening} p="Caja inicial" type="number" on={v=>setForm({...form,opening:Number(v||0)})}/><div className="totalBox">Ventas del día:<b>{money(salesTotal)}</b></div><div className="totalBox">Gastos del día:<b>{money(expensesTotal)}</b></div><Input v={form.purchases} p="Compras / mercancía" type="number" on={v=>setForm({...form,purchases:Number(v||0)})}/><Input v={form.otherExpenses} p="Otros egresos" type="number" on={v=>setForm({...form,otherExpenses:Number(v||0)})}/><TextArea v={form.notes} p="Observaciones de caja" on={v=>setForm({...form,notes:v})}/><button onClick={save}><Save size={16}/>Guardar caja del día</button></div></Card><Card title="Resumen por método de pago" wide><Table rows={paymentOptions.map(method=>({id:method,method,amount:totals[method]||0}))} columns={[["method","Método"],["amount","Monto",money]]}/></Card></div>;
}
function Config({store,setStore}){
  const settings = store.settings || {};
  const setSetting = (field, value) => setStore(prev=>({...prev, settings:{...prev.settings, [field]: value}}));
  const uploadLogo = (file) => {
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => setSetting('logo', reader.result);
    reader.readAsDataURL(file);
  };
  return <div className="stack">
    <Guide title="Guía rápida Configuración" items={["Coloque la tasa BCV del día antes de registrar ventas en dólares.","El logo y nombre se guardan en este navegador por ahora.","La tarjeta lateral se puede editar para mostrar instrucciones internas."]}/>
    <Card title="Tasa BCV / cambio diario" wide>
      <div className="formGrid">
        <Input v={settings.exchangeRate} p="Tasa USD a Bs" type="number" on={v=>setSetting('exchangeRate', Number(v || 0))}/>
        <Input v={settings.exchangeRateDate} p="Fecha de tasa" type="date" on={v=>setSetting('exchangeRateDate', v)}/>
        <div className="totalBox strong">Vista previa:<b>{settings.exchangeRate ? bs(settings.exchangeRate) : 'Sin tasa'}</b></div>
      </div>
      <p className="muted">La tasa se carga manualmente. Coloca la tasa vigente y su fecha; después guarda en nube para compartirla con todos los usuarios.</p>
    </Card>
    <Card title="Comisiones" wide><div className="featureToggle"><div><b>Cálculo de comisiones</b><span>{settings.commissionsEnabled?'Activado: se calculan comisiones por ventas y trabajos.':'Desactivado: se siguen guardando responsables, pero no se calculan comisiones.'}</span></div><button className={settings.commissionsEnabled?'warn':'secondary'} onClick={()=>setSetting('commissionsEnabled',!settings.commissionsEnabled)}>{settings.commissionsEnabled?'Desactivar comisiones':'Activar comisiones'}</button></div></Card><Card title="Configuracion visual" wide>
      <div className="formGrid">
        <Input v={settings.businessName} p="Nombre de la empresa" on={v=>setSetting('businessName', v)}/>
        <Input v={settings.subtitle} p="Subtitulo" on={v=>setSetting('subtitle', v)}/>
        <Input v={settings.versionTitle} p="Titulo de tarjeta lateral" on={v=>setSetting('versionTitle', v)}/>
        <Input v={settings.versionDescription} p="Descripcion de tarjeta lateral" on={v=>setSetting('versionDescription', v)}/>
        <input type="file" accept="image/*" onChange={e=>uploadLogo(e.target.files?.[0])}/>
        <button className="secondary" onClick={()=>setSetting('logo','')}>Quitar logo</button>
      </div>
    </Card>
    <Card title="Vista previa" wide>
      <div className="brand previewBrand">{settings.logo ? <img className="logoImg" src={settings.logo} alt="Logo"/> : <span>GC</span>}<div><b>{settings.businessName || 'GafasCity ERP'}</b><small>{settings.subtitle || 'Gestion optica interna'}</small></div></div>
      <div className="statusBox"><b>{settings.versionTitle || 'Producción Final cliente consolidada'}</b><span>{settings.versionDescription || 'Inventario físico y catálogo de cristales separados.'}</span></div>
    </Card>
  </div>
}

function Reports({store,stats}){
  const [filters,setFilters]=useState({from:'',to:'',q:''});
  const rate = Number(store.settings?.exchangeRate || 0);
  const filteredSales = store.sales.filter(s=>inDateRange(s.date,filters.from,filters.to)&&containsText(s,filters.q));
  const filteredOrders = store.orders.filter(o=>inDateRange(o.date,filters.from,filters.to)&&containsText(o,filters.q));
  const filteredExpenses = store.expenses.filter(e=>inDateRange(e.date,filters.from,filters.to)&&containsText(e,filters.q));
  const inventoryCost=(store.products||[]).reduce((a,p)=>a+Number(p.stock||0)*Number(p.cost||0),0);
  const inventorySale=(store.products||[]).reduce((a,p)=>a+Number(p.stock||0)*Number(p.price||0),0);
  const totalSales=filteredSales.filter(s=>!s.cancelled).reduce((a,s)=>a+Number(s.total||0),0);
  const totalExpenses=filteredExpenses.reduce((a,e)=>a+Number(e.amount||0),0);
  const totalOrdersBalance=filteredOrders.reduce((a,o)=>a+Number(o.balance||0),0);
  const exportProducts = () => downloadCSV('inventario', store.products);
  const exportSales = () => downloadCSV('ventas-filtradas', filteredSales.map(s=>({...s,totalBs:s.totalBs || (rate ? Number(s.total||0)*rate : 0)})));
  const exportOrders = () => downloadCSV('ordenes-filtradas', filteredOrders);
  const exportLabs = () => downloadCSV('laboratorios', store.laboratories);
  const exportCustomers = () => downloadCSV('clientes', store.customers);
  const exportExpenses = () => downloadCSV('gastos-filtrados', filteredExpenses);
  const exportCash = () => downloadCSV('caja-diaria', [{fecha:today(), ...store.cash, ventasHoy:stats.salesToday, gastosHoy:stats.expensesToday, cierreEsperado:stats.cashBalance, tasa:rate, ventasHoyBs:rate?stats.salesToday*rate:0}]);
  const exportAllBackup = () => downloadCSV('respaldo-general', [{fecha:today(), datos:JSON.stringify(store)}]);
  return <div className="grid"><KPI label="Ventas filtradas" value={money(totalSales)}/><KPI label="Gastos filtrados" value={money(totalExpenses)}/><KPI label="Resta ordenes" value={money(totalOrdersBalance)}/><KPI label="Tasa actual" value={rate?bs(rate):'Sin tasa'}/><Card title="Filtros globales de reportes" wide><div className="formGrid"><Input v={filters.q} p="Buscar texto general" on={v=>setFilters({...filters,q:v})}/><Input v={filters.from} p="Desde" type="date" on={v=>setFilters({...filters,from:v})}/><Input v={filters.to} p="Hasta" type="date" on={v=>setFilters({...filters,to:v})}/><div className="totalBox">Ventas:<b>{filteredSales.length}</b></div><div className="totalBox">Ordenes:<b>{filteredOrders.length}</b></div><div className="totalBox">Gastos:<b>{filteredExpenses.length}</b></div></div></Card><Card title="Exportar informacion" wide><div className="actions"><button onClick={exportProducts}>Exportar inventario</button><button onClick={exportSales}>Exportar ventas filtradas</button><button onClick={exportOrders}>Exportar ordenes filtradas</button><button onClick={exportLabs}>Exportar laboratorios</button><button onClick={exportCustomers}>Exportar clientes</button><button onClick={exportExpenses}>Exportar gastos filtrados</button><button onClick={exportCash}>Exportar caja diaria</button><button className="secondary" onClick={exportAllBackup}>Respaldo general</button></div><p className="muted">Los archivos se descargan en formato CSV. Excel puede abrirlos directamente.</p></Card><KPI label="Valor inventario costo" value={money(inventoryCost)}/><KPI label="Valor inventario venta" value={money(inventorySale)}/><Card title="Resumen version 6" wide><p>Esta version agrega filtros por fecha, texto, metodo de pago, estatus, laboratorio y exportacion filtrada en ventas, ordenes, gastos y reportes.</p></Card></div>
}


createRoot(document.getElementById('root')).render(<ErrorBoundary><App/></ErrorBoundary>);
