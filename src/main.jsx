import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { LayoutDashboard, Package, ShoppingCart, Users, ClipboardList, Wallet, Receipt, BarChart3, Plus, Search, Save, Microscope, Pencil, Trash2, RotateCcw, Settings } from 'lucide-react';
import './styles.css';
import initialInventoryData from './inventory-data.json';

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
const saleCategoryOptions = ['Montura','Cristales','Accesorio','Servicio','Otros'];
const salePaid = (sale) => Number(sale?.paidAmount ?? sale?.total ?? 0);
const saleBalance = (sale) => Math.max(0, Number(sale?.balance ?? (Number(sale?.total||0) - salePaid(sale))));
const salePaymentStatus = (sale) => saleBalance(sale) <= 0 ? 'Pagado' : (salePaid(sale) > 0 ? 'Abonado' : 'Pendiente');
const defaultLabs = ['Novak', 'Opas (Vector)', 'Liberty', 'Prats', 'Jesus Tallador', 'Fer Visprolentes'];
const normalizeImportedProduct = (item = {}) => ({
  id: item.id || `imp-${uid()}`,
  code: String(item.code || '').trim().toUpperCase(),
  date: item.date || today(),
  category: item.category === 'Cristal' ? 'Cristales' : (item.category || 'Otros'),
  description: String(item.description || '').trim().toUpperCase(),
  qty: Number(item.qty || 0),
  cost: Number(item.cost || 0),
  costTotal: Number(item.costTotal || (Number(item.qty || 0) * Number(item.cost || 0))),
  price: Number(item.price || 0),
  stock: Number(item.stock ?? item.qty ?? 0),
  minStock: Number(item.minStock ?? 1),
  imported: true
});
const INITIAL_INVENTORY = initialInventoryData.map(normalizeImportedProduct);
const isDemoInventory = (products = []) => products.length === 0 || (products.length <= 3 && products.every(p => ['p1','p2','p3'].includes(p.id)));


const seed = {
  products: INITIAL_INVENTORY,
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
  settings: { businessName:'GafasCity ERP', subtitle:'Gestion optica interna', logo:'', versionTitle:'Producción Final 3.3', versionDescription:'Operación final integral GafasCity', exchangeRate:0, exchangeRateDate:today() }
};

