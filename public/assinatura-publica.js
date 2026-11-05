import {doc,getDoc,updateDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"\x27]/g,c=>{if(c==="&")return "&amp;";if(c==="<")return "&lt;";if(c===">")return "&gt;";if(c===String.fromCharCode(34))return "&quot;";return "&#39;";});
let db=null,lastToken="",fingerMoved=false,signing=false,requestVersion=0;
const tokenFromHash=()=>{const match=location.hash.match(/^#assinar=([0-9a-f]{48})$/);return match?.[1]||null;};
const digest=async s=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,"0")).join("");
export function isPublicSigningRoute(){return location.hash.startsWith("#assinar=");}
export function setupPublicSigning(options){
 db=options.db;
 const root=document.createElement("div");root.id="signature-public-root";root.hidden=true;document.body.appendChild(root);
 window.addEventListener("hashchange",renderPublicSigning);
 renderPublicSigning();
}
export async function renderPublicSigning(){
 if(!db)return;
 const root=$("#signature-public-root");
 const active=isPublicSigningRoute();
 root.hidden=!active;
 document.body.classList.toggle("signature-public-active",active);
 if(!active){lastToken="";return;}
 // Native modal dialogs remain in the top layer when navigating within the SPA.
 // Close private dialogs before displaying a personal signing link.
 document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());
 const seq=++requestVersion,token=tokenFromHash();
 if(!token){root.innerHTML='<main class="sign-guest-card"><h1>Link de assinatura inválido</h1><p>Solicite um link individual ao responsável de SST.</p></main>';return;}
 if(lastToken===token&&root.querySelector("canvas"))return;
 lastToken=token;root.innerHTML='<main class="sign-guest-card"><h1>Carregando solicitação de assinatura…</h1></main>';
 try{
  const snap=await getDoc(doc(db,"assinaturaConvites",token));
  if(seq!==requestVersion)return;
  if(!snap.exists())throw Error("Convite não encontrado.");
  const r=snap.data();
  const signed=!!r.assinadoEm;
  root.innerHTML='<main class="sign-guest-card">'+
   '<header class="sign-guest-head"><span class="sign-guest-shield">✓</span><div><strong>TECHNET SST</strong><small>Registro eletrônico de presença</small></div></header>'+
   '<div class="sign-guest-tag">ASSINATURA INDIVIDUAL · LINK PRIVADO</div><h1>'+esc(r.titulo)+'</h1>'+
   '<p class="sign-guest-description">Confirmação de participação na atividade de SST identificada abaixo.</p>'+
   '<dl class="sign-guest-summary"><div><dt>Assunto</dt><dd>'+esc(r.tema)+'</dd></div><div><dt>Data</dt><dd>'+esc(r.data)+'</dd></div><div><dt>Unidade</dt><dd>'+esc(r.unidade||"—")+'</dd></div><div><dt>Referência</dt><dd>'+esc(r.referencia||"—")+'</dd></div><div><dt>Participante</dt><dd><strong>'+esc(r.nome)+'</strong></dd></div></dl>'+
   (signed?'<div class="sign-guest-success"><strong>Presença confirmada</strong><p>Esta solicitação já possui assinatura registrada. Não é possível alterar ou assinar novamente com este link.</p></div>':
   '<p class="sign-guest-note">A pessoa identificada abaixo deve assinar pessoalmente. Não assine por outra pessoa nem compartilhe este link.</p>'+
   '<label class="sign-guest-check"><input id="sign-identidade" type="checkbox"> Confirmo que sou <strong>'+esc(r.nome)+'</strong> e participei da atividade descrita.</label>'+
   '<label class="sign-guest-check"><input id="sign-consentimento" type="checkbox"> Concordo em registrar minha manifestação de presença por assinatura eletrônica simples.</label>'+
   '<label class="sign-guest-canvas-label" for="sign-draw">Assine com o dedo, caneta ou mouse</label>'+
   '<div class="sign-guest-pad"><canvas id="sign-draw" width="720" height="240" aria-label="Área para desenhar assinatura eletrônica"></canvas><span class="sign-guest-baseline">ASSINATURA DO PARTICIPANTE</span></div>'+
   '<div class="sign-guest-buttons"><button id="sign-clear" type="button" class="btn btn-muted">Limpar assinatura</button><button id="sign-save" type="button" class="btn btn-primary">Confirmar assinatura</button></div>'+
   '<p id="sign-feedback" role="status"></p>')+
   '<footer class="sign-guest-footer">Esta coleta registra aceite, representação gráfica e horário do servidor. Não é assinatura com certificado ICP-Brasil.</footer></main>';
  if(!signed){
   bindCanvas($("#sign-draw"));
   $("#sign-clear").addEventListener("click",()=>{const c=$("#sign-draw");c.getContext("2d").clearRect(0,0,c.width,c.height);fingerMoved=false;});
   $("#sign-save").addEventListener("click",()=>confirmSignature(token,r));
  }
 }catch(err){console.error("Abrir assinatura",err);root.innerHTML='<main class="sign-guest-card"><h1>Não foi possível abrir a assinatura</h1><p>Verifique o link ou solicite outro ao administrador de SST.</p></main>';}
}
function bindCanvas(canvas){
 const ctx=canvas.getContext("2d");ctx.strokeStyle="#102b48";ctx.lineWidth=3.5;ctx.lineCap="round";ctx.lineJoin="round";
 let drawing=false,points=0;
 const at=e=>{const rect=canvas.getBoundingClientRect();return {x:(e.clientX-rect.left)*canvas.width/rect.width,y:(e.clientY-rect.top)*canvas.height/rect.height};};
 canvas.addEventListener("pointerdown",e=>{canvas.setPointerCapture(e.pointerId);drawing=true;points=0;const p=at(e);ctx.beginPath();ctx.moveTo(p.x,p.y);});
 canvas.addEventListener("pointermove",e=>{if(!drawing)return;const p=at(e);ctx.lineTo(p.x,p.y);ctx.stroke();if(++points>3)fingerMoved=true;});
 const up=()=>{drawing=false;ctx.closePath();};
 canvas.addEventListener("pointerup",up);canvas.addEventListener("pointercancel",up);
}
async function confirmSignature(token,invite){
 if(signing)return;
 const feedback=$("#sign-feedback"),submit=$("#sign-save"),canvas=$("#sign-draw");
 if(!$("#sign-identidade").checked||!$("#sign-consentimento").checked){feedback.textContent="Confirme sua identidade e o aceite para prosseguir.";return;}
 if(!fingerMoved){feedback.textContent="Desenhe sua assinatura antes de confirmar.";return;}
 const image=canvas.toDataURL("image/png");
 if(image.length>75000){feedback.textContent="Assinatura muito grande; use Limpar assinatura e tente novamente.";return;}
 signing=true;submit.disabled=true;feedback.textContent="Registrando assinatura…";
 try{
  const hash=await digest(image);
  await updateDoc(doc(db,"assinaturaConvites",token),{
   assinaturaData:image,assinaturaNome:invite.nome,hashAssinatura:hash,
   aceite:true,assinadoEm:serverTimestamp()
  });
  feedback.textContent="Assinatura registrada. Obrigado!";
  lastToken="";await renderPublicSigning();
 }catch(err){
  console.error("Assinar",err);
  feedback.textContent="Não foi possível registrar. A solicitação pode já ter sido assinada ou encerrada. Recarregue o link.";
  submit.disabled=false;
 }finally{signing=false;}
}
