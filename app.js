const SHOP_ID=31216;
const API=`https://dev123.vishop.pl/panel/shops/${SHOP_ID}`;
const S={shop:null,servers:[],server:null,products:[],product:null,methods:[],qty:1};
const $=x=>document.querySelector(x);
const money=(v,c='PLN')=>new Intl.NumberFormat('pl-PL',{style:'currency',currency:c}).format(Number(v)||0);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(path,opt){const r=await fetch(API+path,opt);let d;try{d=await r.json()}catch{d=await r.text()}if(!r.ok)throw Error(typeof d==='string'?d:(d?.detail||'Błąd API'));return d}
function status(ok,t){$('#status').innerHTML=`<i style="background:${ok?'#29d77d':'#ff1745'}"></i> ${esc(t)}`}
function toast(t){const x=$('#toast');x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),3000)}
function close(){ $('#modal').classList.add('hidden');$('#error').classList.add('hidden') }
function basePrice(p){
 const main=Number(p.main_price);
 if(Number.isFinite(main)&&main>0)return main;
 const entries=Object.entries(p.prices||{});
 const nonSms=entries.find(([k,v])=>v!=null&&!k.endsWith('_sms')&&Number.isFinite(Number(v)));
 if(nonSms)return Number(nonSms[1]);
 return 0;
}

