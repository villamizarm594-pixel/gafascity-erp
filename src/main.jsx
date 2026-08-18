import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { LayoutDashboard, Package, ShoppingCart, Users, ClipboardList, Wallet, Receipt, BarChart3, Plus, Search, Save, Microscope, Pencil, Trash2, RotateCcw, Settings } from 'lucide-react';
import './styles.css';

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
const COMMISSION_RATE = 0.05;
const getUserRole = (email = '') => { const e = email.toLowerCase(); if (ADMIN_EMAILS.includes(e)) return 'admin'; if (e === 'empleado4@gafascity.com') return 'formula'; return 'empleado'; };
const getStaffName = (email = '') => STAFF_NAMES[email.toLowerCase()] || email || 'Usuario';

const today = () => new Date().toISOString().slice(0, 10);
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
const paymentOptions = ['Efectivo','Pago movil','Divisas','Transferencia','Mixto','Zelle','Binance'];
const saleCategoryOptions = ['Montura','Cristal','Accesorio','Servicio','Otros'];
const salePaid = (s) => Number(s.paidAmount ?? s.total ?? 0);
const saleBalance = (s) => Number(s.balance ?? Math.max(0, Number(s.total||0) - salePaid(s)));
const saleStatus = (s) => saleBalance(s) <= 0 ? 'Pagado' : (salePaid(s) > 0 ? 'Abonado' : 'Pendiente');
const defaultLabs = ['Novak', 'Opas (Vector)', 'Liberty', 'Prats', 'Jesus Tallador', 'Fer Visprolentes'];

const seed = {
  products: [
    { id:'p1', code:'OK1602', date:today(), category:'Montura', description:'Oakley Conductor', qty:13, cost:10, price:25, paymentMethod:'Efectivo', stock:13, minStock:5 },
    { id:'p2', code:'RB101', date:today(), category:'Montura', description:'Rayban', qty:27, cost:8, price:15, paymentMethod:'Pago movil', stock:27, minStock:5 },
    { id:'p3', code:'CRAR', date:today(), category:'Cristal', description:'Cristal antirreflejo', qty:20, cost:6, price:20, paymentMethod:'Divisas', stock:20, minStock:5 }
  ],
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
  settings: { businessName:'GafasCity ERP', subtitle:'Gestion optica interna', logo:'', versionTitle:'Produccion 2.0.2', versionDescription:'Hotfix login y estabilidad', exchangeRate:0, exchangeRateDate:today() }
};

function normalizeStore(raw = {}) {
  const base = seed;
  raw = raw || {};
  return {
    ...base,
    ...raw,
    products: Array.isArray(raw.products) ? raw.products : [],
    customers: Array.isArray(raw.customers) ? raw.customers : [],
    laboratories: Array.isArray(raw.laboratories) && raw.laboratories.length ? raw.laboratories : base.laboratories,
    sales: Array.isArray(raw.sales) ? raw.sales : [],
    orders: Array.isArray(raw.orders) ? raw.orders : [],
    expenses: Array.isArray(raw.expenses) ? raw.expenses : [],
    cashSessions: Array.isArray(raw.cashSessions) ? raw.cashSessions : [],
    payments: Array.isArray(raw.payments) ? raw.payments : [],
    cash: { ...base.cash, ...(raw.cash || {}) },
    settings: { ...base.settings, ...(raw.settings || {}) }
  };
}

function loadStore(){
  try{
    const raw = localStorage.getItem('gafascity-store-v2');
    return normalizeStore(raw ? JSON.parse(raw) : seed);
  }catch(e){
    console.error('Error cargando datos locales', e);
    return normalizeStore(seed);
  }
}

