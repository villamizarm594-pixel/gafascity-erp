import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LayoutDashboard, Package, ShoppingCart, Users, ClipboardList, Wallet, Receipt, BarChart3, Plus, Search, Save, Microscope } from 'lucide-react';
import './styles.css';

const today = () => new Date().toISOString().slice(0, 10);
const money = (n) => `$${Number(n || 0).toFixed(2)}`;
const uid = () => Math.random().toString(36).slice(2, 9);

const defaultLabs = ['Novak', 'Opas (Vector)', 'Liberty', 'Prats', 'Jesus Tallador', 'Fer Visprolentes'];

const seed = {
  products: [
    { id: 'p1', code: 'OK1602', date: today(), category: 'Montura', description: 'Oakley Conductor', qty: 13, cost: 10, price: 25, paymentMethod: 'Efectivo', stock: 13, minStock: 5 },
    { id: 'p2', code: 'RB101', date: today(), category: 'Montura', description: 'Rayban', qty: 27, cost: 8, price: 15, paymentMethod: 'Pago movil', stock: 27, minStock: 5 },
    { id: 'p3', code: 'CRAR', date: today(), category: 'Cristal', description: 'Cristal antirreflejo', qty: 20, cost: 6, price: 20, paymentMethod: 'Divisas', stock: 20, minStock: 5 }
  ],
  customers: [
    { id: 'c1', name: 'Cliente prueba 1', phone: '0412-0000000', notes: 'Cliente frecuente' },
    { id: 'c2', name: 'Cliente prueba 2', phone: '0414-0000000', notes: 'Pendiente por retirar' }
  ],
  laboratories: defaultLabs.map((name, index) => ({ id: `lab${index + 1}`, name, phone: '', notes: '' })),
  sales: [
    { id: 's1', date: today(), customerName: 'Cliente prueba 1', productId: 'p1', productCodeName: 'OK1602 - Oakley Conductor', category: 'Montura', description: 'Oakley Conductor', qty: 1, payment: 'Efectivo', total: 25, warranty: 'No' }
  ],
  orders: [
    {
      id: 'o1', number: 'GC-0001', date: today(), responsible: 'Admin', customer: 'Cliente prueba 2', idCard: '', age: '', phone: '0414-0000000', lab: 'Novak', lens: 'Monofocal', treatment: 'Antirreflejo', prescription: 'OD -1.25 / OI -1.00', frame: '', total: 80, paymentMethod: 'Efectivo', deposit: 40, depositReference: '', balance: 40, balanceReference: '', reference: '', opticalDestination: 'Laboratorio principal', status: 'En proceso', labPayment: 'Pendiente', sentDate: today(), deliveredDate: '', notifiedClient: 'No', opticalAmount: 0, deliveryDate: today(), warranty: 'No', notes: ''
    }
  ],
  expenses: [
    { id: 'e1', date: today(), category: 'Operativo', description: 'Fundas', amount: 10 }
  ],
  cash: { opening: 100 }
};

function loadStore() {
  const raw = localStorage.getItem('gafascity-store-v2');
  if (!raw) return seed;
  const parsed = JSON.parse(raw);
  return {
    ...seed,
    ...parsed,
    laboratories: parsed.laboratories?.length ? parsed.laboratories : seed.laboratories,
    products: parsed.products || seed.products,
    customers: parsed.customers || seed.customers,
    sales: parsed.sales || seed.sales,
    orders: parsed.orders || seed.orders,
    expenses: parsed.expenses || seed.expenses,
    cash: parsed.cash || seed.cash
  };
}