function normalizeStore(raw = {}) {
  const base = seed;
  raw = raw || {};
  return {
    ...base,
    ...raw,
    products: isDemoInventory(raw.products) ? INITIAL_INVENTORY : (Array.isArray(raw.products) ? raw.products.map(normalizeImportedProduct) : INITIAL_INVENTORY),
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
    const lowStock = (store.products||[]).filter(p=>Number(p.stock)<=Number(p.minStock||5));
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
    ['dashboard','Inicio',LayoutDashboard], ['sales','Ventas',ShoppingCart], ['payments','Abonos / Cuentas',Wallet], ['clinical','Fórmulas / Historial',ClipboardList], ['orders','Ordenes / formulas',ClipboardList], ['labs','Laboratorios',Microscope], ['inventory','Inventario',Package], ['customers','Clientes',Users], ['cash','Caja diaria',Wallet], ['expenses','Gastos',Receipt], ['commissions','Comisiones',BarChart3], ['delayed','Límite de entrega',Receipt], ['reports','Reportes',BarChart3], ['config','Configuracion',Settings]
  ];
  const employeeNav = [
    ['sales','Registrar venta',ShoppingCart], ['inventoryAdd','Agregar inventario',Package], ['orders','Órdenes y fórmulas',ClipboardList], ['payments','Abonos',Wallet], ['labs','Laboratorios',Microscope], ['tracking','Seguimiento de trabajos',ClipboardList]
  ];
  const formulaNav = [
    ['clinical','Fórmulas / Historial',ClipboardList], ['tracking','Seguimiento de trabajos',ClipboardList]
  ];
  const nav = isAdmin ? adminNav : (isFormulaUser ? formulaNav : employeeNav);
  const displayActive = nav.some(n => n[0] === active) ? active : (isAdmin ? 'dashboard' : (isFormulaUser ? 'clinical' : 'sales'));

  if(!session) return <Login settings={store.settings||{}} />;

  return <div className="app"><aside className="sidebar"><div className="brand">{store.settings?.logo ? <img className="logoImg" src={store.settings.logo} alt="Logo"/> : <span>GC</span>}<div><b>{store.settings?.businessName || 'GafasCity ERP'}</b><small>{store.settings?.subtitle || 'Gestion optica interna'}</small></div></div><nav>{nav.map(([id,label,Icon])=><button key={id} onClick={()=>setActive(id)} className={displayActive===id?'active':''}><Icon size={18}/>{label}</button>)}</nav><div className="statusBox"><b>{store.settings?.versionTitle || 'Version 4'}</b><span>{store.settings?.versionDescription || 'Caja diaria mejorada y logo editable.'}</span></div></aside><main><header className="topbar"><div><h1>{nav.find(n=>n[0]===displayActive)?.[1]}</h1><p>Flujo basado en inventario, ventas, trabajos de formula y laboratorios.</p></div><div className="actions topActions"><span className="badge">{isAdmin ? 'Admin' : (isFormulaUser ? 'Fórmulas' : 'Empleado')} - {cloudStatus}</span>{isAdmin&&<button className="secondary" onClick={loadCloud}>Cargar nube</button>}{isAdmin&&<button onClick={saveCloud}>Guardar nube</button>}<button className="ghost" onClick={()=>supabase.auth.signOut()}>Salir</button>{isAdmin&&<button className="ghost" onClick={()=>{if(confirm('Esto reinicia los datos locales.')){localStorage.removeItem('gafascity-store-v2');location.reload();}}}>Reiniciar local</button>}</div></header>{isAdmin && displayActive==='dashboard'&&<Dashboard store={store} stats={stats}/>} {isAdmin && displayActive==='inventory'&&<Inventory products={store.products||[]} setList={setList} setStore={updateStoreAndCloud} query={query} setQuery={setQuery}/>} {displayActive==='sales'&&(isAdmin ? <Sales store={store} setStore={updateStoreAndCloud} currentUser={userEmail}/> : <EmployeeSales store={store} setStore={updateStoreAndCloud} currentUser={userEmail}/>) } {displayActive==='payments'&&<PaymentsModule store={store} setStore={updateStoreAndCloud} currentUser={userEmail}/>} {displayActive==='clinical'&&<ClinicalModule store={store} setStore={updateStoreAndCloud} currentUser={userEmail}/>} {displayActive==='orders'&&<Orders store={store} setStore={updateStoreAndCloud} currentUser={userEmail} isAdmin={isAdmin}/>} {displayActive==='labs'&&<Laboratories labs={store.laboratories||[]} orders={store.orders||[]} setList={setList} isAdmin={isAdmin}/>} {displayActive==='inventoryAdd'&&<EmployeeInventoryAdd store={store} setStore={updateStoreAndCloud}/>} {isAdmin && displayActive==='customers'&&<Customers customers={store.customers||[]} setList={setList}/>} {isAdmin && displayActive==='cash'&&<Cash store={store} setStore={setStore} stats={stats}/>} {isAdmin && displayActive==='expenses'&&<Expenses expenses={store.expenses||[]} setList={setList}/>} {isAdmin && displayActive==='commissions'&&<CommissionsModule sales={store.sales||[]} orders={store.orders||[]}/>} {isAdmin && displayActive==='delayed'&&<DelayedSalesModule orders={store.orders||[]} labs={store.laboratories||[]}/>} {isAdmin && displayActive==='reports'&&<Reports store={store} stats={stats}/>} {isAdmin && displayActive==='config'&&<Config store={store} setStore={setStore}/>} {displayActive==='tracking'&&<EmployeeTracking orders={store.orders||[]} labs={store.laboratories||[]} setStore={updateStoreAndCloud} canEdit={!isAdmin}/>}</main></div>;
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
        <div className="heroFoot">GafasCity ERP <span>•</span> Producción 3.3</div>
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
  const blank={code:'',date:today(),category:'Montura',description:'',qty:'',cost:'',price:'',paymentMethod:'Efectivo',stock:'',minStock:'5'};
  const [form,setForm]=useState(blank);
  const [editId,setEditId]=useState(null);
  const [filters,setFilters]=useState({code:'',description:''});
  const products=Array.isArray(store.products)?store.products:[];
  const filtered=products.filter(p=>(!filters.code||String(p.code).toLowerCase().includes(filters.code.toLowerCase()))&&(!filters.description||String(p.description).toLowerCase().includes(filters.description.toLowerCase())));
  const save=()=>{if(!form.code||!form.description)return alert('Código y descripción son obligatorios'); const qty=Number(form.qty||form.stock||0); const item={...form, qty, cost:+form.cost, price:+form.price, stock:+(form.stock||qty), minStock:+form.minStock}; setStore(prev=>({...prev,products: editId ? (prev.products||[]).map(p=>p.id===editId?{...item,id:editId}:p) : [...(prev.products||[]),{...item,id:uid()}]}),'Inventario actualizado'); setForm(blank); setEditId(null);};
  const edit=(p)=>{const code=prompt('Código de supervisor'); if(code!==SUPERVISOR_CODE)return alert('Código incorrecto'); setEditId(p.id); setForm({...p}); window.scrollTo({top:0,behavior:'smooth'});};
  return <div className="stack"><Guide title="Agregar inventario" items={["Puedes agregar productos nuevos al inventario.","Para editar un producto existente se requiere código de supervisor.","Revisa categoría y código antes de guardar."]}/><Card title={editId?'Editar inventario con autorización':'Agregar producto'} wide><div className="formGrid"><Input v={form.code} p="Código" on={v=>setForm({...form,code:v})}/><Input v={form.date} p="Fecha" type="date" on={v=>setForm({...form,date:v})}/><Select p="Categoría" v={form.category} on={v=>setForm({...form,category:v})} opts={saleCategoryOptions.map(x=>[x,x])}/><Input v={form.description} p="Descripción" on={v=>setForm({...form,description:v})}/><Input v={form.qty} p="Cantidad" type="number" on={v=>setForm({...form,qty:v,stock:v})}/><Input v={form.cost} p="Costo" type="number" on={v=>setForm({...form,cost:v})}/><Input v={form.price} p="Precio" type="number" on={v=>setForm({...form,price:v})}/><Input v={form.stock} p="Stock" type="number" on={v=>setForm({...form,stock:v})}/><Input v={form.minStock} p="Stock mínimo" type="number" on={v=>setForm({...form,minStock:v})}/><button onClick={save}><Save size={16}/>{editId?'Guardar edición':'Agregar producto'}</button></div></Card><Card title="Consultar inventario" wide><div className="formGrid"><Input v={filters.code} p="Filtrar código" on={v=>setFilters({...filters,code:v})}/><Input v={filters.description} p="Filtrar descripción" on={v=>setFilters({...filters,description:v})}/></div><Table rows={filtered} columns={[["code","Código"],["category","Categoría"],["description","Descripción"],["stock","Stock"],["price","Precio",money],["actions","Acción",(_,r)=><button className="mini secondary" onClick={()=>edit(r)}>Editar con código</button>]]}/></Card></div>;
}

