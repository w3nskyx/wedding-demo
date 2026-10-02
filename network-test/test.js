const resources=[
  {name:"Основной CSS",url:"../styles.css"},
  {name:"Основной JS",url:"../app.js"},
  {name:"Конфигурация",url:"../config.js"},
  {name:"Фото 1",url:"../assets/images/wedding_registry.jpg",image:true},
  {name:"Фото 2",url:"../assets/images/kaliningrad_us.jpg",image:true},
  {name:"Фото 3",url:"../assets/images/proposal.jpg",image:true},
  {name:"Фото 4",url:"../assets/images/wedding_kazan.jpg",image:true},
  {name:"Фото 5",url:"../assets/images/belarus_flowers.jpg",image:true}
];

const results=document.getElementById("results");
const gallery=document.getElementById("gallery");
const summaryDot=document.getElementById("summaryDot");
const summaryTitle=document.getElementById("summaryTitle");
const summaryText=document.getElementById("summaryText");
const rerun=document.getElementById("rerun");

function fmtBytes(n){
  if(n<1024)return n+" Б";
  if(n<1024*1024)return (n/1024).toFixed(1)+" КБ";
  return (n/1024/1024).toFixed(2)+" МБ";
}

function row(item,status,meta){
  const el=document.createElement("div");
  el.className="row";
  el.innerHTML='<div><div class="name">'+item.name+'</div><div class="meta">'+meta+'</div></div><span class="badge '+status+'">'+(status==="ok"?"OK":"ОШИБКА")+'</span>';
  results.appendChild(el);
}

async function testOne(item,stamp){
  const started=performance.now();
  try{
    const join=item.url.includes("?")?"&":"?";
    const res=await fetch(item.url+join+"nettest="+stamp,{cache:"no-store"});
    if(!res.ok)throw new Error("HTTP "+res.status);
    const blob=await res.blob();
    return {ok:true,ms:Math.round(performance.now()-started),bytes:blob.size};
  }catch(err){
    return {ok:false,ms:Math.round(performance.now()-started),error:String(err&&err.message||err)};
  }
}

function loadImage(item,stamp){
  const box=document.createElement("div");
  box.className="shot";
  const img=document.createElement("img");
  const label=document.createElement("span");
  label.textContent=item.name+" · загрузка…";
  const join=item.url.includes("?")?"&":"?";
  img.onload=()=>label.textContent=item.name+" · OK";
  img.onerror=()=>label.textContent=item.name+" · ОШИБКА";
  img.src=item.url+join+"imgtest="+stamp;
  box.append(img,label);
  gallery.appendChild(box);
}

async function run(){
  const stamp=Date.now();
  results.innerHTML="";
  gallery.innerHTML="";
  summaryDot.className="dot pending";
  summaryTitle.textContent="Проверяю ресурсы…";
  summaryText.textContent="VPN должен быть выключен. Ждём ответы GitHub Pages.";
  rerun.disabled=true;

  resources.filter(x=>x.image).forEach(x=>loadImage(x,stamp));

  let okCount=0;
  for(const item of resources){
    const r=await testOne(item,stamp);
    if(r.ok){
      okCount++;
      row(item,"ok",r.ms+" мс · "+fmtBytes(r.bytes));
    }else{
      row(item,"bad",r.ms+" мс · "+r.error);
    }
  }

  const total=resources.length;
  if(okCount===total){
    summaryDot.className="dot ok";
    summaryTitle.textContent="Все "+total+" ресурсов загрузились";
    summaryText.textContent="На этом хостинге сеть смогла получить полный набор файлов.";
  }else{
    summaryDot.className="dot bad";
    summaryTitle.textContent="Загрузилось "+okCount+" из "+total;
    summaryText.textContent="Есть пропавшие или оборванные запросы. Сделайте скрин результата.";
  }
  rerun.disabled=false;
}

rerun.addEventListener("click",run);
run();