function App() {
  const [active, setActive] = useState('dashboard');
  const [store, setStore] = useState(loadStore);
  const [query, setQuery] = useState('');

  useEffect(() => localStorage.setItem('gafascity-store-v2', JSON.stringify(store)), [store]);
  const setList = (key, updater) => setStore(prev => ({ ...prev, [key]: typeof updater === 'function' ? updater(prev[key]) : updater }));

  const stats = useMemo(() => {
    const salesToday = store.sales.filter(s => s.date === today()).reduce((a, s) => a + Number(s.total), 0);
    const expensesToday = store.expenses.filter(e => e.date === today()).reduce((a, e) => a + Number(e.amount), 0);
    const lowStock = store.products.filter(p => Number(p.stock) <= Number(p.minStock || 5));
    const pendingOrders = store.orders.filter(o => !['Entregado', 'Garantia'].includes(o.status));
    const cashBalance = Number(store.cash.opening) + salesToday - expensesToday;
    const pendingBalances = store.orders.reduce((a, o) => a + Number(o.balance || 0), 0);
    return { salesToday, expensesToday, lowStock, pendingOrders, cashBalance, pendingBalances };
  }, [store]);

  const nav = [
    ['dashboard', 'Inicio', LayoutDashboard],
    ['sales', 'Ventas', ShoppingCart],
    ['orders', 'Ordenes / formulas', ClipboardList],
    ['labs', 'Laboratorios', Microscope],
    ['inventory', 'Inventario', Package],
    ['customers', 'Clientes', Users],
    ['cash', 'Caja diaria', Wallet],
    ['expenses', 'Gastos', Receipt],
    ['reports', 'Reportes', BarChart3]
  ];

  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><span>GC</span><div><b>GafasCity ERP</b><small>Gestion optica interna</small></div></div>
      <nav>{nav.map(([id, label, Icon]) => <button key={id} onClick={() => setActive(id)} className={active === id ? 'active' : ''}><Icon size={18}/>{label}</button>)}</nav>
      <div className="statusBox"><b>Version operativa</b><span>Datos guardados en este navegador. Luego conectamos base de datos real.</span></div>
    </aside>
    <main>
      <header className="topbar">
        <div><h1>{nav.find(n => n[0] === active)?.[1]}</h1><p>Flujo basado en inventario, ventas, trabajos de formula y laboratorios.</p></div>
        <button className="ghost" onClick={() => { if(confirm('Esto reinicia los datos locales.')) { localStorage.removeItem('gafascity-store-v2'); location.reload(); }}}>Reiniciar datos</button>
      </header>
      {active === 'dashboard' && <Dashboard store={store} stats={stats}/>}      
      {active === 'inventory' && <Inventory products={store.products} setList={setList} query={query} setQuery={setQuery}/>}      
      {active === 'sales' && <Sales store={store} setStore={setStore}/>}      
      {active === 'customers' && <Customers customers={store.customers} setList={setList}/>}      
      {active === 'orders' && <Orders orders={store.orders} labs={store.laboratories} setList={setList}/>}      
      {active === 'labs' && <Laboratories labs={store.laboratories} orders={store.orders} setList={setList}/>}      
      {active === 'cash' && <Cash store={store} setStore={setStore} stats={stats}/>}      
      {active === 'expenses' && <Expenses expenses={store.expenses} setList={setList}/>}      
      {active === 'reports' && <Reports store={store} stats={stats}/>}      
    </main>
  </div>;
}

function KPI({label, value, hint}) { return <div className="kpi"><span>{label}</span><b>{value}</b>{hint && <small>{hint}</small>}</div>; }
function Card({title, children, action, wide}) { return <section className={wide ? 'card wide' : 'card'}><div className="cardHead"><h2>{title}</h2>{action}</div>{children}</section>; }
function Table({rows, columns, empty='Sin registros'}) { if(!rows.length) return <p className="muted">{empty}</p>; return <div className="tableWrap"><table><thead><tr>{columns.map(c => <th key={c[0]}>{c[1]}</th>)}</tr></thead><tbody>{rows.map((r, idx)=><tr key={r.id || idx}>{columns.map(([key,,fmt])=><td key={key}>{fmt ? fmt(r[key], r) : r[key]}</td>)}</tr>)}</tbody></table></div>; }
function Input({v,on,p,type='text'}) { return <input value={v ?? ''} type={type} placeholder={p} onChange={e=>on(e.target.value)}/>; }
function Select({v,on,opts}) { return <select value={v ?? ''} onChange={e=>on(e.target.value)}>{opts.map(([val,label])=><option key={val} value={val}>{label}</option>)}</select>; }