async function init(){
 try{
  S.shop=await api('/');
  document.title=`${S.shop.name||'BADPLAY'} Store`;
  $('#discord').href='https://dc.badplay.pl';
  S.servers=await api('/servers/');
  if(S.servers[0])await selectServer(S.servers[0].id);else $('#products').innerHTML='<div class="empty">Brak dostępnych produktów.</div>';
  try{renderRecent(await api('/latest_payments/?amount=6'))}catch{$('#recent').innerHTML='<div class="empty">Brak danych o ostatnich zakupach.</div>'}
  status(true,'VIshop API online');
 }catch(e){status(false,'VIshop API niedostępne');$('#servers').innerHTML=`<div class="empty">Nie udało się pobrać danych sklepu.<br><small>${esc(e.message)}</small></div>`}
}
function renderServers(){
 const w=$('#servers');w.innerHTML='';
 S.servers.filter(x=>!x.hidden).forEach(s=>{
  const d=document.createElement('div');d.className='server';d.dataset.id=s.id;
  d.innerHTML=`${s.image?`<img src="${esc(s.image)}" onerror="this.style.display='none'">`:''}<div class="server-info"><b>${esc(s.name)}</b><span>${esc(s.ip||'')}</span></div><div class="arrow">›</div>`;
  d.onclick=()=>selectServer(s.id);w.appendChild(d)
 })
}
async function selectServer(id){
 S.server=S.servers.find(x=>x.id==id);
 document.querySelectorAll('.server').forEach(x=>x.classList.toggle('sel',x.dataset.id==id));
 $('#selectedServer').textContent=S.server?.name||'';
 $('#products').innerHTML='<div class="empty">Ładowanie produktów...</div>';
 try{S.products=await api(`/products/?server=${encodeURIComponent(id)}`);renderProducts()}catch(e){$('#products').innerHTML=`<div class="empty">Błąd: ${esc(e.message)}</div>`}
}
function renderProducts(){
 const list=S.products.filter(x=>!x.hidden),w=$('#products');w.innerHTML='';
 if(!list.length){w.innerHTML='<div class="empty">Brak produktów na tym serwerze.</div>';return}
 list.forEach(p=>{
  const d=document.createElement('article');d.className='product';
  d.innerHTML=`${p.promo?`<span class="promo">-${esc(p.promo)}%</span>`:''}<div class="product-img">${p.image?`<img src="${esc(p.image)}" alt="">`:'<img src="assets/badcoin.png" class="product-fallback-img" alt="BADCOIN">'}</div><div class="product-body"><div class="product-name">${esc(p.name)}</div><div class="product-desc">${esc(p.short_description||'')}${p.slider?' • wybór ilości':''}</div><div class="product-bottom"><div class="price">${money(basePrice(p),S.shop.currency)}<small>${p.slider?' / szt.':''}</small></div><button class="buy">KUP TERAZ</button></div></div>`;
  d.querySelector('.buy').onclick=()=>openProduct(p.id);w.appendChild(d)
 })
}
async function openProduct(id){
 try{
  S.product=await api(`/products/${id}/`);
  const all=await api('/payments/');
  S.methods=all.filter(x=>S.product.prices?.[x.provider]!=null);

  $('#mName').textContent=S.product.name;
  $('#mDesc').innerHTML=window.DOMPurify?DOMPurify.sanitize(S.product.description||S.product.short_description||''):esc(S.product.short_description||'');

  $('#sliderBox').classList.toggle('hidden',!S.product.slider);
  if(S.product.slider){
   const q=+S.product.slider_min;
   S.qty=q;
   $('#qty').min=q;
   $('#qty').max=S.product.slider_max;
   $('#qty').value=q;
   $('#min').textContent=q;
   $('#max').textContent=S.product.slider_max;
   $('#qtyValue').textContent=q;
   $('#qtyUnit').textContent=(S.product.slider_name||'BADCOIN').toUpperCase();
   $('#sliderName').textContent=S.product.slider_name||'Ilość';
  }else{
   S.qty=1;
  }

  if(!S.methods.length){
   $('#provider').innerHTML='<option value="">Brak skonfigurowanej metody</option>';
   $('#buy').disabled=true;
   $('#error').textContent='Ten produkt nie ma obecnie skonfigurowanej metody płatności w VIshop. W panelu VIshop → Operatorzy płatności dodaj operatora (np. HotPay), a następnie ustaw cenę tego operatora przy produkcie.';
   $('#error').classList.remove('hidden');
  }else{
   $('#error').classList.add('hidden');
   $('#buy').disabled=false;
   $('#provider').innerHTML=S.methods.map(x=>`<option value="${esc(x.provider)}">${esc(x.name||x.provider)}</option>`).join('');
   const hot=S.methods.find(x=>x.provider==='hotpay_transfer')||S.methods.find(x=>x.provider?.startsWith('hotpay_')&&!x.is_sms);
   if(hot)$('#provider').value=hot.provider;
  }

  $('#rules').classList.toggle('hidden',!S.shop.rules);
  $('#accept').checked=false;
  $('#player').value='';
  update();
  $('#modal').classList.remove('hidden');
  $('#player').focus();
 }catch(e){toast(e.message)}
}
function method(){return S.methods.find(x=>x.provider===$('#provider').value)}
function unit(){
 const m=method();
 if(!m||!S.product)return 0;
 if(m.is_sms||m.provider?.endsWith('_sms')){
  const num=(m.sms_numbers||[]).find(n=>n.id===S.product.prices?.[m.provider]);
  return num?Number(num.price):0;
 }
 return Number(S.product.prices?.[m.provider]||0);
}
function update(){
 if(!S.product)return;
 let total=unit()*(S.product.slider?S.qty:1);
 if(S.product.promo)total*=1-S.product.promo/100;
 $('#qtyValue').textContent=S.qty;
 $('#total').textContent=money(total,S.shop.currency);
}
async function buy(){
 $('#buy').disabled=true;
 $('#error').classList.add('hidden');
 const player=$('#player').value.trim(),m=method();
 if(!/^[A-Za-z0-9_]{3,16}$/.test(player))return fail('Podaj poprawny nick Minecraft (3–16 znaków).');
 if(!m)return fail('Wybierz metodę płatności.');
 if(S.shop.rules&&!$('#accept').checked)return fail('Zaakceptuj regulamin sklepu.');
 if(m.is_sms||m.provider?.endsWith('_sms'))return fail('Płatności SMS wymagają dodatkowego kodu SMS. Wybierz HotPay przelew/BLIK lub inną metodę internetową.');
 try{
  const body={player,provider:m.provider,success_page:location.origin+location.pathname+'?payment={PAYMENT_ID}'};
  if(S.product.slider)body.quantity=parseInt(S.qty,10);
  const r=await fetch(`${API}/products/${S.product.id}/payments/`,{method:'POST',headers:{'Content-Type':'application/json;charset=utf-8'},body:JSON.stringify(body)});
  let d;try{d=await r.json()}catch{d=await r.text()}
  if(!r.ok)throw Error(typeof d==='string'?d:(d?.detail||'Nie udało się utworzyć płatności.'));
  if(d.payment_url)location.href=d.payment_url;else toast('Płatność została utworzona.');
 }catch(e){fail(mapApiError(e.message))}
}
function mapApiError(t){
 const s=String(t||'');
 if(s.includes('Incorrect payment provider'))return 'Wybrana metoda płatności nie jest dostępna dla tego produktu.';
 if(s.includes('Incorrect player name'))return 'Podano nieprawidłowy nick Minecraft.';
 if(s.includes('Incorrect quantity'))return 'Nieprawidłowa ilość produktu.';
 if(s.includes('This shop is offline'))return 'Sklep jest obecnie offline.';
 return s;
}
function fail(t){$('#error').textContent=t;$('#error').classList.remove('hidden');$('#buy').disabled=false}
function renderRecent(items){
 const w=$('#recent');if(!items?.length){w.innerHTML='<div class="empty">Brak ostatnich zakupów.</div>';return}
 w.innerHTML=items.map(x=>`<div class="purchase"><img src="https://mc-heads.net/avatar/${encodeURIComponent(x.player)}/64" alt=""><div><b>${esc(x.player)}</b><span>${esc(x.product_name||'Zakup')} • ${esc(x.quantity||1)} szt.</span></div></div>`).join('')
}
$('#qty').addEventListener('input',e=>{S.qty=+e.target.value;update()});
$('#provider').addEventListener('change',update);$('#buy').addEventListener('click',buy);
document.addEventListener('click',e=>{if(e.target.matches('[data-close]'))close()});
init();




