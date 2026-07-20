function toggleMenu(btn){
  const m=document.getElementById('menu');
  const open=m.classList.toggle('open');
  btn.setAttribute('aria-expanded',open);
}
document.querySelectorAll('#menu a').forEach(a=>a.addEventListener('click',()=>document.getElementById('menu').classList.remove('open')));

async function sendForm(e){
  e.preventDefault();
  const f=e.target;
  if(!f.checkValidity()){f.reportValidity();return false;}
  const btn=f.querySelector('button[type="submit"]');
  const ok=document.getElementById('form-ok');
  btn.disabled=true; btn.textContent='Wysyłam…';
  try{
    const res=await fetch(f.action,{method:'POST',body:new FormData(f),headers:{'Accept':'application/json'}});
    if(res.ok){
      ok.textContent='Dzięki! Wiadomość wysłana — odezwiemy się w ciągu 24 godzin.';
      ok.style.display='block';
      f.querySelectorAll('input,textarea,button').forEach(el=>el.disabled=true);
    }else{
      ok.textContent='Ups, coś nie zadziałało. Napisz do nas bezpośrednio: biuro@shoprise.pl';
      ok.style.background='#FDECEC'; ok.style.color='#9B2C2C'; ok.style.display='block';
      btn.disabled=false; btn.innerHTML='Wyślij wiadomość <span class="arr">→</span>';
    }
  }catch(err){
    ok.textContent='Brak połączenia. Napisz do nas: biuro@shoprise.pl';
    ok.style.background='#FDECEC'; ok.style.color='#9B2C2C'; ok.style.display='block';
    btn.disabled=false; btn.innerHTML='Wyślij wiadomość <span class="arr">→</span>';
  }
  return false;
}

/* podwojenie zawartości marquee, żeby pętla była płynna */
const mq=document.getElementById('marq');
if(mq){mq.innerHTML+=mq.innerHTML;}

/* reveal */
const io=new IntersectionObserver(es=>{
  es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target);}});
},{threshold:.08,rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
setTimeout(()=>document.querySelectorAll('.reveal:not(.in)').forEach(el=>el.classList.add('in')),1200);