function Dashboard({store, stats}) {
  return <div className="grid">
    <KPI label="Ventas hoy" value={money(stats.salesToday)} hint="Ingresos del dia"/>
    <KPI label="Caja disponible" value={money(stats.cashBalance)} hint="Caja inicial + ventas - gastos"/>
    <KPI label="Ordenes pendientes" value={stats.pendingOrders.length} hint="Tienda, enviado o proceso"/>
    <KPI label="Stock bajo" value={stats.lowStock.length} hint="Productos a reponer"/>
    <Card title="Inventario bajo"><Table rows={stats.lowStock} columns={[['code','Codigo'], ['description','Producto'], ['stock','Stock'], ['minStock','Minimo']]}/></Card>
    <Card title="Ordenes recientes"><Table rows={store.orders.slice(-5).reverse()} columns={[['number','Orden'], ['customer','Cliente'], ['lab','Laboratorio'], ['balance','Resta', money], ['status','Estatus']]}/></Card>
    <Card title="Ventas recientes" wide><Table rows={store.sales.slice(-6).reverse()} columns={[['date','Fecha'], ['customerName','Cliente'], ['productCodeName','Producto'], ['qty','Cant.'], ['total','Total', money], ['payment','Pago'], ['warranty','Garantia']]}/></Card>
  </div>;
}

function Inventory({products, setList, query, setQuery}) {
  const blank = { code:'', date: today(), category:'Montura', description:'', qty:'', cost:'', price:'', paymentMethod:'Efectivo', stock:'', minStock:'5' };
  const [form, setForm] = useState(blank);
  const filtered = products.filter(p => `${p.code} ${p.category} ${p.description}`.toLowerCase().includes(query.toLowerCase()));
  const save = () => {
    if(!form.code || !form.description) return alert('Codigo y descripcion son obligatorios');
    const qty = Number(form.qty || form.stock || 0);
    setList('products', list => [...list, { ...form, id: uid(), qty, cost:+form.cost, price:+form.price, stock:+(form.stock || qty), minStock:+form.minStock }]);
    setForm(blank);
  };
  return <div className="stack">
    <Card title="Inventario / nuevo producto" wide><div className="formGrid">
      <Input v={form.code} p="Codigo" on={v=>setForm({...form, code:v})}/><Input v={form.date} p="Fecha" type="date" on={v=>setForm({...form, date:v})}/><Select v={form.category} on={v=>setForm({...form, category:v})} opts={['Montura','Cristal','Accesorio','Servicio','Otros'].map(x=>[x,x])}/><Input v={form.description} p="Descripcion" on={v=>setForm({...form, description:v})}/><Input v={form.qty} p="Cantidad" type="number" on={v=>setForm({...form, qty:v, stock:v})}/><Input v={form.cost} p="Costo" type="number" on={v=>setForm({...form, cost:v})}/><Input v={form.price} p="Precio" type="number" on={v=>setForm({...form, price:v})}/><Select v={form.paymentMethod} on={v=>setForm({...form, paymentMethod:v})} opts={['Efectivo','Pago movil','Divisas','Transferencia','Mixto'].map(x=>[x,x])}/><Input v={form.stock} p="Stock" type="number" on={v=>setForm({...form, stock:v})}/><Input v={form.minStock} p="Stock minimo" type="number" on={v=>setForm({...form, minStock:v})}/><button onClick={save}><Plus size={16}/>Agregar</button>
    </div></Card>
    <Card title="Productos" wide action={<div className="search"><Search size={16}/><input placeholder="Buscar codigo, categoria o producto" value={query} onChange={e=>setQuery(e.target.value)}/></div>}><Table rows={filtered} columns={[['code','Codigo'], ['date','Fecha'], ['category','Categoria'], ['description','Descripcion'], ['qty','Cantidad'], ['cost','Costo', money], ['price','Precio', money], ['paymentMethod','Metodo pago'], ['stock','Stock']]}/></Card>
  </div>;
}