/* BADPLAY voucher — VIshop public API: POST /vouchers/use/ */
document.addEventListener('DOMContentLoaded',()=>{
 const vb=$('#voucherBtn'), vm=$('#voucherModal'), vc=$('#voucherCode'), vp=$('#voucherPlayer');
 const ve=$('#voucherError'), vs=$('#voucherSuccess'), submit=$('#voucherSubmit');
 const closeVoucher=()=>{vm?.classList.add('hidden'); ve?.classList.add('hidden'); vs?.classList.add('hidden');};
 vb?.addEventListener('click',()=>{ve?.classList.add('hidden');vs?.classList.add('hidden');vm?.classList.remove('hidden');setTimeout(()=>vc?.focus(),60)});
 document.querySelectorAll('[data-close-voucher]').forEach(el=>el.addEventListener('click',closeVoucher));
 vc?.addEventListener('input',()=>{vc.value=vc.value.toUpperCase()});
 submit?.addEventListener('click',redeemVoucher);
 vp?.addEventListener('keydown',e=>{if(e.key==='Enter')redeemVoucher()});
 vc?.addEventListener('keydown',e=>{if(e.key==='Enter')vp?.focus()});
 async function redeemVoucher(){
   const code=(vc?.value||'').trim();
   const player=(vp?.value||'').trim();
   ve?.classList.add('hidden'); vs?.classList.add('hidden');
   if(!/^[A-Za-z0-9_-]{3,64}$/.test(code))return voucherError('Wpisz poprawny kod vouchera.');
   if(!/^\.?\w{3,16}$/.test(player))return voucherError('Podaj poprawny nick Minecraft (3–16 znaków).');
   submit.disabled=true; submit.classList.add('loading'); submit.querySelector('span').textContent='SPRAWDZANIE...';
   try{
     const res=await fetch(`${API}/vouchers/use/`,{
       method:'POST',
       headers:{'Content-Type':'application/json;charset=utf-8','Accept':'application/json'},
       body:JSON.stringify({code,player})
     });
     let data; try{data=await res.json()}catch{data=await res.text()}
     if(!res.ok) throw new Error(voucherApiError(data));
     vs?.classList.remove('hidden');
     vc.value=''; vp.value='';
     toast('Voucher został zrealizowany.');
     submit.querySelector('span').textContent='ZREALIZOWANO';
     setTimeout(closeVoucher,1800);
   }catch(err){
     voucherError(err.message||'Nie udało się zrealizować vouchera.');
   }finally{
     submit.disabled=false; submit.classList.remove('loading');
     if(!vs||vs.classList.contains('hidden'))submit.querySelector('span').textContent='REALIZUJ VOUCHER';
   }
 }
 function voucherError(t){if(ve){ve.textContent=t;ve.classList.remove('hidden')}}
 function voucherApiError(data){
   if(typeof data==='string'){
     const s=data.toLowerCase();
     if(s.includes('not found')||s.includes('used')||s.includes('unknown'))return 'Voucher jest nieprawidłowy, wygasł albo został już wykorzystany.';
     if(s.includes('incorrect player'))return 'Podano nieprawidłowy nick Minecraft.';
     return data;
   }
   if(data&&typeof data==='object'){
     const vals=Object.values(data).flat().map(String);
     if(vals.some(x=>/player/i.test(x)))return 'Podano nieprawidłowy nick Minecraft.';
     if(vals.length)return vals.join(' ');
   }
   return 'Voucher jest nieprawidłowy, wygasł albo został już wykorzystany.';
 }
});