function PaymentsModule({store,setStore,currentUser}){
  const [q,setQ]=useState('');
  const [form,setForm]=useState({saleId:'',amount:'',method:'Efectivo',reference:'',notes:''});
  const sales=Array.isArray(store.sales)?store.sales:[];
  const openSales=sales.filter(s=>!s.cancelled && saleBalance(s)>0 && containsText(s,q));
  const selected=sales.find(s=>s.id===form.saleId) || openSales[0];
  const register=()=>{if(!selected)return alert('Selecciona una venta pendiente'); if(Number(form.amount)<=0)return alert('Monto inválido'); const amount=Number(form.amount); const payment={id:uid(),saleId:selected.id,date:today(),amount,method:form.method,reference:form.reference,notes:form.notes,registeredBy:getStaffName(currentUser),registeredEmail:currentUser}; setStore(prev=>({...prev,payments:[...(prev.payments||[]),payment],sales:(prev.sales||[]).map(s=>s.id===selected.id?{...s,paidAmount:salePaid(s)+amount,balance:Math.max(0,saleBalance(s)-amount),paymentStatus:Math.max(0,saleBalance(s)-amount)<=0?'Pagado':'Abonado'}:s)}),'Abono guardado'); setForm({saleId:'',amount:'',method:'Efectivo',reference:'',notes:''});};
  const history=(store.payments||[]).slice().reverse();
  return <div className="stack"><Guide title="Abonos / Cuentas por cobrar" items={["Busca una venta pendiente por cliente o código.","Registra cada abono con monto, método y referencia.","El saldo se actualiza automáticamente."]}/><Card title="Registrar abono" wide><div className="formGrid"><Input v={q} p="Buscar cliente o venta" on={setQ}/><Select p="Venta pendiente" v={form.saleId||selected?.id||''} on={v=>setForm({...form,saleId:v})} opts={openSales.map(s=>[s.id,`${s.customerName} - ${s.productCodeName} - Resta ${money(saleBalance(s))}`])}/><Input v={form.amount} p="Monto abonado USD" type="number" on={v=>setForm({...form,amount:v})}/><div className="totalBox">Abono Bs.:<b>{store.settings?.exchangeRate?bs(Number(form.amount||0)*Number(store.settings.exchangeRate)):'Configurar tasa'}</b></div><Select p="Método de pago" v={form.method} on={v=>setForm({...form,method:v})} opts={paymentOptions.map(x=>[x,x])}/><Input v={form.reference} p="Referencia" on={v=>setForm({...form,reference:v})}/><Input v={form.notes} p="Observaciones" on={v=>setForm({...form,notes:v})}/><button onClick={register}>Registrar abono</button></div></Card><Card title="Ventas pendientes" wide><Table rows={openSales} columns={[["customerName","Cliente"],["productCodeName","Código de lente"],["total","Total",money],["paidAmount","Abonado",v=>money(v||0)],["balance","Resta",v=>money(v||0)],["sellerName","Vendedor",v=>v||'-']]}/></Card><Card title="Historial de abonos" wide><Table rows={history} columns={[["date","Fecha"],["registeredBy","Registrado por"],["amount","Monto",money],["method","Método"],["reference","Referencia"],["notes","Observaciones"]]}/></Card></div>;
}