function Sales({store, setStore}) {
  const firstProduct = store.products[0];
  const [sale, setSale] = useState({date: today(), customerName:'', productId: firstProduct?.id || '', qty:1, payment:'Efectivo', warranty:'No'});
  const product = store.products.find(p=>p.id===sale.productId);
  const total = product ? product.price * Number(sale.qty || 0) : 0;
  const complete = () => {
    if(!sale.customerName) return alert('Nombre del cliente obligatorio');
    if(!product) return alert('Selecciona un producto');
    if(Number(sale.qty) <= 0) return alert('Cantidad invalida');
    if(product.stock < Number(sale.qty)) return alert('No hay stock suficiente');
    const newSale = { id: uid(), date: sale.date, customerName: sale.customerName, productId: product.id, productCodeName: `${product.code} - ${product.description}`, category: product.category, description: product.description, qty: Number(sale.qty), payment: sale.payment, total, warranty: sale.warranty };
    setStore(prev => ({ ...prev, sales: [...prev.sales, newSale], products: prev.products.map(p => p.id === product.id ? {...p, stock: p.stock - Number(sale.qty)} : p) }));
    alert('Venta guardada y stock descontado');
  };
  return <Card title="Ventas (Montura - Cristales)" wide><div className="formGrid">
    <Input v={sale.date} p="Fecha" type="date" on={v=>setSale({...sale, date:v})}/><Input v={sale.customerName} p="Nombre y apellido del cliente" on={v=>setSale({...sale, customerName:v})}/><Select v={sale.productId} on={v=>setSale({...sale, productId:v})} opts={store.products.map(p=>[p.id, `${p.code} - ${p.description} (${p.stock})`])}/><div className="totalBox">Categoria:<b>{product?.category || '-'}</b></div><div className="totalBox">Descripcion:<b>{product?.description || '-'}</b></div><Input v={sale.qty} p="Cantidad" type="number" on={v=>setSale({...sale, qty:v})}/><Select v={sale.payment} on={v=>setSale({...sale, payment:v})} opts={['Efectivo','Pago movil','Divisas','Transferencia','Mixto'].map(x=>[x,x])}/><div className="totalBox">Total:<b>{money(total)}</b></div><Select v={sale.warranty} on={v=>setSale({...sale, warranty:v})} opts={[['No','Sin garantia'],['Si','Con garantia']]}/><button onClick={complete}><Save size={16}/>Registrar venta</button>
  </div></Card>;
}

function Customers({customers, setList}) {
  const blank = { name:'', phone:'', notes:'' };
  const [form, setForm] = useState(blank);
  const add = () => { if(!form.name) return alert('Nombre obligatorio'); setList('customers', list => [...list, {...form, id: uid()}]); setForm(blank); };
  return <div className="stack"><Card title="Nuevo cliente"><div className="formGrid"><Input v={form.name} p="Nombre" on={v=>setForm({...form,name:v})}/><Input v={form.phone} p="Telefono" on={v=>setForm({...form,phone:v})}/><Input v={form.notes} p="Observaciones" on={v=>setForm({...form,notes:v})}/><button onClick={add}>Agregar cliente</button></div></Card><Card title="Clientes"><Table rows={customers} columns={[['name','Nombre'],['phone','Telefono'],['notes','Notas']]}/></Card></div>;
}

