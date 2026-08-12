import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LayoutDashboard, Package, ShoppingCart, Users, ClipboardList, Wallet, Receipt, BarChart3, Plus, Search, Save, Trash2 } from 'lucide-react';
import './styles.css';

const today = () => new Date().toISOString().slice(0, 10);
const money = (n) => `$${Number(n || 0).toFixed(2)}`;
const uid = () => Math.random().toString(36).slice(2, 9);

const seed = {
  products: [
    { id: 'p1', code: 'OK1602', description: 'Oakley Conductor', category: 'Lentes de sol', cost: 10, price: 25, stock: 13, minStock: 5 },
    { id: 'p2', code: 'RB101', description: 'Rayban', category: 'Lentes de sol', cost: 8, price: 15, stock: 27, minStock: 5 },
    { id: 'p3', code: 'OK1610', description: 'Oakley Aviador', category: 'Lentes de sol', cost: 12, price: 25, stock: 68, minStock: 8 },
    { id: 'p4', code: 'OKP121', description: 'Oakley Polarizado', category: 'Polarizados', cost: 9, price: 16, stock: 1, minStock: 5 }
  ],
  customers: [
    { id: 'c1', name: 'Carlos Perez', phone: '0412-0000000', notes: 'Cliente frecuente' },
    { id: 'c2', name: 'Maria Gomez', phone: '0414-0000000', notes: 'Pendiente por retirar' }
  ],
  sales: [
    { id: 's1', date: today(), customerId: 'c1', productId: 'p1', qty: 1, payment: 'Efectivo', total: 25 }
  ],
  orders: [
    { id: 'o1', number: 'GC-0001', date: today(), customer: 'Maria Gomez', phone: '0414-0000000', lens: 'Monofocal', treatment: 'Antirreflejo', prescription: 'OD -1.25 / OI -1.00', total: 80, deposit: 40, balance: 40, deliveryDate: today(), status: 'En proceso' }
  ],
  expenses: [
    { id: 'e1', date: today(), category: 'Operativo', description: 'Fundas', amount: 10 }
  ],
  cash: { opening: 100 }
};

function loadStore() {
  const raw = localStorage.getItem('gafascity-store-v1');
  return raw ? JSON.parse(raw) : seed;
}

function App() {
  const [active, setActive] = useState('dashboard');
  const [store, setStore] = useState(loadStore);
  const [query, setQuery] = useState('');

  useEffect(() => localStorage.setItem('gafascity-store-v1', JSON.stringify(store)), [store]);

  const setList = (key, updater) => setStore(prev => ({ ...prev, [key]: typeof updater === 'function' ? updater(prev[key]) : updater }));

  const stats = useMemo(() => {
    const salesToday = store.sales.filter(s => s.date === today()).reduce((a, s) => a + Number(s.total), 0);
    const expensesToday = store.expenses.filter(e => e.date === today()).reduce((a, e) => a + Number(e.amount), 0);
    const lowStock = store.products.filter(p => Number(p.stock) <= Number(p.minStock));
    const pendingOrders = store.orders.filter(o => !['Entregado', 'Garantia'].includes(o.status));
    const cashBalance = Number(store.cash.opening) + salesToday - expensesToday;
    const pendingBalances = store.orders.reduce((a, o) => a + Number(o.balance || 0), 0);
    return { salesToday, expensesToday, lowStock, pendingOrders, cashBalance, pendingBalances };
  }, [store]);

  const nav = [
    ['dashboard', 'Panel', LayoutDashboard],
    ['inventory', 'Inventario', Package],
    ['sales', 'Ventas', ShoppingCart],
    ['customers', 'Clientes', Users],
    ['orders', 'Ordenes', ClipboardList],
    ['cash', 'Caja', Wallet],
    ['expenses', 'Gastos', Receipt],
    ['reports', 'Reportes', BarChart3]
  ];

  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><span>GC</span><div><b>GafasCity ERP</b><small>Administracion optica</small></div></div>
      <nav>{nav.map(([id, label, Icon]) => <button key={id} onClick={() => setActive(id)} className={active === id ? 'active' : ''}><Icon size={18}/>{label}</button>)}</nav>
      <div className="statusBox"><b>Modo MVP real</b><span>Los datos se guardan en este navegador con localStorage.</span></div>
    </aside>
    <main>
      <header className="topbar">
        <div><h1>{nav.find(n => n[0] === active)?.[1]}</h1><p>Gestion interna para ventas, inventario, caja y laboratorio.</p></div>
        <button className="ghost" onClick={() => { if(confirm('Esto reinicia los datos de prueba.')) { localStorage.removeItem('gafascity-store-v1'); location.reload(); }}}>Reiniciar demo</button>
      </header>
      {active === 'dashboard' && <Dashboard store={store} stats={stats}/>}      
      {active === 'inventory' && <Inventory products={store.products} setList={setList} query={query} setQuery={setQuery}/>}      
      {active === 'sales' && <Sales store={store} setStore={setStore}/>}      
      {active === 'customers' && <Customers customers={store.customers} setList={setList}/>}      
      {active === 'orders' && <Orders orders={store.orders} setList={setList}/>}      
      {active === 'cash' && <Cash store={store} setStore={setStore} stats={stats}/>}      
      {active === 'expenses' && <Expenses expenses={store.expenses} setList={setList}/>}      
      {active === 'reports' && <Reports store={store} stats={stats}/>}      
    </main>
  </div>;
}