class ErrorBoundary extends React.Component {
  constructor(props){super(props);this.state={error:null};}
  static getDerivedStateFromError(error){return {error};}
  componentDidCatch(error, info){console.error(error, info);}
  render(){
    if(this.state.error){return <div className="appError"><h2>Ocurrió un error en esta pantalla</h2><p>{String(this.state.error?.message || this.state.error)}</p><button onClick={()=>location.reload()}>Recargar</button></div>;}
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

  const loadCloud = async () => {
    setCloudStatus('Cargando desde Supabase...');
    const { data, error } = await supabase.from('app_state').select('data').eq('id', CLOUD_STATE_ID).maybeSingle();
    if(error){ setCloudStatus('Error cargando'); alert(error.message); return; }
    if(data?.data){ setStore(normalizeStore(data.data)); setCloudStatus('Cargado desde nube'); }
    else { setCloudStatus('No hay respaldo en nube'); alert('Todavía no hay datos guardados en Supabase. Guarda primero desde esta app.'); }
  };

  const updateStoreAndCloud = (updater, message='Guardado automatico') => {
    setStore(prev => {
      const next = normalizeStore(typeof updater === 'function' ? updater(normalizeStore(prev)) : updater);
      localStorage.setItem('gafascity-store-v2', JSON.stringify(next));
      setCloudStatus('Guardando automático...');
      supabase.from('app_state').upsert({ id: CLOUD_STATE_ID, data: next, updated_at: new Date().toISOString() })
        .then(({ error }) => setCloudStatus(error ? 'Error guardando' : message));
      return next;
    });
  };

  const stats = useMemo(()=>{
    const activeSales = (store.sales||[]).filter(s=>!s.cancelled);
    const salesToday = activeSales.filter(s=>s.date===today()).reduce((a,s)=>a+Number(s.total),0);
    const salesByMethod = {
      efectivo: activeSales.filter(s=>s.date===today() && s.payment==='Efectivo').reduce((a,s)=>a+Number(s.total),0),
      pagoMovil: activeSales.filter(s=>s.date===today() && s.payment==='Pago movil').reduce((a,s)=>a+Number(s.total),0),
      divisas: activeSales.filter(s=>s.date===today() && s.payment==='Divisas').reduce((a,s)=>a+Number(s.total),0),
      transferencia: activeSales.filter(s=>s.date===today() && s.payment==='Transferencia').reduce((a,s)=>a+Number(s.total),0),
      mixto: activeSales.filter(s=>s.date===today() && s.payment==='Mixto').reduce((a,s)=>a+Number(s.total),0)
    };
    const expensesToday = store.expenses.filter(e=>e.date===today()).reduce((a,e)=>a+Number(e.amount),0);
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
    ['dashboard','Inicio',LayoutDashboard], ['sales','Ventas',ShoppingCart], ['payments','Abonos / Cuentas',Wallet], ['clinical','Fórmulas / Historial',ClipboardList], ['orders','Ordenes / formulas',ClipboardList], ['labs','Laboratorios',Microscope], ['inventory','Inventario',Package], ['customers','Clientes',Users], ['cash','Caja diaria',Wallet], ['expenses','Gastos',Receipt], ['commissions','Comisiones',BarChart3], ['delayed','Ventas con retraso',Receipt], ['reports','Reportes',BarChart3], ['config','Configuracion',Settings]
  ];
  const employeeNav = [
    ['sales','Registrar venta',ShoppingCart], ['inventoryAdd','Agregar inventario',Package], ['payments','Abonos',Wallet], ['tracking','Seguimiento de trabajos',ClipboardList]
  ];
  const formulaNav = [
    ['clinical','Fórmulas / Historial',ClipboardList], ['tracking','Seguimiento de trabajos',ClipboardList]
  ];
  const nav = isAdmin ? adminNav : (isFormulaUser ? formulaNav : employeeNav);
  const displayActive = nav.some(n => n[0] === active) ? active : (isAdmin ? 'dashboard' : (isFormulaUser ? 'clinical' : 'sales'));

  if(!session) return <Login />;

  return <div className="app"><aside className="sidebar"><div className="brand">{store.settings?.logo ? <img className="logoImg" src={store.settings.logo} alt="Logo"/> : <span>GC</span>}<div><b>{store.settings?.businessName || 'GafasCity ERP'}</b><small>{store.settings?.subtitle || 'Gestion optica interna'}</small></div></div><nav>{nav.map(([id,label,Icon])=><button key={id} onClick={()=>setActive(id)} className={displayActive===id?'active':''}><Icon size={18}/>{label}</button>)}</nav><div className="statusBox"><b>{store.settings?.versionTitle || 'Version 4'}</b><span>{store.settings?.versionDescription || 'Caja diaria mejorada y logo editable.'}</span></div></aside><main><header className="topbar"><div><h1>{nav.find(n=>n[0]===displayActive)?.[1]}</h1><p>Flujo basado en inventario, ventas, trabajos de formula y laboratorios.</p></div><div className="actions topActions"><span className="badge">{isAdmin ? 'Admin' : (isFormulaUser ? 'Fórmulas' : 'Empleado')} - {cloudStatus}</span>{isAdmin&&<button className="secondary" onClick={loadCloud}>Cargar nube</button>}{isAdmin&&<button onClick={saveCloud}>Guardar nube</button>}<button className="ghost" onClick={()=>supabase.auth.signOut()}>Salir</button>{isAdmin&&<button className="ghost" onClick={()=>{if(confirm('Esto reinicia los datos locales.')){localStorage.removeItem('gafascity-store-v2');location.reload();}}}>Reiniciar local</button>}</div></header>{isAdmin && displayActive==='dashboard'&&<Dashboard store={store} stats={stats}/>} {isAdmin && displayActive==='inventory'&&<Inventory products={store.products} setList={setList} query={query} setQuery={setQuery}/>} {displayActive==='sales'&&(isAdmin ? <Sales store={store} setStore={updateStoreAndCloud} currentUser={userEmail}/> : <EmployeeSales store={store} setStore={updateStoreAndCloud} currentUser={userEmail}/>) } {displayActive==='payments'&&<PaymentsModule store={store} setStore={updateStoreAndCloud} currentUser={userEmail} isAdmin={isAdmin}/>} {displayActive==='clinical'&&<ClinicalModule store={store} setStore={updateStoreAndCloud} currentUser={userEmail} isAdmin={isAdmin}/>} {isAdmin && displayActive==='orders'&&<Orders orders={store.orders} labs={store.laboratories} setList={setList}/>} {isAdmin && displayActive==='labs'&&<Laboratories labs={store.laboratories} orders={store.orders} setList={setList}/>} {displayActive==='inventoryAdd'&&<EmployeeInventoryAdd store={store} setStore={updateStoreAndCloud}/>} {isAdmin && displayActive==='customers'&&<Customers customers={store.customers} setList={setList}/>} {isAdmin && displayActive==='cash'&&<Cash store={store} setStore={setStore} stats={stats}/>} {isAdmin && displayActive==='expenses'&&<Expenses expenses={store.expenses} setList={setList}/>} {isAdmin && displayActive==='commissions'&&<CommissionsModule sales={store.sales}/>} {isAdmin && displayActive==='delayed'&&<DelayedSalesModule sales={store.sales} setStore={updateStoreAndCloud}/>} {isAdmin && displayActive==='reports'&&<Reports store={store} stats={stats}/>} {isAdmin && displayActive==='config'&&<Config store={store} setStore={setStore}/>} {displayActive==='tracking'&&<EmployeeTracking orders={store.orders} labs={store.laboratories} setStore={updateStoreAndCloud} canEdit={!isAdmin}/>}</main></div>;
}

function KPI({label,value,hint}){return <div className="kpi"><span>{label}</span><b>{value}</b>{hint&&<small>{hint}</small>}</div>}
function Card({title,children,action,wide}){return <section className={wide?'card wide':'card'}><div className="cardHead"><h2>{title}</h2>{action}</div>{children}</section>}
function FieldLabel({p}){const h=fieldHelp(p);return <span className="fieldTitle">{p}{h.required&&<b>*</b>}<em title={h.text}>?</em></span>}
function Input({v,on,p,type='text'}){return <label className="field compactField"><FieldLabel p={p}/><input value={v??''} type={type} placeholder={p} onChange={e=>on(e.target.value)}/></label>}
function Select({v,on,opts,p}){const control=<select value={v??''} onChange={e=>on(e.target.value)}>{opts.map(([val,label])=><option key={val} value={val}>{label}</option>)}</select>; if(!p)return control; return <label className="field compactField"><FieldLabel p={p}/>{control}</label>}
function Table({rows,columns,empty='Sin registros'}){if(!rows.length)return <p className="muted">{empty}</p>;return <div className="tableWrap"><table><thead><tr>{columns.map(c=><th key={c[0]}>{c[1]}</th>)}</tr></thead><tbody>{rows.map((r,idx)=><tr key={r.id||idx}>{columns.map(([key,,fmt])=><td key={key}>{fmt?fmt(r[key],r):r[key]}</td>)}</tr>)}</tbody></table></div>}

function Login(){
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
  return <div className="loginPage">
    <div className="loginCard">
      <div className="brand previewBrand"><span>GC</span><div><b>GafasCity ERP</b><small>Acceso interno</small></div></div>
      <h1>{mode === 'login' ? 'Iniciar sesión' : 'Crear usuario'}</h1>
      <p className="muted">Ingresa con un usuario autorizado para sincronizar datos en Supabase.</p>
      <input value={email} placeholder="Correo" onChange={e=>setEmail(e.target.value)}/>
      <input value={password} placeholder="Contraseña" type="password" onChange={e=>setPassword(e.target.value)}/>
      <button onClick={submit} disabled={loading}>{loading ? 'Procesando...' : (mode === 'login' ? 'Entrar' : 'Crear usuario')}</button>
      <button className="secondary" onClick={()=>setMode(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'Crear usuario nuevo' : 'Ya tengo usuario'}</button>
    </div>
  </div>
}

function Guide({title,items}){return <details className="guideCompact"><summary>{title}<span>Ver ayuda</span></summary><ul className="guideList">{items.map((item,index)=><li key={index}>{item}</li>)}</ul></details>}

function EmployeeSales({store,setStore,currentUser}){
  const firstProduct=store.products[0];
  const [sale,setSale]=useState({date:today(),customerName:'',category:'Montura',productId:firstProduct?.id||'',qty:1,payment:'Efectivo',initialPayment:'',warranty:'No'});
  const categoryProducts = (store.products||[]).filter(p => !sale.category || p.category === sale.category);
  const product=(store.products||[]).find(p=>p.id===sale.productId) || categoryProducts[0];
  const total=product?product.price*Number(sale.qty||0):0;
  const rate = Number(store.settings?.exchangeRate || 0);
  const totalBs = rate ? total * rate : 0;
  const sellerName = getStaffName(currentUser);
  const sellerEmail = currentUser || '';
  const complete=()=>{
    if(!sale.customerName)return alert('Nombre del cliente obligatorio');
    if(!product)return alert('Selecciona un producto');
    if(Number(sale.qty)<=0)return alert('Cantidad invalida');
    if(product.stock<Number(sale.qty))return alert('No hay stock suficiente');
    const newSale={id:uid(),date:sale.date,customerName:sale.customerName,productId:product.id,productCodeName:`${product.code} - ${product.description}`,category:sale.category || product.category,description:product.description,qty:Number(sale.qty),payment:sale.payment,total,totalBs,paidAmount:Number(sale.initialPayment||total),balance:Math.max(0,total-Number(sale.initialPayment||total)),paymentStatus:Math.max(0,total-Number(sale.initialPayment||total))<=0?'Pagado':'Abonado',registeredDate:today(),delayed:sale.date!==today(),omitCommission:false,exchangeRate:rate,exchangeRateDate:store.settings?.exchangeRateDate || '',warranty:sale.warranty,sellerName,sellerEmail,cancelled:false};
    setStore(prev=>({...prev,sales:[...(prev.sales||[]),newSale],products:(prev.products||[]).map(p=>p.id===product.id?{...p,stock:p.stock-Number(sale.qty)}:p)}));
    alert('Venta registrada. Ahora presiona Guardar cambios para respaldar la venta en la nube.');
  };
  const recent = (store.sales||[]).filter(s=>!s.cancelled).slice(-5).reverse();
  return <div className="stack">
    <Guide title="Modo empleado - Registrar venta" items={["Selecciona categoría y producto vendido.","Registra cliente, cantidad y método de pago.","El sistema guardará la venta automáticamente.","Verifica cliente, cantidad y método de pago antes de registrar."]}/>
    <Card title="Registrar venta" wide><div className="sellerBanner">Venta registrada por: <b>{sellerName}</b></div><div className="formGrid"><Input v={sale.date} p="Fecha" type="date" on={v=>setSale({...sale,date:v})}/><Input v={sale.customerName} p="Nombre y apellido del cliente" on={v=>setSale({...sale,customerName:v})}/><Select p="Categoría" v={sale.category} on={v=>{const filtered=(store.products||[]).filter(p=>p.category===v);setSale({...sale,category:v,productId:filtered[0]?.id||''})}} opts={saleCategoryOptions.map(x=>[x,x])}/><Select p="Codigo de lente" v={sale.productId} on={v=>setSale({...sale,productId:v})} opts={(categoryProducts.length?categoryProducts:(store.products||[])).map(p=>[p.id,`${p.code} - ${p.description} (${p.stock})`])}/><div className="totalBox">Descripcion:<b>{product?.description||'-'}</b></div><Input v={sale.qty} p="Cantidad" type="number" on={v=>setSale({...sale,qty:v})}/><Select p="Método de pago" v={sale.payment} on={v=>setSale({...sale,payment:v})} opts={paymentOptions.map(x=>[x,x])}/><Input v={sale.initialPayment} p="Abono inicial" type="number" on={v=>setSale({...sale,initialPayment:v})}/><div className="totalBox">Total USD:<b>{money(total)}</b></div><div className="totalBox">Total Bs:<b>{rate?bs(totalBs):'Configurar tasa'}</b></div><Select p="Garantía" v={sale.warranty} on={v=>setSale({...sale,warranty:v})} opts={[["No","Sin garantia"],["Si","Con garantia"]]}/><button onClick={complete}><Save size={16}/>Registrar venta</button></div></Card>
    <Card title="Últimas ventas activas" wide><Table rows={recent} columns={[["date","Fecha"],["customerName","Cliente"],["productCodeName","Producto"],["qty","Cantidad"],["total","Total USD",money],["payment","Pago"],["sellerName","Vendedor",(v)=>v||'-']]}/></Card>
  </div>;
}

function EmployeeTracking({orders,labs,setStore,canEdit}){
  const [filters,setFilters]=useState({q:'',lab:'Todos',status:'Todos'});
  const rows = orders.filter(o => (filters.lab==='Todos'||o.lab===filters.lab) && (filters.status==='Todos'||o.status===filters.status) && containsText(o, filters.q));
  const update=(id,patch)=>setStore(prev=>({...prev,orders:(prev.orders||[]).map(o=>o.id===id?{...o,...patch}:o)}),'Estatus actualizado');
  return <div className="stack">
    <Guide title="Seguimiento de trabajos" items={["Busca por nombre, teléfono o código de orden.","Usa filtros de laboratorio y estatus para ubicar trabajos.","Actualiza estatus o notificación cuando corresponda."]}/>
    <Card title="Buscar trabajo de paciente" wide><div className="formGrid"><Input v={filters.q} p="Buscar cliente, teléfono u orden" on={v=>setFilters({...filters,q:v})}/><Select p="Laboratorio" v={filters.lab} on={v=>setFilters({...filters,lab:v})} opts={['Todos',...(labs||[]).map(l=>l.name)].map(x=>[x,x])}/><Select p="Estatus" v={filters.status} on={v=>setFilters({...filters,status:v})} opts={['Todos','En la tienda','Enviado','Proceso','Entregado'].map(x=>[x,x])}/><div className="totalBox">Resultados:<b>{rows.length}</b></div></div></Card>
    <Card title="Trabajos encontrados" wide><Table rows={rows} columns={[["number","Orden"],["customer","Cliente"],["phone","Teléfono"],["lab","Laboratorio"],["status","Estatus",(v,r)=>canEdit?<select value={v} onChange={e=>update(r.id,{status:e.target.value})}>{['En la tienda','Enviado','Proceso','Entregado'].map(x=><option key={x}>{x}</option>)}</select>:v],["sentDate","Enviado"],["deliveredDate","Entregado"],["notifiedClient","Notificado",(v,r)=>canEdit?<select value={v||'No'} onChange={e=>update(r.id,{notifiedClient:e.target.value})}>{['No','Si'].map(x=><option key={x}>{x}</option>)}</select>:(v||'No')],["notes","Observaciones"]]}/></Card>
  </div>;
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

function Inventory({products,setList,query,setQuery}){
  const blank={code:'',date:today(),category:'Montura',description:'',qty:'',cost:'',price:'',paymentMethod:'Efectivo',stock:'',minStock:'5'};
  const [form,setForm]=useState(blank); const [editing,setEditing]=useState(null);
  const filtered=products.filter(p=>`${p.code} ${p.category} ${p.description}`.toLowerCase().includes(query.toLowerCase()));
  const reset=()=>{setForm(blank);setEditing(null)};
  const save=()=>{if(!form.code||!form.description)return alert('Codigo y descripcion son obligatorios'); const qty=Number(form.qty||form.stock||0); const item={...form, qty, cost:+form.cost, price:+form.price, stock:+(form.stock||qty), minStock:+form.minStock}; if(editing){setList('products',list=>list.map(p=>p.id===editing?{...item,id:editing}:p));}else{setList('products',list=>[...list,{...item,id:uid()}]);} reset();};
  const edit=(p)=>{setEditing(p.id); setForm({...p}); window.scrollTo({top:0,behavior:'smooth'});};
  const remove=(id)=>{if(confirm('Eliminar este producto?')) setList('products',list=>list.filter(p=>p.id!==id));};
  const adjust=(id)=>{const val=prompt('Nuevo stock'); if(val===null)return; setList('products',list=>list.map(p=>p.id===id?{...p,stock:Number(val)}:p));};
  return <div className="stack"><Guide title="Guía rápida Inventario" items={["Use Código para identificar el producto dentro de la tienda.","Categoría define si es Montura, Cristal, Accesorio o Servicio.","Costo es lo que paga la tienda; Precio es lo que paga el cliente.","Stock mínimo sirve para alertas de reposición."]}/><Card title={editing?'Editar producto':'Inventario / nuevo producto'} wide action={editing&&<button className="secondary" onClick={reset}>Cancelar edicion</button>}><div className="formGrid"><Input v={form.code} p="Codigo" on={v=>setForm({...form,code:v})}/><Input v={form.date} p="Fecha" type="date" on={v=>setForm({...form,date:v})}/><Select p="Categoría" v={form.category} on={v=>setForm({...form,category:v})} opts={['Montura','Cristal','Accesorio','Servicio','Otros'].map(x=>[x,x])}/><Input v={form.description} p="Descripcion" on={v=>setForm({...form,description:v})}/><Input v={form.qty} p="Cantidad" type="number" on={v=>setForm({...form,qty:v,stock:v})}/><Input v={form.cost} p="Costo" type="number" on={v=>setForm({...form,cost:v})}/><Input v={form.price} p="Precio" type="number" on={v=>setForm({...form,price:v})}/><Select p="Método de pago" v={form.paymentMethod} on={v=>setForm({...form,paymentMethod:v})} opts={paymentOptions.map(x=>[x,x])}/><Input v={form.stock} p="Stock" type="number" on={v=>setForm({...form,stock:v})}/><Input v={form.minStock} p="Stock minimo" type="number" on={v=>setForm({...form,minStock:v})}/><button onClick={save}><Save size={16}/>{editing?'Guardar cambios':'Agregar'}</button></div></Card><Card title="Productos" wide action={<div className="search"><Search size={16}/><input placeholder="Buscar codigo, categoria o producto" value={query} onChange={e=>setQuery(e.target.value)}/></div>}><Table rows={filtered} columns={[["code","Codigo"],["date","Fecha"],["category","Categoria"],["description","Descripcion"],["cost","Costo",money],["price","Precio",money],["stock","Stock"],["actions","Acciones",(_,r)=><div className="rowActions"><button className="mini secondary" onClick={()=>edit(r)}><Pencil size={13}/>Editar</button><button className="mini warn" onClick={()=>adjust(r.id)}>Ajustar stock</button><button className="mini danger" onClick={()=>remove(r.id)}><Trash2 size={13}/>Eliminar</button></div>]]}/></Card></div>;
}

function Sales({store,setStore,currentUser}){
  const firstProduct=store.products[0];
  const [sale,setSale]=useState({date:today(),customerName:'',category:'Montura',productId:firstProduct?.id||'',qty:1,payment:'Efectivo',initialPayment:'',warranty:'No'});
  const [filters,setFilters]=useState({q:'',from:'',to:'',payment:'Todos',status:'Todos'});
  const categoryProducts = (store.products||[]).filter(p => !sale.category || p.category === sale.category);
  const product=(store.products||[]).find(p=>p.id===sale.productId) || categoryProducts[0];
  const total=product?product.price*Number(sale.qty||0):0;
  const rate = Number(store.settings?.exchangeRate || 0);
  const totalBs = rate ? total * rate : 0;
  const sellerName = getStaffName(currentUser);
  const sellerEmail = currentUser || '';
  const filteredSales = (store.sales||[]).filter(s =>
    inDateRange(s.date, filters.from, filters.to) &&
    (filters.payment==='Todos' || s.payment===filters.payment) &&
    (filters.status==='Todos' || (filters.status==='Activas' ? !s.cancelled : s.cancelled)) &&
    containsText(s, filters.q)
  );
  const filteredTotal = filteredSales.filter(s=>!s.cancelled).reduce((a,s)=>a+Number(s.total||0),0);
  const filteredTotalBs = filteredSales.filter(s=>!s.cancelled).reduce((a,s)=>a+Number(s.totalBs || (rate ? Number(s.total||0)*rate : 0)),0);
  const complete=()=>{
    if(!sale.customerName)return alert('Nombre del cliente obligatorio');
    if(!product)return alert('Selecciona un producto');
    if(Number(sale.qty)<=0)return alert('Cantidad invalida');
    if(product.stock<Number(sale.qty))return alert('No hay stock suficiente');
    const newSale={id:uid(),date:sale.date,customerName:sale.customerName,productId:product.id,productCodeName:`${product.code} - ${product.description}`,category:sale.category || product.category,description:product.description,qty:Number(sale.qty),payment:sale.payment,total,totalBs,paidAmount:Number(sale.initialPayment||total),balance:Math.max(0,total-Number(sale.initialPayment||total)),paymentStatus:Math.max(0,total-Number(sale.initialPayment||total))<=0?'Pagado':'Abonado',registeredDate:today(),delayed:sale.date!==today(),omitCommission:false,exchangeRate:rate,exchangeRateDate:store.settings?.exchangeRateDate || '',warranty:sale.warranty,sellerName,sellerEmail,cancelled:false};
    setStore(prev=>({...prev,sales:[...(prev.sales||[]),newSale],products:(prev.products||[]).map(p=>p.id===product.id?{...p,stock:p.stock-Number(sale.qty)}:p)}));
    alert('Venta guardada y stock descontado');
  };
  const cancelSale=(s)=>{if(s.cancelled)return; if(!confirm('Anular venta y devolver stock?'))return; setStore(prev=>({...prev,sales:(prev.sales||[]).map(x=>x.id===s.id?{...x,cancelled:true}:x),products:(prev.products||[]).map(p=>p.id===s.productId?{...p,stock:Number(p.stock)+Number(s.qty)}:p)}));};
  return <div className="stack">
    <Guide title="Guía rápida Ventas" items={["Primero selecciona la categoría para filtrar la lista de productos.","Luego selecciona el producto vendido. Esto descuenta stock automáticamente.","El método de pago alimenta Caja diaria: ahora incluye Zelle y Binance.","Si se equivoca, anule la venta para devolver stock."]}/>
    <Card title="Ventas (producto vendido)" wide><div className="sellerBanner">Usuario actual: <b>{sellerName}</b></div><div className="formGrid"><Input v={sale.date} p="Fecha" type="date" on={v=>setSale({...sale,date:v})}/><Input v={sale.customerName} p="Nombre y apellido del cliente" on={v=>setSale({...sale,customerName:v})}/><Select p="Categoría" v={sale.category} on={v=>{const filtered=(store.products||[]).filter(p=>p.category===v);setSale({...sale,category:v,productId:filtered[0]?.id||''})}} opts={saleCategoryOptions.map(x=>[x,x])}/><Select p="Codigo de lente" v={sale.productId} on={v=>setSale({...sale,productId:v})} opts={(categoryProducts.length?categoryProducts:(store.products||[])).map(p=>[p.id,`${p.code} - ${p.description} (${p.stock})`])}/><div className="totalBox">Categoria:<b>{sale.category || product?.category || '-'}</b></div><div className="totalBox">Descripcion:<b>{product?.description||'-'}</b></div><Input v={sale.qty} p="Cantidad" type="number" on={v=>setSale({...sale,qty:v})}/><Select p="Método de pago" v={sale.payment} on={v=>setSale({...sale,payment:v})} opts={paymentOptions.map(x=>[x,x])}/><Input v={sale.initialPayment} p="Abono inicial" type="number" on={v=>setSale({...sale,initialPayment:v})}/><div className="totalBox">Total USD:<b>{money(total)}</b></div><div className="totalBox">Total Bs:<b>{rate?bs(totalBs):'Configurar tasa'}</b></div><Select p="Garantía" v={sale.warranty} on={v=>setSale({...sale,warranty:v})} opts={[["No","Sin garantia"],["Si","Con garantia"]]}/><button onClick={complete}><Save size={16}/>Registrar venta</button></div></Card>
    <Card title="Filtros de ventas" wide><div className="formGrid"><Input v={filters.q} p="Buscar cliente, producto o codigo" on={v=>setFilters({...filters,q:v})}/><Input v={filters.from} p="Desde" type="date" on={v=>setFilters({...filters,from:v})}/><Input v={filters.to} p="Hasta" type="date" on={v=>setFilters({...filters,to:v})}/><Select p="Filtrar método de pago" v={filters.payment} on={v=>setFilters({...filters,payment:v})} opts={['Todos',...paymentOptions].map(x=>[x,x])}/><Select p="Filtrar estatus" v={filters.status} on={v=>setFilters({...filters,status:v})} opts={['Todos','Activas','Anuladas'].map(x=>[x,x])}/><div className="totalBox">Registros:<b>{filteredSales.length}</b></div><div className="totalBox">Total USD:<b>{money(filteredTotal)}</b></div><div className="totalBox">Total Bs:<b>{bs(filteredTotalBs)}</b></div><button className="secondary" onClick={()=>downloadCSV('ventas-filtradas', filteredSales)}>Exportar filtrado</button></div></Card>
    <Card title="Historial de ventas" wide><Table rows={filteredSales.slice().reverse()} columns={[["date","Fecha"],["customerName","Cliente"],["productCodeName","Producto"],["category","Categoría"],["qty","Cantidad"],["total","Total USD",money],["totalBs","Total Bs.",bs],["exchangeRate","Tasa",bs],["payment","Pago"],["sellerName","Vendedor",(v)=>v||'-'],["cancelled","Estado",v=>v?'Anulada':'Activa'],["actions","Acciones",(_,r)=><button disabled={r.cancelled} className="mini danger" onClick={()=>cancelSale(r)}><RotateCcw size={13}/>Anular</button>]]}/></Card>
  </div>;
}

function Orders({orders,labs,setList}){
  const blank={number:`GC-${String(orders.length+1).padStart(4,'0')}`,date:today(),responsible:'',customer:'',idCard:'',age:'',phone:'',lab:labs[0]?.name||'Novak',lens:'',treatment:'',prescription:'',odEsf:'',odCil:'',odEje:'',odAdd:'',oiEsf:'',oiCil:'',oiEje:'',oiAdd:'',dp:'',height:'',frame:'',total:'',paymentMethod:'Efectivo',deposit:'',depositReference:'',balance:0,balanceReference:'',status:'En la tienda',labPayment:'No pago',sentDate:'',deliveredDate:'',notifiedClient:'No',opticalAmount:'',deliveryDate:today(),warranty:'No',notes:''};
  const [form,setForm]=useState(blank); const [editing,setEditing]=useState(null);
  const [filters,setFilters]=useState({q:'',from:'',to:'',lab:'Todos',status:'Todos',labPayment:'Todos',notified:'Todos'});
  useEffect(()=>{setForm(f=>({...f,balance:Number(f.total||0)-Number(f.deposit||0)}));},[form.total,form.deposit]);
  const filteredOrders = orders.filter(o =>
    inDateRange(o.date, filters.from, filters.to) &&
    (filters.lab==='Todos' || o.lab===filters.lab) &&
    (filters.status==='Todos' || o.status===filters.status) &&
    (filters.labPayment==='Todos' || o.labPayment===filters.labPayment) &&
    (filters.notified==='Todos' || o.notifiedClient===filters.notified) &&
    containsText(o, filters.q)
  );
  const pendingBalance = filteredOrders.reduce((a,o)=>a+Number(o.balance||0),0);
  const labDebt = filteredOrders.filter(o=>o.labPayment!=='Pago').reduce((a,o)=>a+Number(o.opticalAmount||0),0);
  const reset=()=>{setForm(blank);setEditing(null)};
  const save=()=>{if(!form.customer)return alert('Cliente obligatorio'); if(!form.phone)return alert('Telefono obligatorio'); const structuredPrescription=`OD: Esf ${form.odEsf||'-'} | Cil ${form.odCil||'-'} | Eje ${form.odEje||'-'} | Add ${form.odAdd||'-'} / OI: Esf ${form.oiEsf||'-'} | Cil ${form.oiCil||'-'} | Eje ${form.oiEje||'-'} | Add ${form.oiAdd||'-'} / DP: ${form.dp||'-'} / Altura: ${form.height||'-'}`; const order={...form,prescription:structuredPrescription,total:+(form.total||0),deposit:+(form.deposit||0),balance:+(form.balance||0),opticalAmount:+(form.opticalAmount||0)}; if(editing){setList('orders',list=>list.map(o=>o.id===editing?{...order,id:editing}:o));}else{setList('orders',list=>[...list,{...order,id:uid()}]);} reset();};
  const edit=o=>{setEditing(o.id);setForm({...o});window.scrollTo({top:0,behavior:'smooth'});};
  const remove=id=>{if(confirm('Eliminar esta orden?')) setList('orders',list=>list.filter(o=>o.id!==id));};
  const quickStatus=(id,status)=>setList('orders',list=>list.map(o=>o.id===id?{...o,status}:o));
  return <div className="stack"><Guide title="Guía rápida Órdenes / Fórmulas" items={["Seleccione laboratorio para que luego aparezca filtrado en Laboratorios.","Estatus indica dónde está el trabajo: tienda, enviado, proceso o entregado.","La fórmula se llena por cuadritos: OD/OI, Esf, Cil, Eje, Add, DP y Altura.","Cliente notificado ayuda a saber si ya se avisó por entrega o seguimiento."]}/><Card title={editing?'Editar trabajo de formula':'Trabajos de formula / ordenes'} wide action={editing&&<button className="secondary" onClick={reset}>Cancelar edicion</button>}><div className="formGrid"><Input v={form.number} p="Codigo de orden" on={v=>setForm({...form,number:v})}/><Input v={form.date} p="Fecha" type="date" on={v=>setForm({...form,date:v})}/><Input v={form.customer} p="Nombre y apellido (cliente)" on={v=>setForm({...form,customer:v})}/><Input v={form.idCard} p="Cedula" on={v=>setForm({...form,idCard:v})}/><Input v={form.age} p="Edad" type="number" on={v=>setForm({...form,age:v})}/><Input v={form.phone} p="Telefono" on={v=>setForm({...form,phone:v})}/><Select p="Laboratorio" v={form.lab} on={v=>setForm({...form,lab:v})} opts={(labs||[]).map(l=>[l.name,l.name])}/><Input v={form.lens} p="Cristal" on={v=>setForm({...form,lens:v})}/><Input v={form.treatment} p="Tratamiento" on={v=>setForm({...form,treatment:v})}/><div className="rxBox"><div className="rxTitle">Prescripción óptica</div><div className="rxGrid rxHeader"><span></span><span>Esf</span><span>Cil</span><span>Eje</span><span>Add</span></div><div className="rxGrid"><b>OD</b><Input v={form.odEsf} p="OD Esf" on={v=>setForm({...form,odEsf:v})}/><Input v={form.odCil} p="OD Cil" on={v=>setForm({...form,odCil:v})}/><Input v={form.odEje} p="OD Eje" on={v=>setForm({...form,odEje:v})}/><Input v={form.odAdd} p="OD Add" on={v=>setForm({...form,odAdd:v})}/></div><div className="rxGrid"><b>OI</b><Input v={form.oiEsf} p="OI Esf" on={v=>setForm({...form,oiEsf:v})}/><Input v={form.oiCil} p="OI Cil" on={v=>setForm({...form,oiCil:v})}/><Input v={form.oiEje} p="OI Eje" on={v=>setForm({...form,oiEje:v})}/><Input v={form.oiAdd} p="OI Add" on={v=>setForm({...form,oiAdd:v})}/></div><div className="rxGrid rxTwo"><Input v={form.dp} p="DP" on={v=>setForm({...form,dp:v})}/><Input v={form.height} p="Altura" on={v=>setForm({...form,height:v})}/></div></div><Input v={form.frame} p="Montura" on={v=>setForm({...form,frame:v})}/><Input v={form.total} p="Monto total" type="number" on={v=>setForm({...form,total:v})}/><Select p="Método de pago" v={form.paymentMethod} on={v=>setForm({...form,paymentMethod:v})} opts={paymentOptions.map(x=>[x,x])}/><Input v={form.deposit} p="Abono (monto)" type="number" on={v=>setForm({...form,deposit:v})}/><Input v={form.depositReference} p="Abono referencia" on={v=>setForm({...form,depositReference:v})}/><div className="totalBox">Resta:<b>{money(form.balance)}</b></div><Input v={form.balanceReference} p="Resta referencia" on={v=>setForm({...form,balanceReference:v})}/><Select p="Estatus de orden" v={form.status} on={v=>setForm({...form,status:v})} opts={['En la tienda','Enviado','Proceso','Entregado'].map(x=>[x,x])}/><Select p="Pago laboratorio" v={form.labPayment} on={v=>setForm({...form,labPayment:v})} opts={['No pago','Pago'].map(x=>[x,x])}/><Input v={form.sentDate} p="Fecha de enviado" type="date" on={v=>setForm({...form,sentDate:v})}/><Input v={form.deliveredDate} p="Fecha de entregado" type="date" on={v=>setForm({...form,deliveredDate:v})}/><Input v={form.opticalAmount} p="Monto laboratorio" type="number" on={v=>setForm({...form,opticalAmount:v})}/><Select p="Cliente notificado" v={form.notifiedClient} on={v=>setForm({...form,notifiedClient:v})} opts={[["No","No se notifico"],["Si","Si se notifico"]]}/><Select p="Garantía" v={form.warranty} on={v=>setForm({...form,warranty:v})} opts={[["No","Sin garantia"],["Si","Con garantia"]]}/><Input v={form.notes} p="Observaciones" on={v=>setForm({...form,notes:v})}/><button onClick={save}><Save size={16}/>{editing?'Guardar cambios':'Guardar orden'}</button></div></Card>
  <Card title="Filtros de ordenes" wide><div className="formGrid"><Input v={filters.q} p="Buscar cliente, telefono, formula, orden" on={v=>setFilters({...filters,q:v})}/><Input v={filters.from} p="Desde" type="date" on={v=>setFilters({...filters,from:v})}/><Input v={filters.to} p="Hasta" type="date" on={v=>setFilters({...filters,to:v})}/><Select p="Filtrar laboratorio" v={filters.lab} on={v=>setFilters({...filters,lab:v})} opts={['Todos',...(labs||[]).map(l=>l.name)].map(x=>[x,x])}/><Select p="Filtrar estatus" v={filters.status} on={v=>setFilters({...filters,status:v})} opts={['Todos','En la tienda','Enviado','Proceso','Entregado'].map(x=>[x,x])}/><Select p="Filtrar pago laboratorio" v={filters.labPayment} on={v=>setFilters({...filters,labPayment:v})} opts={['Todos','No pago','Pago'].map(x=>[x,x])}/><Select p="Filtrar notificación" v={filters.notified} on={v=>setFilters({...filters,notified:v})} opts={['Todos','No','Si'].map(x=>[x,x])}/><div className="totalBox">Ordenes:<b>{filteredOrders.length}</b></div><div className="totalBox">Resta total:<b>{money(pendingBalance)}</b></div><div className="totalBox">Deuda lab:<b>{money(labDebt)}</b></div><button className="secondary" onClick={()=>downloadCSV('ordenes-filtradas', filteredOrders)}>Exportar filtrado</button></div></Card>
  <Card title="Ordenes registradas" wide><div className="orderList">{filteredOrders.map(o=><div className="order" key={o.id}><div><b>{o.number}</b><span>{o.customer} | Tel: {o.phone} | Lab: {o.lab} | Resta {money(o.balance)}</span><span>Cristal: {o.lens||'N/A'} | Tratamiento: {o.treatment||'N/A'} | Garantia: {o.warranty}</span><span>Enviado: {o.sentDate||'-'} | Entregado: {o.deliveredDate||'-'} | Notificado: {o.notifiedClient}</span></div><div className="rowActions"><select value={o.status} onChange={e=>quickStatus(o.id,e.target.value)}>{['En la tienda','Enviado','Proceso','Entregado'].map(s=><option key={s}>{s}</option>)}</select><button className="mini secondary" onClick={()=>edit(o)}><Pencil size={13}/>Editar</button><button className="mini danger" onClick={()=>remove(o.id)}><Trash2 size={13}/>Eliminar</button></div></div>)}</div></Card></div>;
}

function Laboratories({labs,orders,setList}){const [selected,setSelected]=useState(labs[0]?.name||'Novak');const [form,setForm]=useState({name:'',phone:'',notes:''});const filtered=orders.filter(o=>o.lab===selected);const addLab=()=>{if(!form.name)return alert('Nombre obligatorio');setList('laboratories',list=>[...list,{...form,id:uid()}]);setSelected(form.name);setForm({name:'',phone:'',notes:''});};const removeLab=id=>{if(confirm('Eliminar laboratorio? Las ordenes no se eliminan.'))setList('laboratories',list=>list.filter(l=>l.id!==id));};return <div className="stack"><Card title="Laboratorios" wide><div className="tabs">{(labs||[]).map(l=><button key={l.id} onClick={()=>setSelected(l.name)} className={selected===l.name?'active':''}>{l.name}</button>)}</div><div className="formGrid"><Input v={form.name} p="Nuevo laboratorio" on={v=>setForm({...form,name:v})}/><Input v={form.phone} p="Telefono/contacto" on={v=>setForm({...form,phone:v})}/><Input v={form.notes} p="Observaciones" on={v=>setForm({...form,notes:v})}/><button onClick={addLab}>Agregar laboratorio</button></div></Card><div className="grid"><KPI label={`Ordenes en ${selected}`} value={filtered.length}/><KPI label="Pendientes" value={filtered.filter(o=>o.status!=='Entregado').length}/><KPI label="Pagadas" value={filtered.filter(o=>o.labPayment==='Pago').length}/><KPI label="Monto lab." value={money(filtered.reduce((a,o)=>a+Number(o.opticalAmount||0),0))}/></div><Card title={`Ordenes de ${selected}`} wide><Table rows={filtered} columns={[["number","Orden"],["customer","Cliente"],["status","Estatus"],["labPayment","Pago"],["sentDate","Enviado"],["deliveredDate","Entregado"],["opticalAmount","Monto",money],["notifiedClient","Notificado"],["notes","Observaciones"]]}/></Card><Card title="Administrar laboratorios" wide><Table rows={labs} columns={[["name","Laboratorio"],["phone","Contacto"],["notes","Notas"],["actions","Acciones",(_,r)=><button className="mini danger" onClick={()=>removeLab(r.id)}>Eliminar</button>]]}/></Card></div>}
function Customers({customers,setList}){const blank={name:'',phone:'',notes:''};const [form,setForm]=useState(blank);const [editing,setEditing]=useState(null);const save=()=>{if(!form.name)return alert('Nombre obligatorio');if(editing)setList('customers',list=>list.map(c=>c.id===editing?{...form,id:editing}:c));else setList('customers',list=>[...list,{...form,id:uid()}]);setForm(blank);setEditing(null);};const edit=c=>{setEditing(c.id);setForm({...c});};const remove=id=>{if(confirm('Eliminar cliente?'))setList('customers',list=>list.filter(c=>c.id!==id));};return <div className="stack"><Card title={editing?'Editar cliente':'Nuevo cliente'}><div className="formGrid"><Input v={form.name} p="Nombre" on={v=>setForm({...form,name:v})}/><Input v={form.phone} p="Telefono" on={v=>setForm({...form,phone:v})}/><Input v={form.notes} p="Observaciones" on={v=>setForm({...form,notes:v})}/><button onClick={save}>{editing?'Guardar':'Agregar cliente'}</button></div></Card><Card title="Clientes" wide><Table rows={customers} columns={[["name","Nombre"],["phone","Telefono"],["notes","Notas"],["actions","Acciones",(_,r)=><div className="rowActions"><button className="mini secondary" onClick={()=>edit(r)}>Editar</button><button className="mini danger" onClick={()=>remove(r.id)}>Eliminar</button></div>]]}/></Card></div>}
function Expenses({expenses,setList}){const [form,setForm]=useState({date:today(),category:'Operativo',description:'',amount:''});const [editing,setEditing]=useState(null);const [filters,setFilters]=useState({q:'',from:'',to:'',category:''});const filteredExpenses=expenses.filter(e=>inDateRange(e.date,filters.from,filters.to)&&(!filters.category||e.category.toLowerCase().includes(filters.category.toLowerCase()))&&containsText(e,filters.q));const filteredTotal=filteredExpenses.reduce((a,e)=>a+Number(e.amount||0),0);const save=()=>{if(!form.description)return alert('Descripcion obligatoria');if(editing)setList('expenses',l=>l.map(e=>e.id===editing?{...form,id:editing,amount:+form.amount}:e));else setList('expenses',l=>[...l,{...form,id:uid(),amount:+form.amount}]);setForm({date:today(),category:'Operativo',description:'',amount:''});setEditing(null);};const remove=id=>{if(confirm('Eliminar gasto?'))setList('expenses',l=>l.filter(e=>e.id!==id));};return <div className="stack"><Card title={editing?'Editar gasto':'Registrar gasto'}><div className="formGrid"><Input v={form.date} p="Fecha" type="date" on={v=>setForm({...form,date:v})}/><Input v={form.category} p="Categoria" on={v=>setForm({...form,category:v})}/><Input v={form.description} p="Descripcion" on={v=>setForm({...form,description:v})}/><Input v={form.amount} p="Monto" type="number" on={v=>setForm({...form,amount:v})}/><button onClick={save}>Guardar gasto</button></div></Card><Card title="Filtros de gastos" wide><div className="formGrid"><Input v={filters.q} p="Buscar gasto" on={v=>setFilters({...filters,q:v})}/><Input v={filters.from} p="Desde" type="date" on={v=>setFilters({...filters,from:v})}/><Input v={filters.to} p="Hasta" type="date" on={v=>setFilters({...filters,to:v})}/><Input v={filters.category} p="Categoria" on={v=>setFilters({...filters,category:v})}/><div className="totalBox">Registros:<b>{filteredExpenses.length}</b></div><div className="totalBox">Total:<b>{money(filteredTotal)}</b></div><button className="secondary" onClick={()=>downloadCSV('gastos-filtrados',filteredExpenses)}>Exportar filtrado</button></div></Card><Card title="Gastos" wide><Table rows={filteredExpenses} columns={[["date","Fecha"],["category","Categoria"],["description","Descripcion"],["amount","Monto",money],["actions","Acciones",(_,r)=><div className="rowActions"><button className="mini secondary" onClick={()=>{setEditing(r.id);setForm({...r})}}>Editar</button><button className="mini danger" onClick={()=>remove(r.id)}>Eliminar</button></div>]]}/></Card></div>}

function Cash({store,setStore,stats}){
  const cash = store.cash || {};
  const setCash = (field, value) => setStore(prev=>({...prev, cash:{...prev.cash, [field]: value}}));
  const numeric = (field) => (v) => setCash(field, Number(v || 0));
  const saveToday = () => alert('Caja actualizada. En esta version los datos quedan guardados en este navegador.');
  return <div className="stack">
    <div className="grid">
      <KPI label="Ventas del dia" value={money(stats.salesToday)} hint="Ventas activas registradas"/>
      <KPI label="Gastos del dia" value={money(stats.expensesToday)} hint="Modulo gastos"/>
      <KPI label="Cierre esperado" value={money(stats.cashBalance)} hint="Caja inicial + ingresos - egresos"/>
      <KPI label="Diferencia cierre" value={money(stats.closingDiff)} hint="Cierre contado vs esperado"/>
    </div>
    <Card title="Caja diaria / cierre" wide>
      <div className="formGrid">
        <Input v={cash.opening} p="Caja anterior / inicial" type="number" on={numeric('opening')}/>
        <div className="totalBox">Ventas efectivo:<b>{money(stats.salesByMethod?.efectivo || 0)}</b></div>
        <div className="totalBox">Ventas pago movil:<b>{money(stats.salesByMethod?.pagoMovil || 0)}</b></div>
        <div className="totalBox">Ventas divisas:<b>{money(stats.salesByMethod?.divisas || 0)}</b></div>
        <div className="totalBox">Ventas transferencia:<b>{money(stats.salesByMethod?.transferencia || 0)}</b></div>
        <Input v={cash.usdReceived} p="USD adicional recibido" type="number" on={numeric('usdReceived')}/>
        <Input v={cash.pagoMovilReceived} p="Pago movil adicional" type="number" on={numeric('pagoMovilReceived')}/>
        <Input v={cash.transferReceived} p="Transferencia adicional" type="number" on={numeric('transferReceived')}/>
        <Input v={cash.divisasReceived} p="Divisas adicional" type="number" on={numeric('divisasReceived')}/>
        <div className="totalBox">Gastos registrados:<b>{money(stats.expensesToday)}</b></div>
        <Input v={cash.purchases} p="Compras / mercancia" type="number" on={numeric('purchases')}/>
        <Input v={cash.otherExpenses} p="Otros egresos" type="number" on={numeric('otherExpenses')}/>
        <div className="totalBox strong">Cierre esperado total:<b>{money(stats.cashBalance)}</b></div>
        <div className="totalBox">Cierre efectivo esperado:<b>{money(stats.expectedCashClose)}</b></div>
        <div className="totalBox">Cierre pago movil esperado:<b>{money(stats.expectedPagoMovilClose)}</b></div>
        <div className="totalBox">Cierre transferencia esperado:<b>{money(stats.expectedTransferClose)}</b></div>
        <Input v={cash.closingCash} p="Cierre contado efectivo" type="number" on={numeric('closingCash')}/>
        <Input v={cash.closingPagoMovil} p="Cierre contado pago movil" type="number" on={numeric('closingPagoMovil')}/>
        <Input v={cash.notes} p="Observaciones de caja" on={v=>setCash('notes', v)}/>
        <button onClick={saveToday}><Save size={16}/>Guardar caja</button>
      </div>
    </Card>
    <Card title="Resumen por metodo de pago" wide>
      <Table rows={[
        {method:'Efectivo', amount:stats.salesByMethod?.efectivo || 0},
        {method:'Pago movil', amount:stats.salesByMethod?.pagoMovil || 0},
        {method:'Divisas', amount:stats.salesByMethod?.divisas || 0},
        {method:'Transferencia', amount:stats.salesByMethod?.transferencia || 0},
        {method:'Mixto', amount:stats.salesByMethod?.mixto || 0}
      ]} columns={[["method","Metodo"],["amount","Monto",money]]}/>
    </Card>
  </div>
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
      <div className="statusBox"><b>{settings.versionTitle || 'Produccion 2.0.2'}</b><span>{settings.versionDescription || 'Hotfix login y estabilidad.'}</span></div>
    </Card>
  </div>
}

function Reports({store,stats}){
  const [filters,setFilters]=useState({from:'',to:'',q:''});
  const rate = Number(store.settings?.exchangeRate || 0);
  const filteredSales = (store.sales||[]).filter(s=>inDateRange(s.date,filters.from,filters.to)&&containsText(s,filters.q));
  const filteredOrders = (store.orders||[]).filter(o=>inDateRange(o.date,filters.from,filters.to)&&containsText(o,filters.q));
  const filteredExpenses = store.expenses.filter(e=>inDateRange(e.date,filters.from,filters.to)&&containsText(e,filters.q));
  const inventoryCost=(store.products||[]).reduce((a,p)=>a+Number(p.stock||0)*Number(p.cost||0),0);
  const inventorySale=(store.products||[]).reduce((a,p)=>a+Number(p.stock||0)*Number(p.price||0),0);
  const totalSales=filteredSales.filter(s=>!s.cancelled).reduce((a,s)=>a+Number(s.total||0),0);
  const totalExpenses=filteredExpenses.reduce((a,e)=>a+Number(e.amount||0),0);
  const totalOrdersBalance=filteredOrders.reduce((a,o)=>a+Number(o.balance||0),0);
  const exportProducts = () => downloadCSV('inventario', (store.products||[]));
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