function Orders({ orders, labs, setList }) {
  const blank = { number: `GC-${String(orders.length + 1).padStart(4, '0')}`, date: today(), responsible: '', customer: '', idCard: '', age: '', phone: '', lab: labs[0]?.name || 'Novak', lens: '', treatment: '', prescription: '', frame: '', total: '', paymentMethod: 'Efectivo', deposit: '', depositReference: '', balance: 0, balanceReference: '', reference: '', opticalDestination: '', status: 'En la tienda', labPayment: 'No pago', sentDate: '', deliveredDate: '', notifiedClient: 'No', opticalAmount: '', deliveryDate: today(), warranty: 'No', notes: '' };
  const [form, setForm] = useState(blank);
  useEffect(() => { setForm(f => ({...f, balance: Number(f.total || 0) - Number(f.deposit || 0)})); }, [form.total, form.deposit]);
  const add = () => {
    if (!form.customer) return alert('Cliente obligatorio');
    if (!form.phone) return alert('Telefono obligatorio');
    setList('orders', list => [...list, {...form, id: uid(), total:+(form.total||0), deposit:+(form.deposit||0), balance:+(form.balance||0), opticalAmount:+(form.opticalAmount||0)}]);
    setForm({...blank, number: `GC-${String(orders.length + 2).padStart(4, '0')}`});
  };
  const updateStatus = (id, status) => setList('orders', list => list.map(o => o.id === id ? {...o, status} : o));
  return <div className="stack">
    <Card title="Trabajos de formula / ordenes" wide><div className="formGrid">
      <Input v={form.number} p="Codigo de orden" on={v=>setForm({...form, number:v})}/><Input v={form.date} p="Fecha" type="date" on={v=>setForm({...form, date:v})}/><Input v={form.customer} p="Nombre y apellido (cliente)" on={v=>setForm({...form, customer:v})}/><Input v={form.idCard} p="Cedula" on={v=>setForm({...form, idCard:v})}/><Input v={form.age} p="Edad" type="number" on={v=>setForm({...form, age:v})}/><Input v={form.phone} p="Telefono" on={v=>setForm({...form, phone:v})}/><Select v={form.lab} on={v=>setForm({...form, lab:v})} opts={labs.map(l=>[l.name,l.name])}/><Input v={form.lens} p="Cristal" on={v=>setForm({...form, lens:v})}/><Input v={form.treatment} p="Tratamiento" on={v=>setForm({...form, treatment:v})}/><Input v={form.prescription} p="Formula" on={v=>setForm({...form, prescription:v})}/><Input v={form.frame} p="Montura" on={v=>setForm({...form, frame:v})}/><Input v={form.total} p="Monto total" type="number" on={v=>setForm({...form, total:v})}/><Select v={form.paymentMethod} on={v=>setForm({...form, paymentMethod:v})} opts={['Efectivo','Pago movil','Divisas','Transferencia','Mixto'].map(x=>[x,x])}/><Input v={form.deposit} p="Abono (monto)" type="number" on={v=>setForm({...form, deposit:v})}/><Input v={form.depositReference} p="Abono referencia" on={v=>setForm({...form, depositReference:v})}/><div className="totalBox">Resta:<b>{money(form.balance)}</b></div><Input v={form.balanceReference} p="Resta referencia" on={v=>setForm({...form, balanceReference:v})}/><Select v={form.status} on={v=>setForm({...form, status:v})} opts={['En la tienda','Enviado','Proceso','Entregado'].map(x=>[x,x])}/><Select v={form.labPayment} on={v=>setForm({...form, labPayment:v})} opts={['No pago','Pago'].map(x=>[x,x])}/><Input v={form.sentDate} p="Fecha de enviado" type="date" on={v=>setForm({...form, sentDate:v})}/><Input v={form.deliveredDate} p="Fecha de entregado" type="date" on={v=>setForm({...form, deliveredDate:v})}/><Input v={form.opticalAmount} p="Monto laboratorio" type="number" on={v=>setForm({...form, opticalAmount:v})}/><Select v={form.notifiedClient} on={v=>setForm({...form, notifiedClient:v})} opts={[['No','No se notifico'],['Si','Si se notifico']]}/><Select v={form.warranty} on={v=>setForm({...form, warranty:v})} opts={[['No','Sin garantia'],['Si','Con garantia']]}/><Input v={form.notes} p="Observaciones" on={v=>setForm({...form, notes:v})}/><button onClick={add}>Guardar orden</button>
    </div></Card>
    <Card title="Ordenes registradas" wide><div className="orderList">{orders.map(o => <div className="order" key={o.id}><div><b>{o.number}</b><span>{o.customer} | Tel: {o.phone} | Lab: {o.lab} | Resta {money(o.balance)}</span><span>Cristal: {o.lens || 'N/A'} | Tratamiento: {o.treatment || 'N/A'} | Garantia: {o.warranty}</span><span>Enviado: {o.sentDate || '-'} | Entregado: {o.deliveredDate || '-'} | Notificado: {o.notifiedClient}</span></div><select value={o.status} onChange={e=>updateStatus(o.id,e.target.value)}>{['En la tienda','Enviado','Proceso','Entregado'].map(s=><option key={s}>{s}</option>)}</select></div>)}</div></Card>
  </div>;
}