function KPI({label, value, hint}) { return <div className="kpi"><span>{label}</span><b>{value}</b>{hint && <small>{hint}</small>}</div>; }
function Card({title, children, action}) { return <section className="card"><div className="cardHead"><h2>{title}</h2>{action}</div>{children}</section>; }

function Dashboard({store, stats}) {
  return <div className="grid">
    <KPI label="Ventas hoy" value={money(stats.salesToday)} hint="Ingresos del dia"/>
    <KPI label="Caja disponible" value={money(stats.cashBalance)} hint="Caja inicial + ventas - gastos"/>
    <KPI label="Ordenes pendientes" value={stats.pendingOrders.length} hint="Laboratorio y entregas"/>
    <KPI label="Stock bajo" value={stats.lowStock.length} hint="Productos a reponer"/>
    <Card title="Inventario bajo"><Table rows={stats.lowStock} columns={[['code','Codigo'], ['description','Producto'], ['stock','Stock'], ['minStock','Minimo']]}/></Card>
    <Card title="Ordenes recientes"><Table rows={store.orders.slice(-5).reverse()} columns={[['number','Orden'], ['customer','Cliente'], ['balance','Saldo', money], ['status','Estado']]}/></Card>
    <Card title="Ventas recientes"><Table rows={store.sales.slice(-6).reverse().map(s => ({...s, product: store.products.find(p=>p.id===s.productId)?.description || 'Producto'}))} columns={[['date','Fecha'], ['product','Producto'], ['qty','Cant.'], ['total','Total', money], ['payment','Pago']]}/></Card>
  </div>;
}

function Table({rows, columns, empty='Sin registros'}) {
  if(!rows.length) return <p className="muted">{empty}</p>;
  return <div className="tableWrap"><table><thead><tr>{columns.map(c => <th key={c[0]}>{c[1]}</th>)}</tr></thead><tbody>{rows.map((r, idx)=><tr key={r.id || idx}>{columns.map(([key,,fmt])=><td key={key}>{fmt ? fmt(r[key]) : r[key]}</td>)}</tr>)}</tbody></table></div>;
}

