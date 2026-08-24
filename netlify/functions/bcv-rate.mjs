const BCV_URLS = [
  'https://www.bcv.org.ve/glosario/cambio-oficial',
  'http://www.bcv.org.ve/glosario/cambio-oficial',
  'https://www.bcv.org.ve/estadisticas/tipo-cambio-de-referencia-smc'
];

const parseNumber = value => {
  const cleaned = String(value || '').replace(/\s/g, '');
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
};

const parseBcv = html => {
  const plain = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' ');
  const match = plain.match(/USD\s*([0-9.]+,[0-9]+)/i) || plain.match(/D[oó]lar[^0-9]{0,80}([0-9.]+,[0-9]+)/i);
  if (!match) throw new Error('La página respondió, pero no se encontró el valor USD');
  const rate = parseNumber(match[1]);
  if (!rate || rate <= 0) throw new Error('La tasa obtenida no es válida');
  const dateMatch = plain.match(/Fecha\s*Valor\s*:?\s*([A-Za-zÁÉÍÓÚáéíóúñÑ]+,?\s+\d{1,2}\s+(?:de\s+)?[A-Za-zÁÉÍÓÚáéíóúñÑ]+\s+(?:de\s+)?\d{4})/i);
  const date = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Caracas',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  return { rate, date, sourceDateText:dateMatch?.[1] || '' };
};

const fetchSource = async url => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 18000);
  try {
    const res = await fetch(url, {redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36','accept':'text/html,application/xhtml+xml','accept-language':'es-VE,es;q=0.9'},signal:controller.signal});
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { html:await res.text(), url };
  } finally { clearTimeout(timer); }
};

const response = (status, body) => new Response(JSON.stringify(body), {status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','access-control-allow-origin':'*'}});

export default async () => {
  const errors=[];
  for (const url of BCV_URLS) {
    try {
      const source=await fetchSource(url);
      const parsed=parseBcv(source.html);
      return response(200,{ok:true,rate:parsed.rate,date:parsed.date,sourceDateText:parsed.sourceDateText,source:'BCV',sourceUrl:source.url,checkedAt:new Date().toISOString()});
    } catch (error) {
      errors.push(`${url}: ${error.name==='AbortError'?'tiempo agotado':error.message}`);
    }
  }
  return response(502,{ok:false,error:'No fue posible conectar con el BCV desde Netlify',details:errors,checkedAt:new Date().toISOString()});
};

export const config={path:'/api/bcv-rate'};