function Laboratories({labs, orders, setList}) {
  const [selected, setSelected] = useState(labs[0]?.name || 'Novak');
  const [form, setForm] = useState({ name: '', phone: '', notes: '' });
  const filtered = orders.filter(o => o.lab === selected);
  const addLab = () => { if(!form.name) return alert('Nombre de laboratorio obligatorio'); setList('laboratories', list => [...list, {...form, id: uid()}]); setSelected(form.name); setForm({ name: '', phone: '', notes: '' }); };
  const pending = filtered.filter(o => o.status !== 'Entregado').length;
  const paid = filtered.filter(o => o.labPayment === 'Pago').length;
  const amount = filtered.reduce((a,o)=>a+Number(o.opticalAmount || 0),0);
  return <div className="stack"><Card title="Laboratorios" wide><div className="tabs">{labs.map(l => <button key={l.id} onClick={()=>setSelected(l.name)} className={selected===l.name ? 'active' : ''}>{l.name}</button>)}</div><div className="formGrid"><Input v={form.name} p="Nuevo laboratorio" on={v=>setForm({...form,name:v})}/><Input v={form.phone} p="Telefono/contacto" on={v=>setForm({...form,phone:v})}/><Input v={form.notes} p="Observaciones" on={v=>setForm({...form,notes:v})}/><button onClick={addLab}>Agregar laboratorio</button></div></Card><div className="grid"><KPI label={`Ordenes en ${selected}`} value={filtered.length}/><KPI label="Pendientes" value={pending}/><KPI label="Pagadas" value={paid}/><KPI label="Monto lab." value={money(amount)}/></div><Card title={`Ordenes de ${selected}`} wide><Table rows={filtered} columns={[['number','Orden'],['customer','Cliente'],['status','Estatus'],['labPayment','Pago'],['sentDate','Enviado'],['deliveredDate','Entregado'],['opticalAmount','Monto', money],['notifiedClient','Notificado'],['notes','Observaciones']]}/></Card></div>;
}

function Expenses({expenses, setList}) { const [form, setForm] = useState({date:today(), category:'Operativo', description:'', amount:''}); const add = () => { if(!form.description) return alert('Descripcion obligatoria'); setList('expenses', l=>[...l,{...form,id:uid(),amount:+form.amount}]); setForm({date:today(), category:'Operativo', description:'', amount:''}); }; return <div className="stack"><Card title="Registrar gasto"><div className="formGrid"><Input v={form.category} p="Categoria" on={v=>setForm({...form,category:v})}/><Input v={form.description} p="Descripcion" on={v=>setForm({...form,description:v})}/><Input v={form.amount} p="Monto" type="number" on={v=>setForm({...form,amount:v})}/><button onClick={add}>Guardar gasto</button></div></Card><Card title="Gastos"><Table rows={expenses} columns={[['date','Fecha'],['category','Categoria'],['description','Descripcion'],['amount','Monto',money]]}/></Card></div>; }
function Cash({store, setStore, stats}) { return <Card title="Caja diaria"><div className="formGrid"><Input v={store.cash.opening} p="Caja inicial" type="number" on={v=>setStore(prev=>({...prev,cash:{...prev.cash,opening:+v}}))}/><div className="totalBox">Ventas hoy: <b>{money(stats.salesToday)}</b></div><div className="totalBox">Gastos hoy: <b>{money(stats.expensesToday)}</b></div><div className="totalBox strong">Caja disponible: <b>{money(stats.cashBalance)}</b></div></div></Card>; }
function Reports({store, stats}) { const inventoryValue = store.products.reduce((a,p)=>a + Number(p.stock||0)*Number(p.cost||0), 0); const expectedSalesValue = store.products.reduce((a,p)=>a + Number(p.stock||0)*Number(p.price||0), 0); return <div className="grid"><KPI label="Valor inventario costo" value={money(inventoryValue)}/><KPI label="Valor inventario venta" value={money(expectedSalesValue)}/><KPI label="Saldos por cobrar" value={money(stats.pendingBalances)}/><KPI label="Productos activos" value={store.products.length}/><Card title="Resumen" wide><p>Esta version organiza inventario, ventas, trabajos de formula y laboratorios segun el flujo manual de GafasCity.</p></Card></div>; }

createRoot(document.getElementById('root')).render(<App />);
