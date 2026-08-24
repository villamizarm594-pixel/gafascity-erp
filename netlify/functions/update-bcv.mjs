const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = process.env.URL;
const CLOUD_STATE_ID = 'gafascity-main';

const json = (status, body) => new Response(JSON.stringify(body), { status, headers:{'content-type':'application/json'} });

export default async () => {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Faltan variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    const rateResponse = await fetch(`${SITE_URL}/api/bcv-rate`, { signal:AbortSignal.timeout(20000) });
    const rateData = await rateResponse.json();
    if (!rateResponse.ok || !rateData.ok) throw new Error(rateData.error || 'No fue posible consultar el BCV');
    const headers = { apikey:SUPABASE_SERVICE_ROLE_KEY, authorization:`Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'content-type':'application/json' };
    const stateResponse = await fetch(`${SUPABASE_URL}/rest/v1/app_state?id=eq.${CLOUD_STATE_ID}&select=data`, { headers });
    if (!stateResponse.ok) throw new Error(`No se pudo leer Supabase (${stateResponse.status})`);
    const rows = await stateResponse.json();
    const state = rows?.[0]?.data || {};
    const settings = { ...(state.settings||{}), exchangeRate:rateData.rate, exchangeRateDate:rateData.date, exchangeRateSource:'BCV', exchangeRateUpdatedAt:rateData.checkedAt, exchangeRateAutomatic:true, exchangeRateSourceDateText:rateData.sourceDateText };
    const updated = { ...state, settings };
    const save = await fetch(`${SUPABASE_URL}/rest/v1/app_state?id=eq.${CLOUD_STATE_ID}`, { method:'PATCH', headers:{...headers,prefer:'return=minimal'}, body:JSON.stringify({data:updated,updated_at:new Date().toISOString()}) });
    if (!save.ok) throw new Error(`No se pudo guardar Supabase (${save.status})`);
    return json(200,{ok:true,rate:rateData.rate,date:rateData.date,source:'BCV'});
  } catch (error) {
    console.error(error);
    return json(500,{ok:false,error:error.message});
  }
};

export const config = { schedule:'30 10,13,16,19 * * 1-5' };
