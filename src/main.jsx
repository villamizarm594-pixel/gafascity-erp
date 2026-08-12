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
const blank = {
3
number: `GC-${String(orders.length + 1).padStart(4, '0')}`,
4
date: today(),
5
responsible: '',
6
customer: '',
7
phone: '',
8
lens: '',
9
treatment: '',
10
prescription: '',
11
total: '',
12
paymentMethod: 'Efectivo',
13
deposit: '',
14
balance: 0,
15
reference: '',
16
opticalDestination: '',
17
status: 'Registrado',
18
labPayment: 'Pendiente',
19
opticalAmount: '',
20
deliveryDate: today(),
21
warranty: 'No',
22
notes: ''
23
};
24
 
25
const [form, setForm] = useState(blank);
26
 
27
useEffect(() => {
28
setForm((f) => ({
29
...f,
30
balance: Number(f.total || 0) - Number(f.deposit || 0)
31
}));
32
}, [form.total, form.deposit]);
33
 
34
const add = () => {
35
if (!form.customer) return alert('Cliente obligatorio');
36
if (!form.phone) return alert('Telefono obligatorio');
37
 
38
setList('orders', (list) => [
39
...list,
40
{
41
...form,
42
id: uid(),
43
total: Number(form.total || 0),
44
deposit: Number(form.deposit || 0),
45
balance: Number(form.balance || 0),
46
opticalAmount: Number(form.opticalAmount || 0)
47
}
48
]);
49
 
50
setForm({
51
...blank,
52
number: `GC-${String(orders.length + 2).padStart(4, '0')}`
53
});
54
};
55
 
56
const updateStatus = (id, status) => {
57
setList('orders', (list) =>
58
list.map((o) => (o.id === id ? { ...o, status } : o))
59
);
60
};
61
 
62
return (
63
<div className="stack">
64
<Card title="Nueva orden / trabajo optico">
65
<div className="formGrid">
66
<Input
67
v={form.number}
68
p="Codigo de orden"
69
on={(v) => setForm({ ...form, number: v })}
70
/>
71
 
72
<Input
73
v={form.date}
74
p="Fecha inicio"
75
type="date"
76
on={(v) => setForm({ ...form, date: v })}
77
/>
78
 
79
<Input
80
v={form.responsible}
81
p="Responsable"
82
on={(v) => setForm({ ...form, responsible: v })}
83
/>
84
 
85
<Input
86
v={form.customer}
87
p="Nombre del cliente"
88
on={(v) => setForm({ ...form, customer: v })}
89
/>
90
 
91
<Input
92
v={form.phone}
93
p="Telefono"
94
on={(v) => setForm({ ...form, phone: v })}
95
/>
96
 
97
<Input
98
v={form.lens}
99
p="Cristal"
100
on={(v) => setForm({ ...form, lens: v })}
101
/>
102
 
103
<Input
104
v={form.treatment}
105
p="Tratamiento"
106
on={(v) => setForm({ ...form, treatment: v })}
107
/>
108
 
109
<Input
110
v={form.prescription}
111
p="Formula"
112
on={(v) => setForm({ ...form, prescription: v })}
113
/>
114
 
115
<Input
116
v={form.total}
117
p="Total a pagar"
118
type="number"
119
on={(v) => setForm({ ...form, total: v })}
120
/>
121
 
122
<Select
123
v={form.paymentMethod}
124
on={(v) => setForm({ ...form, paymentMethod: v })}
125
opts={[
126
['Efectivo', 'Efectivo'],
127
['Pago movil', 'Pago movil'],
128
['Divisas', 'Divisas'],
129
['Transferencia', 'Transferencia'],
130
['Mixto', 'Mixto']
131
]}
132
/>
133
 
134
<Input
135
v={form.deposit}
136
p="Abono"
137
type="number"
138
on={(v) => setForm({ ...form, deposit: v })}
139
/>
140
 
141
<div className="totalBox">
142
Resta:
143
<b>{money(form.balance)}</b>
144
</div>
145
 
146
<Input
147
v={form.reference}
148
p="Referencia"
149
on={(v) => setForm({ ...form, reference: v })}
150
/>
151
 
152
<Input
153
v={form.opticalDestination}
154
p="Destino optica"
155
on={(v) => setForm({ ...form, opticalDestination: v })}
156
/>
157
 
158
<Select
159
v={form.status}
160
on={(v) => setForm({ ...form, status: v })}
161
opts={[
162
['Registrado', 'Registrado'],
163
['Enviado', 'Enviado'],
164
['En proceso', 'En proceso'],
165
['Listo', 'Listo'],
166
['Entregado', 'Entregado'],
167
['Garantia', 'Garantia']
168
]}
169
/>
170
 
171
<Select
172
v={form.labPayment}
173
on={(v) => setForm({ ...form, labPayment: v })}
174
opts={[
175
['Pendiente', 'Pendiente'],
176
['Pagado', 'Pagado']
177
]}
178
/>
179
 
180
<Input
181
v={form.opticalAmount}
182
p="Monto optica"
183
type="number"
184
on={(v) => setForm({ ...form, opticalAmount: v })}
185
/>
186
 
187
<Input
188
v={form.deliveryDate}
189
p="Fecha entrega"
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
