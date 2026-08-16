import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LayoutDashboard, Package, ShoppingCart, Users, ClipboardList, Wallet, Receipt, BarChart3, Plus, Search, Save, Microscope, Pencil, Trash2, RotateCcw, Settings } from 'lucide-react';
import './styles.css';

const today = () => new Date().toISOString().slice(0, 10);
const money = (n) => `$${Number(n || 0).toFixed(2)}`;
const uid = () => Math.random().toString(36).slice(2, 9);
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
  settings: { businessName:'GafasCity ERP', subtitle:'Gestion optica interna', logo:'', versionTitle:'Version 4', versionDescription:'Caja diaria mejorada, logo editable y configuracion' }
};

function loadStore(){
  const raw = localStorage.getItem('gafascity-store-v2');
  if(!raw) return seed;
  const parsed = JSON.parse(raw);
  return { ...seed, ...parsed, laboratories: parsed.laboratories?.length ? parsed.laboratories : seed.laboratories };
}

function App(){
  const [active,setActive] = useState('dashboard');
  const [store,setStore] = useState(loadStore);
  const [query,setQuery] = useState('');
  useEffect(()=>localStorage.setItem('gafascity-store-v2', JSON.stringify(store)), [store]);
  const setList = (key, updater) => setStore(prev => ({...prev, [key]: typeof updater === 'function' ? updater(prev[key]) : updater}));
  const stats = useMemo(()=>{
    const activeSales = store.sales.filter(s=>!s.cancelled);
    const salesToday = activeSales.filter(s=>s.date===today()).reduce((a,s)=>a+Number(s.total),0);
    const salesByMethod = {
      efectivo: activeSales.filter(s=>s.date===today() && s.payment==='Efectivo').reduce((a,s)=>a+Number(s.total),0),
      pagoMovil: activeSales.filter(s=>s.date===today() && s.payment==='Pago movil').reduce((a,s)=>a+Number(s.total),0),
      divisas: activeSales.filter(s=>s.date===today() && s.payment==='Divisas').reduce((a,s)=>a+Number(s.total),0),
      transferencia: activeSales.filter(s=>s.date===today() && s.payment==='Transferencia').reduce((a,s)=>a+Number(s.total),0),
      mixto: activeSales.filter(s=>s.date===today() && s.payment==='Mixto').reduce((a,s)=>a+Number(s.total),0)
    };
    const expensesToday = store.expenses.filter(e=>e.date===today()).reduce((a,e)=>a+Number(e.amount),0);
    const lowStock = store.products.filter(p=>Number(p.stock)<=Number(p.minStock||5));
    const pendingOrders = store.orders.filter(o=>o.status!=='Entregado');
    const cash = store.cash || {};
    const manualIncome = Number(cash.usdReceived||0) + Number(cash.pagoMovilReceived||0) + Number(cash.transferReceived||0) + Number(cash.divisasReceived||0);
    const manualOut = Number(cash.purchases||0) + Number(cash.otherExpenses||0);
    const cashBalance = Number(cash.opening||0) + salesToday + manualIncome - expensesToday - manualOut;
    const expectedCashClose = Number(cash.opening||0) + salesByMethod.efectivo + Number(cash.usdReceived||0) + Number(cash.divisasReceived||0) - expensesToday - manualOut;
    const expectedPagoMovilClose = salesByMethod.pagoMovil + Number(cash.pagoMovilReceived||0);
    const expectedTransferClose = salesByMethod.transferencia + Number(cash.transferReceived||0);
    const closingDiff = Number(cash.closingCash||0) + Number(cash.closingPagoMovil||0) - cashBalance;
    const pendingBalances = store.orders.reduce((a,o)=>a+Number(o.balance||0),0);
    return { activeSales, salesToday, salesByMethod, expensesToday, lowStock, pendingOrders, cashBalance, expectedCashClose, expectedPagoMovilClose, expectedTransferClose, closingDiff, pendingBalances };
  },[store]);
  const nav = [
    ['dashboard','Inicio',LayoutDashboard], ['sales','Ventas',ShoppingCart], ['orders','Ordenes / formulas',ClipboardList], ['labs','Laboratorios',Microscope], ['inventory','Inventario',Package], ['customers','Clientes',Users], ['cash','Caja diaria',Wallet], ['expenses','Gastos',Receipt], ['reports','Reportes',BarChart3], ['config','Configuracion',Settings]
  ];
  return <div className="app"><aside className="sidebar"><div className="brand">{store.settings?.logo ? <img className="logoImg" src={store.settings.logo} alt="Logo"/> : <span>GC</span>}<div><b>{store.settings?.businessName || 'GafasCity ERP'}</b><small>{store.settings?.subtitle || 'Gestion optica interna'}</small></div></div><nav>{nav.map(([id,label,Icon])=><button key={id} onClick={()=>setActive(id)} className={active===id?'active':''}><Icon size={18}/>{label}</button>)}</nav><div className="statusBox"><b>{store.settings?.versionTitle || 'Version 4'}</b><span>{store.settings?.versionDescription || 'Caja diaria mejorada y logo editable.'}</span></div></aside><main><header className="topbar"><div><h1>{nav.find(n=>n[0]===active)?.[1]}</h1><p>Flujo basado en inventario, ventas, trabajos de formula y laboratorios.</p></div><button className="ghost" onClick={()=>{if(confirm('Esto reinicia los datos locales.')){localStorage.removeItem('gafascity-store-v2');location.reload();}}}>Reiniciar datos</button></header>{active==='dashboard'&&<Dashboard store={store} stats={stats}/>} {active==='inventory'&&<Inventory products={store.products} setList={setList} query={query} setQuery={setQuery}/>} {active==='sales'&&<Sales store={store} setStore={setStore}/>} {active==='orders'&&<Orders orders={store.orders} labs={store.laboratories} setList={setList}/>} {active==='labs'&&<Laboratories labs={store.laboratories} orders={store.orders} setList={setList}/>} {active==='customers'&&<Customers customers={store.customers} setList={setList}/>} {active==='cash'&&<Cash store={store} setStore={setStore} stats={stats}/>} {active==='expenses'&&<Expenses expenses={store.expenses} setList={setList}/>} {active==='reports'&&<Reports store={store} stats={stats}/>} {active==='config'&&<Config store={store} setStore={setStore}/>}</main></div>;
}