function Inventory({products, setList, query, setQuery}) {
  const blank = { code:'', description:'', category:'', cost:'', price:'', stock:'', minStock:'5' };
  const [form, setForm] = useState(blank);
  const filtered = products.filter(p => `${p.code} ${p.description}`.toLowerCase().includes(query.toLowerCase()));
  const save = () => { if(!form.code || !form.description) return alert('Codigo y descripcion son obligatorios'); setList('products', list => [...list, { ...form, id: uid(), cost:+form.cost, price:+form.price, stock:+form.stock, minStock:+form.minStock }]); setForm(blank); };
  return <div className="stack">
    <Card title="Nuevo producto"><div className="formGrid"><Input v={form.code} p="Codigo" on={v=>setForm({...form, code:v})}/><Input v={form.description} p="Descripcion" on={v=>setForm({...form, description:v})}/><Input v={form.category} p="Categoria" on={v=>setForm({...form, category:v})}/><Input v={form.cost} p="Costo" type="number" on={v=>setForm({...form, cost:v})}/><Input v={form.price} p="Precio" type="number" on={v=>setForm({...form, price:v})}/><Input v={form.stock} p="Stock" type="number" on={v=>setForm({...form, stock:v})}/><Input v={form.minStock} p="Stock minimo" type="number" on={v=>setForm({...form, minStock:v})}/><button onClick={save}><Plus size={16}/>Agregar</button></div></Card>
    <Card title="Productos" action={<div className="search"><Search size={16}/><input placeholder="Buscar codigo o producto" value={query} onChange={e=>setQuery(e.target.value)}/></div>}><Table rows={filtered} columns={[['code','Codigo'], ['description','Producto'], ['category','Categoria'], ['stock','Stock'], ['price','Precio', money]]}/></Card>
  </div>;
}

function Sales({store, setStore}) {
  const [sale, setSale] = useState({customerId: store.customers[0]?.id || '', productId: store.products[0]?.id || '', qty:1, payment:'Efectivo'});
  const product = store.products.find(p=>p.id===sale.productId);
  const total = product ? product.price * Number(sale.qty || 0) : 0;
  const complete = () => {
    if(!product) return alert('Selecciona un producto');
    if(Number(sale.qty) <= 0) return alert('Cantidad invalida');
    if(product.stock < Number(sale.qty)) return alert('No hay stock suficiente');
    const newSale = { id: uid(), date: today(), ...sale, qty: Number(sale.qty), total };
    setStore(prev => ({ ...prev, sales: [...prev.sales, newSale], products: prev.products.map(p => p.id === product.id ? {...p, stock: p.stock - Number(sale.qty)} : p) }));
    alert('Venta guardada y stock descontado');
  };
  return <Card title="Punto de venta"><div className="formGrid"><Select v={sale.customerId} on={v=>setSale({...sale, customerId:v})} opts={store.customers.map(c=>[c.id,c.name])}/><Select v={sale.productId} on={v=>setSale({...sale, productId:v})} opts={store.products.map(p=>[p.id, `${p.code} - ${p.description} (${p.stock})`])}/><Input v={sale.qty} p="Cantidad" type="number" on={v=>setSale({...sale, qty:v})}/><Select v={sale.payment} on={v=>setSale({...sale, payment:v})} opts={['Efectivo','Pago movil','Divisas','Transferencia'].map(x=>[x,x])}/><div className="totalBox">Total: <b>{money(total)}</b></div><button onClick={complete}><Save size={16}/>Registrar venta</button></div></Card>;
}

function Customers({customers, setList}) {
  const blank = { name:'', phone:'', notes:'' };
  const [form, setForm] = useState(blank);
  const add = () => { if(!form.name) return alert('Nombre obligatorio'); setList('customers', list => [...list, {...form, id: uid()}]); setForm(blank); };
  return <div className="stack"><Card title="Nuevo cliente"><div className="formGrid"><Input v={form.name} p="Nombre" on={v=>setForm({...form,name:v})}/><Input v={form.phone} p="Telefono" on={v=>setForm({...form,phone:v})}/><Input v={form.notes} p="Observaciones" on={v=>setForm({...form,notes:v})}/><button onClick={add}>Agregar cliente</button></div></Card><Card title="Clientes"><Table rows={customers} columns={[['name','Nombre'],['phone','Telefono'],['notes','Notas']]}/></Card></div>;
}

