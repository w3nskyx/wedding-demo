const form=document.getElementById('briefForm');
const status=document.getElementById('status');
const STORAGE='dvoe_brief_v02_draft';
const ENDPOINT='https://formsubmit.co/ajax/kolenka432@icloud.com';

function controls(){return [...form.querySelectorAll('input[name],textarea[name],select[name]')].filter(el=>!el.name.startsWith('_'));}

function saveDraft(){
  const draft={};
  for(const el of controls()){
    if(el.type==='checkbox'||el.type==='radio'){
      if(!draft[el.name]) draft[el.name]=[];
      if(el.checked) draft[el.name].push(el.value||'on');
    }else draft[el.name]=el.value;
  }
  localStorage.setItem(STORAGE,JSON.stringify(draft));
}
function restoreDraft(){
  let draft;try{draft=JSON.parse(localStorage.getItem(STORAGE)||'null')}catch{}
  if(!draft)return;
  for(const el of controls()){
    const v=draft[el.name];
    if(el.type==='checkbox'||el.type==='radio') el.checked=Array.isArray(v)&&v.includes(el.value||'on');
    else if(typeof v==='string') el.value=v;
  }
}
function payload(){
  const out={_subject:'Новый бриф клиента — студия Двое',_template:'table',_captcha:'false',_url:location.href.split('?')[0]};
  for(const el of controls()){
    if(el.type==='checkbox'||el.type==='radio'){
      if(el.checked){
        if(out[el.name]) out[el.name]+='; '+(el.value||'Да');
        else out[el.name]=el.value||'Да';
      }
    }else if(el.value.trim()) out[el.name]=el.value.trim();
  }
  out['ID отправки']='DVOE-'+Date.now().toString(36).toUpperCase();
  return out;
}
function showSuccess(){
  localStorage.removeItem(STORAGE);
  document.body.innerHTML='<main class="success-page"><div class="success-card"><div class="mark">ДВОЕ</div><div class="success-heart">♡</div><p class="eyebrow">БРИФ УСПЕШНО ОТПРАВЛЕН</p><h1>Спасибо, что выбрали нас</h1><p class="lead">Мы получили ваши ответы и уже можем познакомиться с вашей историей чуть ближе.</p><p class="success-note">Внимательно изучим бриф и скоро вернёмся к вам в переписке Авито.</p><div class="success-sign">До скорого,<br><b>«Двое»</b></div></div></main>';
  window.scrollTo(0,0);
  history.replaceState(null,'',location.pathname+'?sent=1');
}
restoreDraft();
form.addEventListener('input',saveDraft);
form.addEventListener('change',saveDraft);

if(new URLSearchParams(location.search).get('sent')==='1') showSuccess();

form.addEventListener('submit',async(e)=>{
  e.preventDefault();
  if(!form.reportValidity())return;
  saveDraft();
  const btn=form.querySelector('button');
  btn.disabled=true;btn.textContent='Отправляем…';
  status.textContent='Отправляем бриф… Пожалуйста, не закрывайте страницу.';
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),25000);
  try{
    const res=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload()),signal:controller.signal});
    let data={};try{data=await res.json()}catch{}
    if(!res.ok||data.success===false)throw new Error(data.message||'send_failed');
    clearTimeout(timer);
    showSuccess();
  }catch(err){
    clearTimeout(timer);
    btn.disabled=false;btn.textContent='Повторить отправку';
    status.innerHTML='Не удалось подтвердить отправку. Ваши ответы сохранены на этом устройстве. Проверьте интернет и нажмите «Повторить отправку».';
  }
});