function KPI({label,value,hint}){return <div className="kpi"><span>{label}</span><b>{value}</b>{hint&&<small>{hint}</small>}</div>}
function Card({title,children,action,wide}){return <section className={wide?'card wide':'card'}><div className="cardHead"><h2>{title}</h2>{action}</div>{children}</section>}
function Input({v,on,p,type='text'}){return <input value={v??''} type={type} placeholder={p} onChange={e=>on(e.target.value)}/>}
function Select({v,on,opts}){return <select value={v??''} onChange={e=>on(e.target.value)}>{opts.map(([val,label])=><option key={val} value={val}>{label}</option>)}</select>}
function Table({rows,columns,empty='Sin registros'}){if(!rows.length)return <p className="muted">{empty}</p>;return <div className="tableWrap"><table><thead><tr>{columns.map(c=><th key={c[0]}>{c[1]}</th>)}</tr></thead><tbody>{rows.map((r,idx)=><tr key={r.id||idx}>{columns.map(([key,,fmt])=><td key={key}>{fmt?fmt(r[key],r):r[key]}</td>)}</tr>)}</tbody></table></div>}

function Dashboard({store,stats}){
  return <div className="grid"><KPI label="Ventas hoy" value={money(stats.salesToday)} hint="Ventas activas del dia"/><KPI label="Caja disponible" value={money(stats.cashBalance)} hint="Caja inicial + ventas - gastos"/><KPI label="Ordenes pendientes" value={stats.pendingOrders.length} hint="No entregadas"/><KPI label="Stock bajo" value={stats.lowStock.length} hint="Productos a reponer"/><Card title="Inventario bajo"><Table rows={stats.lowStock} columns={[["code","Codigo"],["description","Producto"],["stock","Stock"],["minStock","Minimo"]]}/></Card><Card title="Ordenes recientes"><Table rows={store.orders.slice(-5).reverse()} columns={[["number","Orden"],["customer","Cliente"],["lab","Laboratorio"],["balance","Resta",money],["status","Estatus"]]}/></Card><Card title="Ventas recientes" wide><Table rows={store.sales.slice(-6).reverse()} columns={[["date","Fecha"],["customerName","Cliente"],["productCodeName","Producto"],["qty","Cant."],["total","Total",money],["payment","Pago"],["cancelled","Estado",v=>v?'Anulada':'Activa']]}/></Card></div>;
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
  return <div className="stack"><Card title={editing?'Editar producto':'Inventario / nuevo producto'} wide action={editing&&<button className="secondary" onClick={reset}>Cancelar edicion</button>}><div className="formGrid"><Input v={form.code} p="Codigo" on={v=>setForm({...form,code:v})}/><Input v={form.date} p="Fecha" type="date" on={v=>setForm({...form,date:v})}/><Select v={form.category} on={v=>setForm({...form,category:v})} opts={['Montura','Cristal','Accesorio','Servicio','Otros'].map(x=>[x,x])}/><Input v={form.description} p="Descripcion" on={v=>setForm({...form,description:v})}/><Input v={form.qty} p="Cantidad" type="number" on={v=>setForm({...form,qty:v,stock:v})}/><Input v={form.cost} p="Costo" type="number" on={v=>setForm({...form,cost:v})}/><Input v={form.price} p="Precio" type="number" on={v=>setForm({...form,price:v})}/><Select v={form.paymentMethod} on={v=>setForm({...form,paymentMethod:v})} opts={['Efectivo','Pago movil','Divisas','Transferencia','Mixto'].map(x=>[x,x])}/><Input v={form.stock} p="Stock" type="number" on={v=>setForm({...form,stock:v})}/><Input v={form.minStock} p="Stock minimo" type="number" on={v=>setForm({...form,minStock:v})}/><button onClick={save}><Save size={16}/>{editing?'Guardar cambios':'Agregar'}</button></div></Card><Card title="Productos" wide action={<div className="search"><Search size={16}/><input placeholder="Buscar codigo, categoria o producto" value={query} onChange={e=>setQuery(e.target.value)}/></div>}><Table rows={filtered} columns={[["code","Codigo"],["date","Fecha"],["category","Categoria"],["description","Descripcion"],["cost","Costo",money],["price","Precio",money],["stock","Stock"],["actions","Acciones",(_,r)=><div className="rowActions"><button className="mini secondary" onClick={()=>edit(r)}><Pencil size={13}/>Editar</button><button className="mini warn" onClick={()=>adjust(r.id)}>Ajustar stock</button><button className="mini danger" onClick={()=>remove(r.id)}><Trash2 size={13}/>Eliminar</button></div>]]}/></Card></div>;
}