function CommissionsModule({sales,orders}){
  const [from,setFrom]=useState(today()),[to,setTo]=useState(today());
  const rows=(sales||[]).filter(s=>!s.cancelled&&!s.omitCommission&&inDateRange(s.date,from,to));
  const sellers=['Rhoy','Ely','Anyi'];
  const summary=sellers.map(name=>{const ss=rows.filter(s=>s.sellerName===name);const labJobs=name==='Ely'?(orders||[]).filter(o=>!o.clinical&&o.responsible==='Ely'&&inDateRange(o.date,from,to)).reduce((a,o)=>a+Number(o.labWorkCount||1),0):0;return {id:name,name,sales:ss.length,saleCommission:ss.length*SALE_COMMISSION,labJobs,labCommission:labJobs*ELY_LAB_COMMISSION,total:ss.length*SALE_COMMISSION+labJobs*ELY_LAB_COMMISSION};});
  return <div className="stack"><Card title="Comisiones" wide><div className="formGrid"><Input v={from} p="Desde" type="date" on={setFrom}/><Input v={to} p="Hasta" type="date" on={setTo}/><div className="totalBox">Por venta:<b>{money(SALE_COMMISSION)}</b></div><div className="totalBox">Ely por trabajo lab:<b>{money(ELY_LAB_COMMISSION)}</b></div></div></Card><Card title="Resumen" wide><Table rows={summary} columns={[["name","Empleado"],["sales","Ventas"],["saleCommission","Comisión ventas",money],["labJobs","Trabajos laboratorio"],["labCommission","Comisión laboratorio",money],["total","Total",money]]}/><p className="muted">La comisión de laboratorio de Ely se suma desde las órdenes registradas y responsables en el módulo de órdenes.</p></Card></div>;
}
function DelayedSalesModule({orders,labs}){
  const limits=Object.fromEntries((labs||[]).map(l=>[l.name,Number(l.deliveryLimitDays||7)]));
  const dayMs=86400000;
  const rows=(orders||[]).filter(o=>!o.clinical).map(o=>{const limit=limits[o.lab]||7;const elapsed=o.sentDate?Math.floor((new Date(today()+'T12:00:00')-new Date(o.sentDate+'T12:00:00'))/dayMs):0;const late=o.storeArrivalDate||o.status==='Entregado'?'done':(!o.sentDate?'waiting':elapsed>limit?'late':elapsed>=limit-2?'warning':'active');return {...o,limit,elapsed,deliveryState:late};});
  const label={waiting:'Sin enviar',active:'En plazo',warning:'Cerca del límite',late:'Límite superado',done:'Llegó / entregado'};
  return <div className="stack"><Card title="Límite de entrega" wide><div className="deliveryLegend"><span className="state active">En plazo</span><span className="state warning">Cerca del límite</span><span className="state late">Superado</span><span className="state done">Llegó / entregado</span></div><Table rows={rows} columns={[["number","Orden"],["customer","Cliente"],["lab","Laboratorio"],["sentDate","Enviado"],["limit","Límite días"],["elapsed","Días transcurridos"],["status","Estatus"],["deliveryState","Evaluación",v=><span className={`state ${v}`}>{label[v]}</span>]]}/></Card></div>;
}
function ClinicalModule({store,setStore,currentUser}){
  const blank={number:`HC-${String((store.orders||[]).filter(o=>o.clinical).length+1).padStart(4,'0')}`,date:today(),customer:'',phone:'',idCard:'',age:'',address:'',clinicalHistory:'',reason:'',odEsf:'',odCil:'',odEje:'',odAdd:'',oiEsf:'',oiCil:'',oiEje:'',oiAdd:'',dp:'',height:'',notes:''};
  const [form,setForm]=useState(blank),[q,setQ]=useState(''),[editing,setEditing]=useState(null);
  const save=()=>{if(!form.customer||!form.idCard)return alert('Paciente y cédula obligatorios');const prescription=`OD: Esf ${form.odEsf||'-'} | Cil ${form.odCil||'-'} | Eje ${form.odEje||'-'} | Add ${form.odAdd||'-'} / OI: Esf ${form.oiEsf||'-'} | Cil ${form.oiCil||'-'} | Eje ${form.oiEje||'-'} | Add ${form.oiAdd||'-'} / DP: ${form.dp||'-'} / Altura: ${form.height||'-'}`;const record={...form,id:editing||uid(),orderNumber:form.number,prescription,clinical:true,createdBy:getStaffName(currentUser),createdEmail:currentUser};setStore(prev=>({...prev,orders:editing?(prev.orders||[]).map(o=>o.id===editing?record:o):[...(prev.orders||[]),record]}),'Historia clínica guardada');setForm(blank);setEditing(null)};
  const rows=(store.orders||[]).filter(o=>o.clinical&&containsText(o,q)).slice().reverse();
  return <div className="stack"><Card title="Fórmulas / Historial clínico — Doctora" wide><div className="formGrid"><Input v={form.number} p="Código" on={v=>setForm({...form,number:v})}/><Input v={form.date} p="Fecha" type="date" on={v=>setForm({...form,date:v})}/><Input v={form.customer} p="Nombre y apellido" on={v=>setForm({...form,customer:v})}/><Input v={form.idCard} p="Cédula" on={v=>setForm({...form,idCard:v})}/><Input v={form.phone} p="Teléfono" on={v=>setForm({...form,phone:v})}/><Input v={form.age} p="Edad" type="number" on={v=>setForm({...form,age:v})}/><Input v={form.address} p="Dirección" on={v=>setForm({...form,address:v})}/><Input v={form.reason} p="Motivo de consulta" on={v=>setForm({...form,reason:v})}/><TextArea v={form.clinicalHistory} p="Historial clínico" rows={4} on={v=>setForm({...form,clinicalHistory:v})}/><div className="rxBox"><div className="rxTitle">Prescripción óptica</div><div className="rxGrid rxHeader"><span></span><span>Esf</span><span>Cil</span><span>Eje</span><span>Add</span></div><div className="rxGrid"><b>OD</b><Input v={form.odEsf} p="OD Esf" on={v=>setForm({...form,odEsf:v})}/><Input v={form.odCil} p="OD Cil" on={v=>setForm({...form,odCil:v})}/><Input v={form.odEje} p="OD Eje" on={v=>setForm({...form,odEje:v})}/><Input v={form.odAdd} p="OD Add" on={v=>setForm({...form,odAdd:v})}/></div><div className="rxGrid"><b>OI</b><Input v={form.oiEsf} p="OI Esf" on={v=>setForm({...form,oiEsf:v})}/><Input v={form.oiCil} p="OI Cil" on={v=>setForm({...form,oiCil:v})}/><Input v={form.oiEje} p="OI Eje" on={v=>setForm({...form,oiEje:v})}/><Input v={form.oiAdd} p="OI Add" on={v=>setForm({...form,oiAdd:v})}/></div><div className="rxGrid rxTwo"><Input v={form.dp} p="DP" on={v=>setForm({...form,dp:v})}/><Input v={form.height} p="Altura" on={v=>setForm({...form,height:v})}/></div></div><TextArea v={form.notes} p="Observaciones" rows={6} on={v=>setForm({...form,notes:v})}/><button onClick={save}><Save size={16}/>Guardar historia clínica</button></div></Card><Card title="Historial clínico" wide><div className="search"><Search size={16}/><input value={q} placeholder="Buscar paciente, cédula o teléfono" onChange={e=>setQ(e.target.value)}/></div><Table rows={rows} columns={[["date","Fecha"],["number","Código"],["customer","Paciente"],["idCard","Cédula"],["phone","Teléfono"],["address","Dirección"],["prescription","Fórmula"],["actions","Acción",(_,r)=><button className="mini secondary" onClick={()=>{setEditing(r.id);setForm({...blank,...r});window.scrollTo({top:0})}}>Editar</button>]]}/></Card></div>;
}
function Dashboard({store,stats}){
  const rate = Number(store.settings?.exchangeRate || 0);
  return <div className="grid">
    <KPI label="Ventas hoy" value={money(stats.salesToday)} hint="Ventas activas del dia"/>
    <KPI label="Caja disponible" value={money(stats.cashBalance)} hint="Caja inicial + ventas - gastos"/>
    <KPI label="Ordenes pendientes" value={stats.pendingOrders.length} hint="No entregadas"/>
    <KPI label="Tasa BCV" value={rate ? bs(rate) : 'Sin tasa'} hint={store.settings?.exchangeRateDate || 'Configurar tasa'} />
    <KPI label="Ventas hoy en Bs." value={rate ? bs(stats.salesToday * rate) : 'Configurar'} hint="Calculado con tasa guardada"/>
    <KPI label="Stock bajo" value={stats.lowStock.length} hint="Productos a reponer"/>
    <Card title="Inventario bajo"><Table rows={stats.lowStock} columns={[["code","Codigo"],["description","Producto"],["stock","Stock"],["minStock","Minimo"]]}/></Card>
    <Card title="Ordenes recientes"><Table rows={store.orders.slice(-5).reverse()} columns={[["number","Orden"],["customer","Cliente"],["lab","Laboratorio"],["balance","Resta",money],["status","Estatus"]]}/></Card>
    <Card title="Ventas recientes" wide><Table rows={store.sales.slice(-6).reverse()} columns={[["date","Fecha"],["customerName","Cliente"],["productCodeName","Producto"],["qty","Cant."],["total","Total",money],["totalBs","Total Bs.",(v,r)=>r.totalBs?bs(r.totalBs):(rate?bs(Number(r.total||0)*rate):'-')],["payment","Pago"],["sellerName","Vendedor",(v)=>v||'-'],["cancelled","Estado",v=>v?'Anulada':'Activa']]}/></Card>
  </div>;
}

