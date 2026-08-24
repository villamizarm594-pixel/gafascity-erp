const BCV_URL = 'https://www.bcv.org.ve/glosario/cambio-oficial';

const parseNumber = value => {
  const normalized = String(value || '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
};

const parseBcv = html => {
  const plain = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ');
  const usdMatch = plain.match(/USD\s+([0-9.]+,[0-9]+)/i) || plain.match(/D[oó]lar[^0-9]*([0-9.]+,[0-9]+)/i);
  if (!usdMatch) throw new Error('No se encontró la tasa USD en la página del BCV');
  const rate = parseNumber(usdMatch[1]);
  if (!rate || rate <= 0) throw new Error('La tasa BCV obtenida no es válida');
  const dateMatch = plain.match(/Fecha\s*Valor\s*:?\s*([A-Za-zÁÉÍÓÚáéíóúñÑ]+,?\s+\d{1,2}\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]+\s+\d{4})/i);
  const caracasDate = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Caracas',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  return { rate, sourceDateText: dateMatch?.[1] || '', fallbackDate: caracasDate };
};

const response = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' } });

export default async () => {
  try {
    const result = await fetch(BCV_URL, { headers: { 'user-agent':'Mozilla/5.0 GafasCity-BCV/1.0', accept:'text/html' }, signal:AbortSignal.timeout(15000) });
    if (!result.ok) throw new Error(`BCV respondió ${result.status}`);
    const parsed = parseBcv(await result.text());
    return response(200, { ok:true, rate:parsed.rate, date:parsed.fallbackDate, sourceDateText:parsed.sourceDateText, source:'BCV', checkedAt:new Date().toISOString() });
  } catch (error) {
    return response(502, { ok:false, error:error.message, checkedAt:new Date().toISOString() });
  }
};

export const config = { path:'/api/bcv-rate' };