function Sales({store,setStore}){
  const firstProduct=store.products[0]; const [sale,setSale]=useState({date:today(),customerName:'',productId:firstProduct?.id||'',qty:1,payment:'Efectivo',warranty:'No'});
  const product=store.products.find(p=>p.id===sale.productId); const total=product?product.price*Number(sale.qty||0):0;
  const complete=()=>{if(!sale.customerName)return alert('Nombre del cliente obligatorio'); if(!product)return alert('Selecciona un producto'); if(Number(sale.qty)<=0)return alert('Cantidad invalida'); if(product.stock<Number(sale.qty))return alert('No hay stock suficiente'); const newSale={id:uid(),date:sale.date,customerName:sale.customerName,productId:product.id,productCodeName:`${product.code} - ${product.description}`,category:product.category,description:product.description,qty:Number(sale.qty),payment:sale.payment,total,warranty:sale.warranty,cancelled:false}; setStore(prev=>({...prev,sales:[...prev.sales,newSale],products:prev.products.map(p=>p.id===product.id?{...p,stock:p.stock-Number(sale.qty)}:p)})); alert('Venta guardada y stock descontado');};
  const cancelSale=(s)=>{if(s.cancelled)return; if(!confirm('Anular venta y devolver stock?'))return; setStore(prev=>({...prev,sales:prev.sales.map(x=>x.id===s.id?{...x,cancelled:true}:x),products:prev.products.map(p=>p.id===s.productId?{...p,stock:Number(p.stock)+Number(s.qty)}:p)}));};
  return <div className="stack"><Card title="Ventas (Montura - Cristales)" wide><div className="formGrid"><Input v={sale.date} p="Fecha" type="date" on={v=>setSale({...sale,date:v})}/><Input v={sale.customerName} p="Nombre y apellido del cliente" on={v=>setSale({...sale,customerName:v})}/><Select v={sale.productId} on={v=>setSale({...sale,productId:v})} opts={store.products.map(p=>[p.id,`${p.code} - ${p.description} (${p.stock})`])}/><div className="totalBox">Categoria:<b>{product?.category||'-'}</b></div><div className="totalBox">Descripcion:<b>{product?.description||'-'}</b></div><Input v={sale.qty} p="Cantidad" type="number" on={v=>setSale({...sale,qty:v})}/><Select v={sale.payment} on={v=>setSale({...sale,payment:v})} opts={['Efectivo','Pago movil','Divisas','Transferencia','Mixto'].map(x=>[x,x])}/><div className="totalBox">Total:<b>{money(total)}</b></div><Select v={sale.warranty} on={v=>setSale({...sale,warranty:v})} opts={[["No","Sin garantia"],["Si","Con garantia"]]}/><button onClick={complete}><Save size={16}/>Registrar venta</button></div></Card><Card title="Historial de ventas" wide><Table rows={store.sales.slice().reverse()} columns={[["date","Fecha"],["customerName","Cliente"],["productCodeName","Producto"],["qty","Cantidad"],["total","Total",money],["payment","Pago"],["cancelled","Estado",v=>v?'Anulada':'Activa'],["actions","Acciones",(_,r)=><button disabled={r.cancelled} className="mini danger" onClick={()=>cancelSale(r)}><RotateCcw size={13}/>Anular</button>]]}/></Card></div>;
}

