const CONFIG = window.WEDDING_CONFIG || {};
const storageKey = CONFIG.storageKey || 'zhulik_zhulik_rsvp';
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    if (entry.target.classList.contains('stagger-group')) {
      entry.target.querySelectorAll('.stagger').forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), reduced ? 0 : i * 130);
      });
    }
    revealObserver.unobserve(entry.target);
  });
}, {threshold: .12});
document.querySelectorAll('.reveal,.stagger-group,.draw-line').forEach(el => revealObserver.observe(el));

const audio = document.getElementById('bgMusic');
const musicControl = document.getElementById('musicControl');
const musicCopy = document.getElementById('musicCopy');
let playing = false;
musicControl.addEventListener('click', async () => {
  try {
    if (!playing) {
      await audio.play(); playing = true; musicControl.classList.add('playing');
      musicControl.setAttribute('aria-label', 'Поставить музыку на паузу');
      setTimeout(() => musicControl.classList.add('compact'), 1400);
    } else {
      audio.pause(); playing = false; musicControl.classList.remove('playing');
      musicControl.setAttribute('aria-label', 'Включить музыку');
    }
  } catch (e) { musicCopy.textContent = 'Не удалось включить музыку'; }
});
window.addEventListener('scroll', () => { if (window.scrollY > innerHeight * .55) musicControl.classList.add('compact'); }, {passive:true});

const form = document.getElementById('rsvpForm');
const note = document.getElementById('formNote');
const STATE_KEY = `${storageKey}_current`;
function saved(){ try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')}catch{return null} }
function payloadFromForm(){
  const fd=new FormData(form), old=saved();
  return {weddingId:CONFIG.weddingId||'zhulik-zhulik',id:old?.id||(crypto.randomUUID?crypto.randomUUID():String(Date.now())),createdAt:old?.createdAt||new Date().toISOString(),name:fd.get('name'),attendance:fd.get('attendance'),guests:Number(fd.get('guests')||1),food:fd.get('food'),drinks:fd.getAll('drinks'),groomAttitude:fd.get('groomAttitude'),comment:fd.get('comment')||''};
}
function restore(){
  const p=saved(); if(!p)return;
  ['name','guests','comment'].forEach(n=>{if(form.elements[n])form.elements[n].value=p[n]??''});
  ['attendance','food','groomAttitude'].forEach(n=>form.querySelectorAll(`[name="${n}"]`).forEach(el=>el.checked=el.value===p[n]));
  form.querySelectorAll('[name="drinks"]').forEach(el=>el.checked=(p.drinks||[]).includes(el.value));
  note.innerHTML='<strong>Ваш предыдущий ответ восстановлен.</strong> Его можно изменить и отправить снова.';
}
restore();
form.addEventListener('submit',async e=>{
  e.preventDefault(); const btn=form.querySelector('.submit-button'),p=payloadFromForm();
  btn.disabled=true;btn.textContent='ОТПРАВЛЯЕМ…';
  try{
    if(CONFIG.rsvpEndpoint){const r=await fetch(CONFIG.rsvpEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});if(!r.ok)throw new Error(`HTTP ${r.status}`)}
    localStorage.setItem(STATE_KEY,JSON.stringify(p));
    note.classList.add('success');note.innerHTML='<strong>Ответ принят ♡</strong><br><small>Жулик и Жулик ознакомятся с ним после дневного сна.</small>';note.scrollIntoView({behavior:reduced?'auto':'smooth',block:'center'});
  }catch(err){console.error(err);note.textContent='Не получилось отправить ответ. Попробуйте ещё раз.'}
  finally{btn.disabled=false;btn.textContent='ОТПРАВИТЬ ЖУЛИКАМ'}
});