const mergeInventoryByCode = (current, incoming) => {
  const map = new Map((current||[]).map(p=>[String(p.code||'').trim().toUpperCase(), {...p}]));
  let added=0,updated=0,skipped=0;
  (incoming||[]).map(normalizeImportedProduct).forEach(item=>{
    if(!item.code||!item.description){skipped++;return;}
    const key=item.code;
    if(map.has(key)){
      const old=map.get(key);
      map.set(key,{...old,...item,id:old.id,stock:Number(old.stock||0)+Number(item.stock||0),qty:Number(old.qty||0)+Number(item.qty||0)});
      updated++;
    }else{map.set(key,item);added++;}
  });
  return {products:[...map.values()],added,updated,skipped};
};
const parseInventoryFile = async file => {
  const text=await file.text();
  if(file.name.toLowerCase().endsWith('.json')) return JSON.parse(text);
  const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean);
  const headers=lines.shift().split(',').map(h=>h.replace(/^"|"$/g,'').trim());
  return lines.map(line=>{const vals=[];let cur='',quoted=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quoted&&line[i+1]==='"'){cur+='"';i++;}else quoted=!quoted;}else if(ch===','&&!quoted){vals.push(cur);cur='';}else cur+=ch;}vals.push(cur);return Object.fromEntries(headers.map((h,i)=>[h,vals[i]??'']));});
};
function Inventory({products,setList,setStore}){
  const blank={date:today(),category:'Montura',code:'',description:'',qty:'',cost:'',price:'',stock:'',minStock:'5'};
  const [form,setForm]=useState(blank),[editing,setEditing]=useState(null),[filters,setFilters]=useState({code:'',description:'',category:'Todos'});
  const [importSummary,setImportSummary]=useState(null);
  const pendingPrice=(products||[]).filter(p=>Number(p.price||0)<=0 && p.category!=='Cristales').length;
  const importFile=async(file)=>{try{if(!file)return;const incoming=await parseInventoryFile(file);if(!Array.isArray(incoming))throw new Error('El archivo no contiene una lista válida');const result=mergeInventoryByCode(products,incoming);setImportSummary(result);if(!confirm(`Se agregarán ${result.added} productos y se actualizarán ${result.updated}. ¿Continuar?`))return;setStore(prev=>({...prev,products:result.products}),'Inventario importado');alert(`Importación completada: ${result.added} nuevos, ${result.updated} actualizados, ${result.skipped} omitidos.`);}catch(e){alert(`No se pudo importar: ${e.message}`);}};
  const loadInitial=()=>{if((products||[]).length&&!confirm('El inventario ya tiene registros. Los códigos repetidos sumarán stock. ¿Continuar?'))return;const result=mergeInventoryByCode(products,INITIAL_INVENTORY);setStore(prev=>({...prev,products:result.products}),'Inventario inicial cargado');setImportSummary(result);};
  const exportBackup=()=>downloadCSV('inventario-respaldo',(products||[]));
  const costTotal=Number(form.qty||0)*Number(form.cost||0);
  const filtered=(products||[]).filter(p=>(filters.category==='Todos'||p.category===filters.category)&&(!filters.code||String(p.code).toLowerCase().includes(filters.code.toLowerCase()))&&(!filters.description||String(p.description).toLowerCase().includes(filters.description.toLowerCase())));
  const reset=()=>{setForm(blank);setEditing(null)};
  const save=()=>{if(!form.code||!form.description)return alert('Código y descripción son obligatorios');const qty=Number(form.qty||0);const item={...form,category:form.category==='Cristal'?'Cristales':form.category,qty,cost:+form.cost,costTotal,price:+form.price,stock:Number(form.stock||qty),minStock:+form.minStock};if(editing)setList('products',list=>list.map(p=>p.id===editing?{...item,id:editing}:p));else setList('products',list=>[...list,{...item,id:uid()}]);reset();};
  return <div className="stack"><Card title="Carga inicial de inventario" wide><div className="inventoryImport"><div><b>Inventario preparado: {INITIAL_INVENTORY.length} registros</b><span>{pendingPrice} productos físicos necesitan precio antes de venderse.</span></div><div className="actions"><button onClick={loadInitial}>Cargar inventario inicial</button><label className="fileButton">Importar JSON o CSV<input type="file" accept=".json,.csv" onChange={e=>importFile(e.target.files?.[0])}/></label><button className="secondary" onClick={exportBackup}>Exportar respaldo</button></div></div>{importSummary&&<div className="importResult">Nuevos: <b>{importSummary.added}</b> · Actualizados: <b>{importSummary.updated}</b> · Omitidos: <b>{importSummary.skipped}</b></div>}</Card><Card title={editing?'Editar producto':'Inventario / nuevo producto'} wide action={editing&&<button className="secondary" onClick={reset}>Cancelar</button>}><div className="inventoryLine"><Input v={form.date} p="Fecha" type="date" on={v=>setForm({...form,date:v})}/><Select p="Categoría" v={form.category} on={v=>setForm({...form,category:v})} opts={saleCategoryOptions.map(x=>[x,x])}/><Input v={form.code} p="Código" on={v=>setForm({...form,code:v})}/><Input v={form.description} p="Descripción" on={v=>setForm({...form,description:v})}/></div><div className="inventoryLine six"><Input v={form.qty} p="Cantidad" type="number" on={v=>setForm({...form,qty:v,stock:v})}/><Input v={form.cost} p="Costo unitario" type="number" on={v=>setForm({...form,cost:v})}/><div className="totalBox">Costo total:<b>{money(costTotal)}</b></div><Input v={form.price} p="Precio" type="number" on={v=>setForm({...form,price:v})}/><Input v={form.stock} p="Stock" type="number" on={v=>setForm({...form,stock:v})}/><Input v={form.minStock} p="Stock mínimo" type="number" on={v=>setForm({...form,minStock:v})}/></div><button onClick={save}><Save size={16}/>{editing?'Guardar cambios':'Agregar producto'}</button></Card><Card title="Buscar inventario" wide><div className="formGrid"><Input v={filters.code} p="Filtrar por código" on={v=>setFilters({...filters,code:v})}/><Input v={filters.description} p="Filtrar por descripción" on={v=>setFilters({...filters,description:v})}/><Select p="Categoría" v={filters.category} on={v=>setFilters({...filters,category:v})} opts={['Todos',...saleCategoryOptions].map(x=>[x,x])}/></div><Table rows={filtered} columns={[["date","Fecha"],["category","Categoría"],["code","Código"],["description","Descripción"],["qty","Cantidad"],["cost","Costo u.",money],["costTotal","Costo total",(v,r)=>money(v??Number(r.qty||0)*Number(r.cost||0))],["price","Precio",money],["stock","Stock"],["minStock","Mínimo"],["actions","Acciones",(_,r)=><div className="rowActions"><button className="mini secondary" onClick={()=>{setEditing(r.id);setForm({...r});window.scrollTo({top:0})}}>Editar</button><button className="mini danger" onClick={()=>confirm('¿Eliminar producto?')&&setList('products',l=>l.filter(p=>p.id!==r.id))}>Eliminar</button></div>]]}/></Card></div>;
}
function Sales({store,setStore,currentUser,employeeMode=false}){
  const products=store.products||[],rate=Number(store.settings?.exchangeRate||0),sellerName=getStaffName(currentUser);
  const makeLine=()=>({id:uid(),category:'Montura',productId:'',qty:1});
  const [sale,setSale]=useState({date:today(),customerName:'',payment:'Efectivo',initialPayment:'',reference:'',lines:[makeLine()]});
  const [filters,setFilters]=useState({q:'',from:'',to:'',payment:'Todos',status:'Todos'});
  const updateLine=(id,patch)=>setSale({...sale,lines:sale.lines.map(l=>l.id===id?{...l,...patch}:l)});
  const lineRows=sale.lines.map(l=>{const p=products.find(x=>x.id===l.productId);return {...l,product:p,description:p?.description||'',unitPrice:Number(p?.price||0),lineTotal:Number(p?.price||0)*Number(l.qty||0)}});
  const total=lineRows.reduce((a,l)=>a+l.lineTotal,0), totalBs=total*rate, paid=Math.min(total,Number(sale.initialPayment||0)), balance=Math.max(0,total-paid);
  const complete=()=>{if(!sale.customerName)return alert('Nombre del cliente obligatorio');if(!lineRows.length||lineRows.some(l=>!l.product))return alert('Selecciona todos los códigos de lente');if(lineRows.some(l=>Number(l.unitPrice)<=0))return alert('Hay productos sin precio. El administrador debe asignar el precio antes de vender.');if(lineRows.some(l=>l.product.category!=='Cristales'&&(Number(l.qty)<=0||Number(l.product.stock)<Number(l.qty))))return alert('Cantidad inválida o stock insuficiente');const newSale={id:uid(),date:sale.date,registeredDate:today(),customerName:sale.customerName,items:lineRows.map(l=>({productId:l.product.id,code:l.product.code,description:l.product.description,category:l.product.category,qty:Number(l.qty),unitPrice:l.unitPrice,total:l.lineTotal})),productCodeName:lineRows.map(l=>`${l.product.code} - ${l.product.description}`).join(' + '),qty:lineRows.reduce((a,l)=>a+Number(l.qty),0),payment:sale.payment,reference:sale.reference,total,totalBs,paidAmount:paid,paidAmountBs:paid*rate,balance,balanceBs:balance*rate,paymentStatus:balance<=0?'Pagado':(paid>0?'Abonado':'Pendiente'),exchangeRate:rate,sellerName,sellerEmail:currentUser,delayed:sale.date!==today(),omitCommission:false,cancelled:false};setStore(prev=>({...prev,sales:[...(prev.sales||[]),newSale],products:(prev.products||[]).map(p=>{const sold=lineRows.filter(l=>l.product.id===p.id).reduce((a,l)=>a+Number(l.qty),0);return sold&&p.category!=='Cristales'?{...p,stock:Number(p.stock)-sold}:p})}),'Venta guardada');setSale({date:today(),customerName:'',payment:'Efectivo',initialPayment:'',reference:'',lines:[makeLine()]});};
  const filtered=(store.sales||[]).filter(x=>inDateRange(x.date,filters.from,filters.to)&&(filters.payment==='Todos'||x.payment===filters.payment)&&(filters.status==='Todos'||(filters.status==='Activas'?!x.cancelled:x.cancelled))&&containsText(x,filters.q));
  const cancelSale=(x)=>{if(x.cancelled||!confirm('¿Anular venta y devolver inventario?'))return;setStore(prev=>({...prev,sales:(prev.sales||[]).map(s=>s.id===x.id?{...s,cancelled:true}:s),products:(prev.products||[]).map(p=>{const items=x.items||[{productId:x.productId,qty:x.qty}];const qty=items.filter(i=>i.productId===p.id).reduce((a,i)=>a+Number(i.qty||0),0);return qty?{...p,stock:Number(p.stock)+qty}:p})}),'Venta anulada');};
  return <div className="stack"><Card title="Registrar venta" wide><div className="sellerBanner">Venta registrada por: <b>{sellerName}</b></div><div className="salesHeader"><Input v={sale.date} p="Fecha" type="date" on={v=>setSale({...sale,date:v})}/><Input v={sale.customerName} p="Nombre y apellido" on={v=>setSale({...sale,customerName:v})}/></div><div className="saleLines">{lineRows.map((l,index)=><div className="saleLine" key={l.id}><Select p="Categoría" v={l.category} on={v=>updateLine(l.id,{category:v,productId:''})} opts={saleCategoryOptions.map(x=>[x,x])}/><ProductFinder products={products.filter(p=>(p.category==='Cristal'?'Cristales':p.category)===l.category)} value={l.productId} onSelect={v=>updateLine(l.id,{productId:v})}/><div className="totalBox">Descripción:<b>{l.description||'-'}</b></div><Input v={l.qty} p="Cantidad" type="number" on={v=>updateLine(l.id,{qty:v})}/><div className="totalBox">Precio u.:<b>{money(l.unitPrice)}</b></div><div className="totalBox">Precio total:<b>{money(l.lineTotal)}</b></div><button className="mini danger" disabled={sale.lines.length===1} onClick={()=>setSale({...sale,lines:sale.lines.filter(x=>x.id!==l.id)})}>Quitar</button></div>)}</div><button className="secondary addLine" onClick={()=>setSale({...sale,lines:[...sale.lines,makeLine()]})}><Plus size={16}/> Agregar otro lente</button><div className="paymentBlock"><h3>MÉTODO DE PAGO</h3><div className="formGrid"><Select p="Método de pago" v={sale.payment} on={v=>setSale({...sale,payment:v})} opts={paymentOptions.map(x=>[x,x])}/><div className="totalBox">Monto total USD:<b>{money(total)}</b></div><div className="totalBox">Monto total Bs.:<b>{rate?bs(totalBs):'Configurar tasa'}</b></div><Input v={sale.initialPayment} p="Abono inicial USD" type="number" on={v=>setSale({...sale,initialPayment:v})}/><div className="totalBox">Abono Bs.:<b>{rate?bs(paid*rate):'Configurar tasa'}</b></div><Input v={sale.reference} p="Referencia" on={v=>setSale({...sale,reference:v})}/><div className="totalBox">Saldo USD:<b>{money(balance)}</b></div><div className="totalBox">Saldo Bs.:<b>{rate?bs(balance*rate):'Configurar tasa'}</b></div><button onClick={complete}><Save size={16}/>Registrar venta</button></div></div></Card>{!employeeMode&&<Card title="Filtros e historial" wide><div className="formGrid"><Input v={filters.q} p="Buscar cliente, código o producto" on={v=>setFilters({...filters,q:v})}/><Input v={filters.from} p="Desde" type="date" on={v=>setFilters({...filters,from:v})}/><Input v={filters.to} p="Hasta" type="date" on={v=>setFilters({...filters,to:v})}/><Select p="Método" v={filters.payment} on={v=>setFilters({...filters,payment:v})} opts={['Todos',...paymentOptions].map(x=>[x,x])}/><Select p="Estado" v={filters.status} on={v=>setFilters({...filters,status:v})} opts={['Todos','Activas','Anuladas'].map(x=>[x,x])}/></div><Table rows={filtered.slice().reverse()} columns={[["date","Fecha"],["customerName","Cliente"],["productCodeName","Productos"],["qty","Cant."],["total","Total",money],["paidAmount","Abonado",money],["balance","Saldo",money],["payment","Pago"],["reference","Referencia"],["sellerName","Vendedor"],["cancelled","Estado",v=>v?'Anulada':'Activa'],["actions","Acción",(_,r)=><button className="mini danger" disabled={r.cancelled} onClick={()=>cancelSale(r)}>Anular</button>]]}/></Card>}</div>;
}
function Orders({store,setStore,currentUser,isAdmin}){
  const orders=store.orders||[],labs=store.laboratories||[],rate=Number(store.settings?.exchangeRate||0),responsible=getStaffName(currentUser);
  const blank={number:`GC-${String(orders.length+1).padStart(4,'0')}`,date:today(),customer:'',idCard:'',phone:'',address:'',lens:'',treatment:'',lab:labs[0]?.name||'',total:'',paymentMethod:'Efectivo',totalReference:'',deposit:'',depositReference:'',status:'En la tienda',sentDate:'',storeArrivalDate:'',notifiedClient:'No',labPayment:'No pagado',labAmount:'',labWorkCount:'1',notes:'',warranty:'No'};
  const [form,setForm]=useState(blank),[editing,setEditing]=useState(null),[filters,setFilters]=useState({q:'',lab:'Todos',status:'Todos'}),[extraPayments,setExtraPayments]=useState([]);
  const patient=orders.slice().reverse().find(o=>o.clinical&&(String(o.customer).toLowerCase()===String(form.customer).toLowerCase()||String(o.idCard)===String(form.idCard)));
  useEffect(()=>{if(patient)setForm(f=>({...f,phone:patient.phone||'',address:patient.address||'',prescription:patient.prescription||'',odEsf:patient.odEsf||'',odCil:patient.odCil||'',odEje:patient.odEje||'',odAdd:patient.odAdd||'',oiEsf:patient.oiEsf||'',oiCil:patient.oiCil||'',oiEje:patient.oiEje||'',oiAdd:patient.oiAdd||'',dp:patient.dp||'',height:patient.height||''}))},[patient?.id]);
  const total=Number(form.total||0),deposit=Number(form.deposit||0),extraTotal=extraPayments.reduce((a,p)=>a+Number(p.amount||0),0),balance=Math.max(0,total-deposit-extraTotal);
  const save=()=>{if(!form.customer||!form.idCard)return alert('Nombre y cédula son obligatorios');const order={...form,id:editing||uid(),total,deposit,balance,totalBs:total*rate,depositBs:deposit*rate,balanceBs:balance*rate,payments:extraPayments,responsible,responsibleEmail:currentUser,clinical:false,prescription:patient?.prescription||form.prescription||''};setStore(prev=>({...prev,orders:editing?(prev.orders||[]).map(o=>o.id===editing?order:o):[...(prev.orders||[]),order]}),'Orden guardada');setForm(blank);setEditing(null);setExtraPayments([])};
  const filtered=orders.filter(o=>!o.clinical&&(filters.lab==='Todos'||o.lab===filters.lab)&&(filters.status==='Todos'||o.status===filters.status)&&containsText(o,filters.q));
  const addPayment=()=>setExtraPayments([...extraPayments,{id:uid(),date:today(),amount:'',reference:'',method:'Efectivo'}]);
  return <div className="stack"><Card title={editing?'Editar orden':'Órdenes y fórmulas'} wide><div className="sectionTitle">PACIENTE</div><div className="formGrid"><Input v={form.number} p="Código de orden" on={v=>setForm({...form,number:v})}/><Input v={form.date} p="Fecha" type="date" on={v=>setForm({...form,date:v})}/><Input v={form.customer} p="Nombre y apellido" on={v=>setForm({...form,customer:v})}/><Input v={form.idCard} p="Cédula" on={v=>setForm({...form,idCard:v})}/></div><div className="rxReadOnly"><b>Prescripción óptica (solo doctora)</b><span>{patient?.prescription||form.prescription||'No hay fórmula registrada para este paciente'}</span></div><div className="sectionTitle">TRABAJOS ÓPTICOS</div><div className="formGrid"><Input v={form.lens} p="Cristal" on={v=>setForm({...form,lens:v})}/><Input v={form.treatment} p="Tratamiento" on={v=>setForm({...form,treatment:v})}/><Select p="Garantía" v={form.warranty} on={v=>setForm({...form,warranty:v})} opts={[["No","Sin garantía"],["Si","Con garantía"]]}/></div><div className="sectionTitle">MÉTODO DE PAGO</div><div className="formGrid"><Select p="Método de pago" v={form.paymentMethod} on={v=>setForm({...form,paymentMethod:v})} opts={paymentOptions.map(x=>[x,x])}/><Input v={form.total} p="Monto total trabajos USD" type="number" on={v=>setForm({...form,total:v})}/><div className="totalBox">Monto total Bs.:<b>{rate?bs(total*rate):'Configurar tasa'}</b></div><Input v={form.totalReference} p="Referencia monto total" on={v=>setForm({...form,totalReference:v})}/><Input v={form.deposit} p="Pago inicial USD" type="number" on={v=>setForm({...form,deposit:v})}/><div className="totalBox">Pago inicial Bs.:<b>{rate?bs(deposit*rate):'Configurar tasa'}</b></div><Input v={form.depositReference} p="Referencia pago inicial" on={v=>setForm({...form,depositReference:v})}/><div className="totalBox">Resta:<b>{money(balance)}</b></div></div>{extraPayments.map((p,i)=><div className="paymentRow" key={p.id}><Input v={p.date} p="Fecha abono" type="date" on={v=>setExtraPayments(extraPayments.map(x=>x.id===p.id?{...x,date:v}:x))}/><Input v={p.amount} p="Abono USD" type="number" on={v=>setExtraPayments(extraPayments.map(x=>x.id===p.id?{...x,amount:v}:x))}/><div className="totalBox">Abono Bs.:<b>{rate?bs(Number(p.amount||0)*rate):'-'}</b></div><Input v={p.reference} p="Referencia" on={v=>setExtraPayments(extraPayments.map(x=>x.id===p.id?{...x,reference:v}:x))}/></div>)}<button className="secondary" onClick={addPayment}><Plus size={16}/>Agregar abono</button><div className="sectionTitle">LABORATORIO</div><div className="formGrid"><Select p="Laboratorio" v={form.lab} on={v=>setForm({...form,lab:v})} opts={labs.map(l=>[l.name,l.name])}/><Input v={form.sentDate} p="Fecha de enviado" type="date" on={v=>setForm({...form,sentDate:v})}/><Select p="Estatus de orden" v={form.status} on={v=>setForm({...form,status:v})} opts={['En la tienda','Enviado','Proceso','Entregado'].map(x=>[x,x])}/><Input v={form.storeArrivalDate} p="Fecha llegada a tienda" type="date" on={v=>setForm({...form,storeArrivalDate:v})}/><Select p="Cliente notificado" v={form.notifiedClient} on={v=>setForm({...form,notifiedClient:v})} opts={[["No","No"],["Si","Sí"]]}/>{isAdmin&&<Select p="Pago laboratorio" v={form.labPayment} on={v=>setForm({...form,labPayment:v})} opts={['No pagado','Pago parcial','Pagado'].map(x=>[x,x])}/>} {isAdmin&&<Input v={form.labAmount} p="Monto laboratorio" type="number" on={v=>setForm({...form,labAmount:v})}/>} {isAdmin&&<Input v={form.labWorkCount} p="Cantidad trabajos a pagar" type="number" on={v=>setForm({...form,labWorkCount:v})}/>}<TextArea v={form.notes} p="Observaciones" on={v=>setForm({...form,notes:v})}/><button onClick={save}><Save size={16}/>Guardar orden</button></div></Card><Card title="Filtros de órdenes" wide><div className="formGrid"><Input v={filters.q} p="Buscar cliente, cédula u orden" on={v=>setFilters({...filters,q:v})}/><Select p="Laboratorio" v={filters.lab} on={v=>setFilters({...filters,lab:v})} opts={['Todos',...labs.map(l=>l.name)].map(x=>[x,x])}/><Select p="Estatus" v={filters.status} on={v=>setFilters({...filters,status:v})} opts={['Todos','En la tienda','Enviado','Proceso','Entregado'].map(x=>[x,x])}/></div><Table rows={filtered.slice().reverse()} columns={[["number","Orden"],["customer","Cliente"],["idCard","Cédula"],["lab","Laboratorio"],["sentDate","Enviado"],["status","Estatus"],["storeArrivalDate","Llegó tienda"],["notifiedClient","Notificado"],["balance","Resta",money],["responsible","Responsable"],...(isAdmin?[["labPayment","Pago lab"],["labAmount","Monto lab",money]]:[]),["actions","Acción",(_,r)=><button className="mini secondary" onClick={()=>{setEditing(r.id);setForm({...blank,...r});setExtraPayments(r.payments||[]);window.scrollTo({top:0})}}>Editar</button>]]}/></Card></div>;
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
      <p className="muted">Por ahora la tasa se carga manualmente. El BCV publica el tipo de cambio oficial y la tasa USD de referencia en su portal, pero para actualizarla automaticamente necesitaremos luego una funcion en servidor o una API intermedia.</p>
    </Card>
    <Card title="Configuracion visual" wide>
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
      <div className="statusBox"><b>{settings.versionTitle || 'Producción Final 3.0'}</b><span>{settings.versionDescription || 'Operación final integral GafasCity.'}</span></div>
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