function Orders({orders,labs,setList}){
  const blank={number:`GC-${String(orders.length+1).padStart(4,'0')}`,date:today(),responsible:'',customer:'',idCard:'',age:'',phone:'',lab:labs[0]?.name||'Novak',lens:'',treatment:'',prescription:'',frame:'',total:'',paymentMethod:'Efectivo',deposit:'',depositReference:'',balance:0,balanceReference:'',status:'En la tienda',labPayment:'No pago',sentDate:'',deliveredDate:'',notifiedClient:'No',opticalAmount:'',deliveryDate:today(),warranty:'No',notes:''};
  const [form,setForm]=useState(blank); const [editing,setEditing]=useState(null);
  useEffect(()=>{setForm(f=>({...f,balance:Number(f.total||0)-Number(f.deposit||0)}));},[form.total,form.deposit]);
  const reset=()=>{setForm(blank);setEditing(null)};
  const save=()=>{if(!form.customer)return alert('Cliente obligatorio'); if(!form.phone)return alert('Telefono obligatorio'); const order={...form,total:+(form.total||0),deposit:+(form.deposit||0),balance:+(form.balance||0),opticalAmount:+(form.opticalAmount||0)}; if(editing){setList('orders',list=>list.map(o=>o.id===editing?{...order,id:editing}:o));}else{setList('orders',list=>[...list,{...order,id:uid()}]);} reset();};
  const edit=o=>{setEditing(o.id);setForm({...o});window.scrollTo({top:0,behavior:'smooth'});};
  const remove=id=>{if(confirm('Eliminar esta orden?')) setList('orders',list=>list.filter(o=>o.id!==id));};
  const quickStatus=(id,status)=>setList('orders',list=>list.map(o=>o.id===id?{...o,status}:o));
  return <div className="stack"><Card title={editing?'Editar trabajo de formula':'Trabajos de formula / ordenes'} wide action={editing&&<button className="secondary" onClick={reset}>Cancelar edicion</button>}><div className="formGrid"><Input v={form.number} p="Codigo de orden" on={v=>setForm({...form,number:v})}/><Input v={form.date} p="Fecha" type="date" on={v=>setForm({...form,date:v})}/><Input v={form.customer} p="Nombre y apellido (cliente)" on={v=>setForm({...form,customer:v})}/><Input v={form.idCard} p="Cedula" on={v=>setForm({...form,idCard:v})}/><Input v={form.age} p="Edad" type="number" on={v=>setForm({...form,age:v})}/><Input v={form.phone} p="Telefono" on={v=>setForm({...form,phone:v})}/><Select v={form.lab} on={v=>setForm({...form,lab:v})} opts={labs.map(l=>[l.name,l.name])}/><Input v={form.lens} p="Cristal" on={v=>setForm({...form,lens:v})}/><Input v={form.treatment} p="Tratamiento" on={v=>setForm({...form,treatment:v})}/><Input v={form.prescription} p="Formula" on={v=>setForm({...form,prescription:v})}/><Input v={form.frame} p="Montura" on={v=>setForm({...form,frame:v})}/><Input v={form.total} p="Monto total" type="number" on={v=>setForm({...form,total:v})}/><Select v={form.paymentMethod} on={v=>setForm({...form,paymentMethod:v})} opts={['Efectivo','Pago movil','Divisas','Transferencia','Mixto'].map(x=>[x,x])}/><Input v={form.deposit} p="Abono (monto)" type="number" on={v=>setForm({...form,deposit:v})}/><Input v={form.depositReference} p="Abono referencia" on={v=>setForm({...form,depositReference:v})}/><div className="totalBox">Resta:<b>{money(form.balance)}</b></div><Input v={form.balanceReference} p="Resta referencia" on={v=>setForm({...form,balanceReference:v})}/><Select v={form.status} on={v=>setForm({...form,status:v})} opts={['En la tienda','Enviado','Proceso','Entregado'].map(x=>[x,x])}/><Select v={form.labPayment} on={v=>setForm({...form,labPayment:v})} opts={['No pago','Pago'].map(x=>[x,x])}/><Input v={form.sentDate} p="Fecha de enviado" type="date" on={v=>setForm({...form,sentDate:v})}/><Input v={form.deliveredDate} p="Fecha de entregado" type="date" on={v=>setForm({...form,deliveredDate:v})}/><Input v={form.opticalAmount} p="Monto laboratorio" type="number" on={v=>setForm({...form,opticalAmount:v})}/><Select v={form.notifiedClient} on={v=>setForm({...form,notifiedClient:v})} opts={[["No","No se notifico"],["Si","Si se notifico"]]}/><Select v={form.warranty} on={v=>setForm({...form,warranty:v})} opts={[["No","Sin garantia"],["Si","Con garantia"]]}/><Input v={form.notes} p="Observaciones" on={v=>setForm({...form,notes:v})}/><button onClick={save}><Save size={16}/>{editing?'Guardar cambios':'Guardar orden'}</button></div></Card><Card title="Ordenes registradas" wide><div className="orderList">{orders.map(o=><div className="order" key={o.id}><div><b>{o.number}</b><span>{o.customer} | Tel: {o.phone} | Lab: {o.lab} | Resta {money(o.balance)}</span><span>Cristal: {o.lens||'N/A'} | Tratamiento: {o.treatment||'N/A'} | Garantia: {o.warranty}</span><span>Enviado: {o.sentDate||'-'} | Entregado: {o.deliveredDate||'-'} | Notificado: {o.notifiedClient}</span></div><div className="rowActions"><select value={o.status} onChange={e=>quickStatus(o.id,e.target.value)}>{['En la tienda','Enviado','Proceso','Entregado'].map(s=><option key={s}>{s}</option>)}</select><button className="mini secondary" onClick={()=>edit(o)}><Pencil size={13}/>Editar</button><button className="mini danger" onClick={()=>remove(o.id)}><Trash2 size={13}/>Eliminar</button></div></div>)}</div></Card></div>;
}