function Orders({orders, setList}) {
  const blank = { number:`GC-${String(orders.length+1).padStart(4,'0')}`, date:today(), customer:'', phone:'', lens:'', treatment:'', prescription:'', total:'', deposit:'', balance:0, deliveryDate:today(), status:'Registrado' };
  const [form, setForm] = useState(blank);
  useEffect(()=>setForm(f=>({...f, balance: Number(f.total||0)-Number(f.deposit||0)})), [form.total, form.deposit]);
  const add = () => { if(!form.customer) return alert('Cliente obligatorio'); setList('orders', list => [...list, {...form, id: uid(), total:+form.total, deposit:+form.deposit, balance:+form.balance}]); setForm({...blank, number:`GC-${String(orders.length+2).padStart(4,'0')}`}); };
  const updateStatus = (id, status) => setList('orders', list => list.map(o => o.id === id ? {...o, status} : o));
  return <div className="stack"><Card title="Nueva orden de laboratorio"><div className="formGrid"><Input v={form.customer} p="Cliente" on={v=>setForm({...form,customer:v})}/><Input v={form.phone} p="Telefono" on={v=>setForm({...form,phone:v})}/><Input v={form.lens} p="Cristal" on={v=>setForm({...form,lens:v})}/><Input v={form.treatment} p="Tratamiento" on={v=>setForm({...form,treatment:v})}/><Input v={form.prescription} p="Formula" on={v=>setForm({...form,prescription:v})}/><Input v={form.total} p="Total" type="number" on={v=>setForm({...form,total:v})}/><Input v={form.deposit} p="Abono" type="number" on={v=>setForm({...form,deposit:v})}/><div className="totalBox">Saldo: <b>{money(form.balance)}</b></div><button onClick={add}>Guardar orden</button></div></Card><Card title="Ordenes"><div className="orderList">{orders.map(o=><div className="order" key={o.id}><div><b>{o.number}</b><span>{o.customer} | Saldo {money(o.balance)}</span></div><select value={o.status} onChange={e=>updateStatus(o.id,e.target.value)}>{['Registrado','Enviado','En proceso','Listo','Entregado','Garantia'].map(s=><option key={s}>{s}</option>)}</select></div>)}</div></Card></div>;
}

function Expenses({expenses, setList}) {
  const [form, setForm] = useState({date:today(), category:'Operativo', description:'', amount:''});
  const add = () => { if(!form.description) return alert('Descripcion obligatoria'); setList('expenses', l=>[...l,{...form,id:uid(),amount:+form.amount}]); setForm({date:today(), category:'Operativo', description:'', amount:''}); };
  return <div className="stack"><Card title="Registrar gasto"><div className="formGrid"><Input v={form.category} p="Categoria" on={v=>setForm({...form,category:v})}/><Input v={form.description} p="Descripcion" on={v=>setForm({...form,description:v})}/><Input v={form.amount} p="Monto" type="number" on={v=>setForm({...form,amount:v})}/><button onClick={add}>Guardar gasto</button></div></Card><Card title="Gastos"><Table rows={expenses} columns={[['date','Fecha'],['category','Categoria'],['description','Descripcion'],['amount','Monto',money]]}/></Card></div>;
}

function Cash({store, setStore, stats}) {
  return <Card title="Caja diaria"><div className="formGrid"><Input v={store.cash.opening} p="Caja inicial" type="number" on={v=>setStore(prev=>({...prev,cash:{...prev.cash,opening:+v}}))}/><div className="totalBox">Ventas hoy: <b>{money(stats.salesToday)}</b></div><div className="totalBox">Gastos hoy: <b>{money(stats.expensesToday)}</b></div><div className="totalBox strong">Caja disponible: <b>{money(stats.cashBalance)}</b></div></div></Card>;
}

function Reports({store, stats}) {
  const inventoryValue = store.products.reduce((a,p)=>a + p.stock * p.cost, 0);
  const expectedSalesValue = store.products.reduce((a,p)=>a + p.stock * p.price, 0);
  return <div className="grid"><KPI label="Valor inventario costo" value={money(inventoryValue)}/><KPI label="Valor inventario venta" value={money(expectedSalesValue)}/><KPI label="Saldos por cobrar" value={money(stats.pendingBalances)}/><KPI label="Productos activos" value={store.products.length}/><Card title="Resumen"><p>Este MVP ya permite probar el flujo central: producto, venta, descuento de stock, gasto, caja y orden de laboratorio.</p></Card></div>;
}

function Input({v,on,p,type='text'}) { return <input value={v} type={type} placeholder={p} onChange={e=>on(e.target.value)}/>; }
function Select({v,on,opts}) { return <select value={v} onChange={e=>on(e.target.value)}>{opts.map(([val,label])=><option key={val} value={val}>{label}</option>)}</select>; }

createRoot(document.getElementById('root')).render(<App />);
