const form=document.getElementById('briefForm');
const status=document.getElementById('status');

const STORAGE='dvoe_brief_v02_draft';
const SUBMISSION_STORAGE='dvoe_brief_v021_submission_id';
const CREATED_STORAGE='dvoe_brief_v021_created_at';

const ENDPOINT = 'https://api.dvoe-wedding.ru/api/brief';

function controls(){
  return [...form.querySelectorAll('input[name],textarea[name],select[name]')]
    .filter(el=>!el.name.startsWith('_'));
}

function saveDraft(){
  const draft={};

  for(const el of controls()){
    if(el.type==='checkbox'||el.type==='radio'){
      if(!draft[el.name]) draft[el.name]=[];
      if(el.checked) draft[el.name].push(el.value||'on');
    }else{
      draft[el.name]=el.value;
    }
  }

  localStorage.setItem(STORAGE,JSON.stringify(draft));
}

function restoreDraft(){
  let draft;

  try{
    draft=JSON.parse(localStorage.getItem(STORAGE)||'null');
  }catch{}

  if(!draft) return;

  for(const el of controls()){
    const value=draft[el.name];

    if(el.type==='checkbox'||el.type==='radio'){
      el.checked=Array.isArray(value)&&value.includes(el.value||'on');
    }else if(typeof value==='string'){
      el.value=value;
    }
  }
}

function makeSubmissionId(){
  if(window.crypto&&typeof crypto.randomUUID==='function'){
    return 'DVOE-'+crypto.randomUUID();
  }

  return 'DVOE-'+
    Date.now().toString(36).toUpperCase()+'-'+
    Math.random().toString(36).slice(2,12).toUpperCase();
}

function getSubmissionId(){
  let id=localStorage.getItem(SUBMISSION_STORAGE);

  if(!id){
    id=makeSubmissionId();
    localStorage.setItem(SUBMISSION_STORAGE,id);
  }

  return id;
}

function getCreatedAt(){
  let createdAt=localStorage.getItem(CREATED_STORAGE);

  if(!createdAt){
    createdAt=new Date().toISOString();
    localStorage.setItem(CREATED_STORAGE,createdAt);
  }

  return createdAt;
}

function getAnswers(){
  const answers={};

  for(const el of controls()){
    if(el.type==='checkbox'||el.type==='radio'){
      if(el.checked){
        if(!Array.isArray(answers[el.name])){
          answers[el.name]=[];
        }

        answers[el.name].push(el.value||'Да');
      }
    }else if(el.value.trim()){
      answers[el.name]=el.value.trim();
    }
  }

  return answers;
}

function payload(){
  return {
    submissionId:getSubmissionId(),
    createdAt:getCreatedAt(),
    answers:getAnswers()
  };
}

function showSuccess(){
  localStorage.removeItem(STORAGE);
  localStorage.removeItem(SUBMISSION_STORAGE);
  localStorage.removeItem(CREATED_STORAGE);

  document.body.innerHTML=`
    <main class="success-page">
      <div class="success-card">
        <div class="mark">ДВОЕ</div>
        <div class="success-heart">♡</div>
        <p class="eyebrow">БРИФ УСПЕШНО ОТПРАВЛЕН</p>

        <h1>Спасибо, что выбрали нас</h1>

        <p class="lead">
          Мы получили ваши ответы и уже можем познакомиться
          с вашей историей чуть ближе.
        </p>

        <p class="success-note">
          Внимательно изучим бриф и скоро вернёмся к вам
          в переписке Авито.
        </p>

        <div class="success-sign">
          До скорого,<br>
          <b>«Двое»</b>
        </div>
      </div>
    </main>
  `;

  window.scrollTo(0,0);

  // Не используем ?sent=1:
  // экран успеха появляется только после подтверждения backend.
  history.replaceState(null,'',location.pathname);
}

restoreDraft();

form.addEventListener('input',saveDraft);
form.addEventListener('change',saveDraft);

form.addEventListener('submit',async(e)=>{
  e.preventDefault();

  if(!form.reportValidity()) return;

  saveDraft();

  const btn=form.querySelector('button');

  btn.disabled=true;
  btn.textContent='Отправляем…';

  status.textContent=
    'Отправляем бриф… Пожалуйста, не закрывайте страницу.';

  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),15000);

  try{
    const res=await fetch(ENDPOINT,{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Accept':'application/json'
      },
      body:JSON.stringify(payload()),
      signal:controller.signal
    });

    let data={};

    try{
      data=await res.json();
    }catch{}

    if(!res.ok||data.ok!==true){
      throw new Error(data.detail||'send_failed');
    }

    clearTimeout(timer);

    showSuccess();

  }catch(err){
    clearTimeout(timer);

    btn.disabled=false;
    btn.textContent='Повторить отправку';

    status.textContent=
      'Не удалось подтвердить отправку. Ваши ответы сохранены на этом устройстве. Проверьте интернет и нажмите «Повторить отправку».';
  }
});