function Laboratories({labs,orders,setList}){const [selected,setSelected]=useState(labs[0]?.name||'Novak');const [form,setForm]=useState({name:'',phone:'',notes:''});const filtered=orders.filter(o=>o.lab===selected);const addLab=()=>{if(!form.name)return alert('Nombre obligatorio');setList('laboratories',list=>[...list,{...form,id:uid()}]);setSelected(form.name);setForm({name:'',phone:'',notes:''});};const removeLab=id=>{if(confirm('Eliminar laboratorio? Las ordenes no se eliminan.'))setList('laboratories',list=>list.filter(l=>l.id!==id));};return <div className="stack"><Card title="Laboratorios" wide><div className="tabs">{labs.map(l=><button key={l.id} onClick={()=>setSelected(l.name)} className={selected===l.name?'active':''}>{l.name}</button>)}</div><div className="formGrid"><Input v={form.name} p="Nuevo laboratorio" on={v=>setForm({...form,name:v})}/><Input v={form.phone} p="Telefono/contacto" on={v=>setForm({...form,phone:v})}/><Input v={form.notes} p="Observaciones" on={v=>setForm({...form,notes:v})}/><button onClick={addLab}>Agregar laboratorio</button></div></Card><div className="grid"><KPI label={`Ordenes en ${selected}`} value={filtered.length}/><KPI label="Pendientes" value={filtered.filter(o=>o.status!=='Entregado').length}/><KPI label="Pagadas" value={filtered.filter(o=>o.labPayment==='Pago').length}/><KPI label="Monto lab." value={money(filtered.reduce((a,o)=>a+Number(o.opticalAmount||0),0))}/></div><Card title={`Ordenes de ${selected}`} wide><Table rows={filtered} columns={[["number","Orden"],["customer","Cliente"],["status","Estatus"],["labPayment","Pago"],["sentDate","Enviado"],["deliveredDate","Entregado"],["opticalAmount","Monto",money],["notifiedClient","Notificado"],["notes","Observaciones"]]}/></Card><Card title="Administrar laboratorios" wide><Table rows={labs} columns={[["name","Laboratorio"],["phone","Contacto"],["notes","Notas"],["actions","Acciones",(_,r)=><button className="mini danger" onClick={()=>removeLab(r.id)}>Eliminar</button>]]}/></Card></div>}
function Customers({customers,setList}){const blank={name:'',phone:'',notes:''};const [form,setForm]=useState(blank);const [editing,setEditing]=useState(null);const save=()=>{if(!form.name)return alert('Nombre obligatorio');if(editing)setList('customers',list=>list.map(c=>c.id===editing?{...form,id:editing}:c));else setList('customers',list=>[...list,{...form,id:uid()}]);setForm(blank);setEditing(null);};const edit=c=>{setEditing(c.id);setForm({...c});};const remove=id=>{if(confirm('Eliminar cliente?'))setList('customers',list=>list.filter(c=>c.id!==id));};return <div className="stack"><Card title={editing?'Editar cliente':'Nuevo cliente'}><div className="formGrid"><Input v={form.name} p="Nombre" on={v=>setForm({...form,name:v})}/><Input v={form.phone} p="Telefono" on={v=>setForm({...form,phone:v})}/><Input v={form.notes} p="Observaciones" on={v=>setForm({...form,notes:v})}/><button onClick={save}>{editing?'Guardar':'Agregar cliente'}</button></div></Card><Card title="Clientes" wide><Table rows={customers} columns={[["name","Nombre"],["phone","Telefono"],["notes","Notas"],["actions","Acciones",(_,r)=><div className="rowActions"><button className="mini secondary" onClick={()=>edit(r)}>Editar</button><button className="mini danger" onClick={()=>remove(r.id)}>Eliminar</button></div>]]}/></Card></div>}
function Expenses({expenses,setList}){const [form,setForm]=useState({date:today(),category:'Operativo',description:'',amount:''});const [editing,setEditing]=useState(null);const save=()=>{if(!form.description)return alert('Descripcion obligatoria');if(editing)setList('expenses',l=>l.map(e=>e.id===editing?{...form,id:editing,amount:+form.amount}:e));else setList('expenses',l=>[...l,{...form,id:uid(),amount:+form.amount}]);setForm({date:today(),category:'Operativo',description:'',amount:''});setEditing(null);};const remove=id=>{if(confirm('Eliminar gasto?'))setList('expenses',l=>l.filter(e=>e.id!==id));};return <div className="stack"><Card title={editing?'Editar gasto':'Registrar gasto'}><div className="formGrid"><Input v={form.date} p="Fecha" type="date" on={v=>setForm({...form,date:v})}/><Input v={form.category} p="Categoria" on={v=>setForm({...form,category:v})}/><Input v={form.description} p="Descripcion" on={v=>setForm({...form,description:v})}/><Input v={form.amount} p="Monto" type="number" on={v=>setForm({...form,amount:v})}/><button onClick={save}>Guardar gasto</button></div></Card><Card title="Gastos" wide><Table rows={expenses} columns={[["date","Fecha"],["category","Categoria"],["description","Descripcion"],["amount","Monto",money],["actions","Acciones",(_,r)=><div className="rowActions"><button className="mini secondary" onClick={()=>{setEditing(r.id);setForm({...r})}}>Editar</button><button className="mini danger" onClick={()=>remove(r.id)}>Eliminar</button></div>]]}/></Card></div>}
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
      <div className="statusBox"><b>{settings.versionTitle || 'Version 4'}</b><span>{settings.versionDescription || 'Caja diaria mejorada y logo editable.'}</span></div>
    </Card>
  </div>
}

function Reports({store,stats}){const inventoryCost=store.products.reduce((a,p)=>a+Number(p.stock||0)*Number(p.cost||0),0);const inventorySale=store.products.reduce((a,p)=>a+Number(p.stock||0)*Number(p.price||0),0);return <div className="grid"><KPI label="Valor inventario costo" value={money(inventoryCost)}/><KPI label="Valor inventario venta" value={money(inventorySale)}/><KPI label="Saldos por cobrar" value={money(stats.pendingBalances)}/><KPI label="Productos activos" value={store.products.length}/><Card title="Resumen version 3" wide><p>Esta version agrega edicion, eliminacion, ajuste de stock, anulacion de ventas y administracion basica de laboratorios.</p></Card></div>}

createRoot(document.getElementById('root')).render(<App />);
