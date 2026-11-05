import {collection,doc,getDocs,writeBatch,updateDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
let env=null,sessions=[],invites=[],selected=null,busy=false,pdfPromise=null;
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"\x27]/g,c=>{if(c==="&")return "&amp;";if(c==="<")return "&lt;";if(c===">")return "&gt;";if(c===String.fromCharCode(34))return "&quot;";return "&#39;";});
const valid=()=>env?.getCtx().mode==="cloud"&&["admin","supervisor","sst"].includes(env.getCtx().role);
const token=()=>[...crypto.getRandomValues(new Uint8Array(24))].map(b=>b.toString(16).padStart(2,"0")).join("");
const date=s=>s?.split("-").reverse().join("/")||"—";
const digest=async buffer=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",buffer))].map(b=>b.toString(16).padStart(2,"0")).join("");
const participants=text=>{
 const result=[],seen=new Set();
 for(const row of String(text||"").split(/\r?\n/)){
  const [name,...roles]=row.split(";"),nome=String(name||"").trim().slice(0,120);
  const key=nome.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  if(!nome||seen.has(key))continue;
  seen.add(key);result.push({nome,funcao:roles.join(";").trim().slice(0,110)});
 }
 return result;
};
export async function loadSignatureSessions(){
 if(!env)return;
 const r=await getDocs(collection(env.db,"assinaturaSessoes"));
 sessions=r.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.criadoEm?.toMillis?.()||0)-(a.criadoEm?.toMillis?.()||0));
}
export function clearSignatureSessions(){sessions=[];selected=null;invites=[];}
export function renderSignaturePage(){
 return '<section class="page-intro"><div><span class="eyebrow">PRESENÇA DIGITAL · SST</span><h1>Assinaturas eletrônicas</h1><p class="subtitle">Listas de treinamento, DDS, instruções e comprovantes de participação.</p></div><div class="page-actions">'+(valid()?'<button class="btn btn-primary" data-sig-action="new">Criar lista de assinaturas</button>':"")+'</div></section>'+
 '<article class="card sign-info"><strong>Fluxo individual e rastreável</strong><p>Cada participante recebe um link particular para assinar. O sistema registra a representação gráfica, aceite e horário. Assinatura eletrônica simples, sem certificado ICP-Brasil.</p></article>'+
 '<div class="sign-sessions">'+(sessions.length?sessions.map(s=>'<article class="card sign-session"><div class="sign-session-top"><span class="eyebrow">'+esc(s.referencia||"SST")+'</span><span class="status status-green">'+esc(s.status||"Aberta")+'</span></div><h3>'+esc(s.titulo)+'</h3><p>'+esc(s.tema)+'</p><small>'+date(s.data)+' · '+esc(s.unidade)+' · '+Number(s.quantidade||0)+' convidados</small><button class="btn btn-primary" data-sig-action="manage" data-id="'+esc(s.id)+'">Gerenciar assinaturas</button></article>').join(""):'<div class="card sign-empty">Nenhuma lista de assinaturas cadastrada.</div>')+'</div>';
}
export function setupSignatureManager(options){
 env=options;
 for(const id of ["sig-create-dialog","sig-manage-dialog"]){const el=document.createElement("dialog");el.id=id;el.className="dialog sign-modal";document.body.appendChild(el);}
 document.addEventListener("click",async e=>{
  const b=e.target.closest("[data-sig-action]");if(!b)return;
  const a=b.dataset.sigAction;
  if(a==="new")showCreate();
  else if(a==="close-create")$("#sig-create-dialog").close();
  else if(a==="close-manage")$("#sig-manage-dialog").close();
  else if(a==="manage")await manage(b.dataset.id);
  else if(a==="refresh")await manage(selected?.id);
  else if(a==="copy")await copyLink(b.dataset.token);
  else if(a==="close-session")await closeSession();
  else if(a==="pdf")await pdfExport(false);
  else if(a==="stamp")await pdfExport(true);
  else if(a==="use-evidence")fillEvidence($("#sig-from-evidence")?.value);
 });
 $("#sig-create-dialog").addEventListener("submit",saveSession);
 $("#sig-create-dialog").addEventListener("change",async e=>{if(e.target.id==="sig-list-input")await readNamesFile(e.target.files?.[0]);});
}
function showCreate(){
 if(!valid())return;
 const items=env.evidences().filter(x=>x.modalidade==="Coletiva"&&x.totalParticipantes>0);
 $("#sig-create-dialog").innerHTML='<form id="sig-create-form"><div class="dialog-head"><div><span class="eyebrow">NOVA LISTA DE ASSINATURAS</span><h2>Criar solicitação</h2></div><button type="button" class="icon-button" data-sig-action="close-create">×</button></div>'+
 '<div class="sign-form-grid"><label class="wide">Nome da atividade *<input name="titulo" required maxlength="160" placeholder="Treinamento NR-01 – Assédio moral e sexual"></label>'+
 '<label class="wide">Assunto / tema *<input name="tema" required maxlength="160"></label>'+
 '<label>Data *<input name="data" type="date" required value="'+new Date().toISOString().slice(0,10)+'"></label>'+
 '<label>Unidade *<input name="unidade" required maxlength="110"></label>'+
 '<label>Setor<input name="setor" maxlength="110"></label><label>Ministrante / responsável<input name="responsavel" maxlength="130"></label>'+
 '<label>Referência / ação<input name="referencia" maxlength="80" placeholder="SST-195"></label>'+
 '<label class="wide">Participantes (Nome; Função, um por linha) *<textarea id="sig-participants" name="participantes" rows="7" placeholder="Maria Silva; Supervisora&#10;João Santos; Técnico"></textarea></label>'+
 '<label class="wide">Importar participantes em Excel / CSV<input id="sig-list-input" type="file" accept=".xlsx,.xls,.csv"></label>'+
 (items.length?'<label class="wide">Usar lista de uma evidência<select id="sig-from-evidence"><option value="">Selecione</option>'+items.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.titulo)+'</option>').join("")+'</select></label><div class="wide"><button type="button" class="btn btn-muted" data-sig-action="use-evidence">Preencher participantes</button></div>':"")+
 '<label class="wide">PDF original (opcional, para carimbo na exportação)<input id="sig-source" type="file" accept="application/pdf,.pdf"><small>O original não é armazenado. O sistema conserva seu hash e solicita o arquivo novamente para carimbar.</small></label>'+
 '</div><p id="sig-create-status" role="status"></p><div class="dialog-footer"><button type="button" class="btn btn-muted" data-sig-action="close-create">Cancelar</button><button class="btn btn-primary" type="submit" id="sig-create-submit">Criar links individuais</button></div></form>';
 $("#sig-create-dialog").showModal();
}
function fillEvidence(id){
 const e=env.evidences().find(x=>x.id===id);if(!e)return;
 const collaborators=env.collaborators(),list=[
 ...(e.participantesIds||[]).map(id=>collaborators.find(x=>x.id===id)).filter(Boolean).map(x=>({nome:x.titulo,funcao:x.tipo||""})),
 ...(e.participantesAvulsos||[]).map(x=>({nome:x.nome,funcao:x.funcao||""}))
 ];
 $("#sig-participants").value=participants(list.map(x=>x.nome+";"+x.funcao).join("\n")).map(x=>x.nome+"; "+x.funcao).join("\n");
 $("#sig-create-status").textContent=list.length+" pessoas carregadas. Confira antes de criar.";
}
async function readNamesFile(file){
 if(!file)return;try{
  if(file.size>5e6)throw Error("Arquivo maior que 5MB");
  if(!window.XLSX)await new Promise((resolve,reject)=>{const s=document.createElement("script");s.src="./vendor/xlsx.full.min.js";s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});
  const X=window.XLSX,book=X.read(await file.arrayBuffer(),{type:"array",cellDates:true}),rows=X.utils.sheet_to_json(book.Sheets[book.SheetNames[0]],{header:1,defval:"",raw:false});
  const norm=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const h=rows.findIndex(r=>r.some(v=>["nome","nome completo","participante","colaborador"].includes(norm(v))));
  if(h<0)throw Error("Coluna Nome não encontrada");
  const cols=rows[h].map(norm),n=cols.findIndex(x=>["nome","nome completo","participante","colaborador"].includes(x)),f=cols.findIndex(x=>["funcao","cargo"].includes(x));
  $("#sig-participants").value=rows.slice(h+1).filter(row=>row[n]).map(row=>String(row[n]).trim()+"; "+String(f>=0?row[f]||"":"").trim()).join("\n");
  $("#sig-create-status").textContent="Participantes importados. Confira e salve.";
 }catch(err){$("#sig-create-status").textContent="Erro: "+err.message;}
}
async function saveSession(event){
 event.preventDefault();if(!valid()||busy)return;
 const fd=new FormData($("#sig-create-form")),people=participants(fd.get("participantes"));
 if(people.length<1||people.length>100||people.some(x=>x.nome.length<3)){ $("#sig-create-status").textContent="Informe de 1 a 100 participantes, com nomes completos.";return;}
 const file=$("#sig-source").files[0];if(file?.size>15e6){$("#sig-create-status").textContent="PDF acima de 15 MB.";return;}
 busy=true;$("#sig-create-submit").disabled=true;
 try{
  const base=Object.fromEntries(["titulo","tema","data","unidade","setor","responsavel","referencia"].map(k=>[k,String(fd.get(k)||"").trim()]));
  const hash=file?await digest(await file.arrayBuffer()):"";
  const session=doc(collection(env.db,"assinaturaSessoes"));
  const batch=writeBatch(env.db);
  batch.set(session,{...base,status:"Aberta",quantidade:people.length,fonteNome:file?.name||"",fonteHash:hash,criadoEm:serverTimestamp(),criadoPor:env.auth.currentUser.uid});
  people.forEach((p,i)=>batch.set(doc(env.db,"assinaturaConvites",token()),{
   sessaoId:session.id,ordem:i+1,nome:p.nome,funcao:p.funcao,...Object.fromEntries(["titulo","tema","data","unidade","referencia"].map(k=>[k,base[k]])),
   criadoEm:serverTimestamp(),assinadoEm:null,assinaturaNome:"",assinaturaData:null,hashAssinatura:"",aceite:false
  }));
  await batch.commit();
  $("#sig-create-dialog").close();await loadSignatureSessions();env.rerender();env.toast("Lista criada com links pessoais.");
  await manage(session.id);
 }catch(err){console.error("Criar sessão",err);$("#sig-create-status").textContent="Falha ao criar lista: "+err.message;}
 finally{busy=false;$("#sig-create-submit").disabled=false;}
}
async function manage(id){
 if(!valid())return;
 const s=sessions.find(x=>x.id===id);if(!s)return;
 selected=s;const modal=$("#sig-manage-dialog");modal.innerHTML='<h2>Carregando convites…</h2>';if(!modal.open)modal.showModal();
 try{
  const snap=await getDocs(collection(env.db,"assinaturaConvites"));
  invites=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.sessaoId===id).sort((a,b)=>a.ordem-b.ordem);
  const done=invites.filter(x=>x.assinadoEm).length;
  modal.innerHTML='<div class="dialog-head"><div><span class="eyebrow">'+esc(s.referencia)+'</span><h2>'+esc(s.titulo)+'</h2></div><button class="icon-button" type="button" data-sig-action="close-manage">×</button></div>'+
  '<p class="sign-description">'+esc(s.tema)+' · '+date(s.data)+' · '+esc(s.unidade)+'</p>'+
  '<div class="sign-counts"><div><b>'+invites.length+'</b><span>Participantes</span></div><div><b>'+done+'</b><span>Assinados</span></div><div><b>'+(invites.length-done)+'</b><span>Pendentes</span></div></div>'+
  '<div class="sign-table-scroll"><table class="lib-table"><thead><tr><th>#</th><th>Participante</th><th>Status</th><th>Link</th></tr></thead><tbody>'+
  invites.map(x=>'<tr><td>'+x.ordem+'</td><td><strong>'+esc(x.nome)+'</strong><small>'+esc(x.funcao)+'</small></td><td><span class="status status-'+(x.assinadoEm?"green":"yellow")+'">'+(x.assinadoEm?"Assinado":"Pendente")+'</span></td><td><button type="button" class="btn btn-muted" data-sig-action="copy" data-token="'+esc(x.id)+'">Copiar link</button></td></tr>').join("")+
  '</tbody></table></div><div class="sign-report-actions"><button type="button" class="btn btn-muted" data-sig-action="refresh">Atualizar status</button><button type="button" class="btn btn-primary" data-sig-action="pdf">Baixar PDF consolidado</button>'+(s.status==="Aberta"?'<button type="button" class="btn btn-muted" data-sig-action="close-session">Encerrar coleta</button>':"")+'</div>'+
  '<div class="sign-report-actions"><label>PDF original (opcional)<input id="sig-original" type="file" accept="application/pdf,.pdf"></label><button type="button" class="btn btn-muted" data-sig-action="stamp">Carimbar PDF original</button></div>'+
  '<p id="sig-manager-status" role="status">Os links são individuais e devem ser encaminhados apenas aos destinatários. Assinaturas registradas não podem ser substituídas.</p>';
 }catch(err){console.error("Carregar convites",err);modal.innerHTML='<h2>Falha ao carregar convites</h2><p>Verifique suas permissões.</p><button type="button" class="btn btn-muted" data-sig-action="close-manage">Fechar</button>';}
}
async function closeSession(){
 if(!selected||!valid()||selected.status!=="Aberta")return;
 if(!window.confirm("Encerrar a coleta? Os links pendentes deixarão de aceitar assinaturas e não será possível reabrir."))return;
 try{
  await updateDoc(doc(env.db,"assinaturaSessoes",selected.id),{status:"Encerrada",encerradoEm:serverTimestamp()});
  await loadSignatureSessions();
  env.rerender();
  await manage(selected.id);
  env.toast("Coleta encerrada. Links pendentes bloqueados.");
 }catch(err){console.error("Encerrar lista",err);$("#sig-manager-status").textContent="Não foi possível encerrar a lista."; }
}
async function copyLink(id){
 if(!invites.some(x=>x.id===id))return;
 const url=location.origin+location.pathname+"#assinar="+id;
 try{await navigator.clipboard.writeText(url);env.toast("Link individual copiado.");}catch{window.prompt("Copie o link:",url);}
}
const print=s=>String(s??"").replace(/[\u2010-\u2015]/g,"-").replace(/[\u2018\u2019]/g,"'");
const when=s=>s?.toDate?.().toLocaleString("pt-BR")||"Pendente";
async function pdfExport(stamp){
 const feedback=$("#sig-manager-status");feedback.textContent="Gerando PDF…";
 try{
  if(!pdfPromise)pdfPromise=new Promise((resolve,reject)=>{const s=document.createElement("script");s.src="./vendor/pdf-lib.min.js";s.onload=()=>resolve(window.PDFLib);s.onerror=reject;document.head.appendChild(s);});
  const P=await pdfPromise,{PDFDocument,StandardFonts,rgb}=P;let doc;
  if(stamp){
   const file=$("#sig-original")?.files[0];if(!file)throw Error("Selecione o PDF original.");
   if(!selected.fonteHash)throw Error("Esta sessão não foi criada com PDF original. Baixe o consolidado.");
   const buffer=await file.arrayBuffer();if(await digest(buffer)!==selected.fonteHash)throw Error("PDF diferente do original: hash não confere.");
   doc=await PDFDocument.load(buffer);
   if(doc.getPageCount()!==2||invites.length>30||!String(selected.fonteNome).includes("NR01"))throw Error("O carimbo no modelo TECHNET NR01 exige exatamente duas páginas e até 30 pessoas.");
   for(const r of invites){
    if(!r.assinadoEm||!r.assinaturaData)continue;
    const page=doc.getPage(r.ordem<=9?0:1),top=r.ordem<=9?548+(r.ordem-1)*25.08:62+(r.ordem-10)*25.08;
    const image=await doc.embedPng(r.assinaturaData);
    page.drawImage(image,{x:421,y:page.getHeight()-top-19,width:127,height:19});
   }
  }else{
   doc=await PDFDocument.create();const font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
   const A4=[595.28,841.89],dark=rgb(.06,.21,.33),muted=rgb(.35,.43,.51);let page=doc.addPage(A4),y=780;
   const text=(t,x,yy,size=10,f=font,color=dark)=>page.drawText(print(t).slice(0,110),{x,y:yy,size,font:f,color});
   const heading=()=>{
    page.drawRectangle({x:32,y:y-1,width:532,height:36,color:dark});
    text("TECHNET  |  LISTA DE PRESENCA ELETRONICA",45,y+12,12,bold,rgb(1,1,1));y-=62;
    text(selected.titulo,34,y,13,bold);y-=20;
    text("Tema: "+selected.tema,34,y,10);y-=18;
    text("Data: "+date(selected.data)+"    Unidade: "+selected.unidade,34,y,10);y-=18;
    text("Referencia: "+selected.referencia+"    Responsavel: "+selected.responsavel,34,y,9);y-=31;
    page.drawRectangle({x:32,y:y-7,width:531,height:22,color:rgb(.9,.94,.96)});
    text("No.",35,y,9,bold);text("Participante / Funcao",67,y,9,bold);text("Assinatura / Registro",348,y,9,bold);y-=27;
   };
   heading();
   for(const r of invites){
    if(y<92){page=doc.addPage(A4);y=780;heading();}
    text(r.ordem,36,y,9,bold);text(r.nome.slice(0,39),67,y,9,bold);text(r.funcao.slice(0,45),67,y-13,7,font,muted);
    if(r.assinadoEm&&r.assinaturaData){
     const png=await doc.embedPng(r.assinaturaData);page.drawImage(png,{x:348,y:y-11,width:140,height:31});
     text(when(r.assinadoEm),350,y-19,7,font,muted);text((r.hashAssinatura||"").slice(0,18),350,y-29,6,font,muted);
    }else text("Pendente",351,y-10,8,font,muted);
    page.drawLine({start:{x:33,y:y-38},end:{x:562,y:y-38},thickness:.5,color:rgb(.82,.88,.91)});y-=48;
   }
   if(y<95){page=doc.addPage(A4);y=780;}
   text("Gerado em: "+new Date().toLocaleString("pt-BR"),34,y-20,8,font,muted);
   text("Assinatura eletrônica simples - nao equivale a certificado ICP-Brasil.",34,y-35,8,font,muted);
  }
  const buffer=await doc.save(),url=URL.createObjectURL(new Blob([buffer],{type:"application/pdf"}));
  const a=document.createElement("a");a.href=url;a.download="TECHNET_SST_ASSINATURAS_"+(selected.referencia||selected.data||"lista").replace(/[^a-z0-9-]/gi,"_")+(stamp?"_ORIGINAL":"")+".pdf";a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
  feedback.textContent="PDF gerado. Arquive a versão final com o controle documental SST.";
 }catch(err){console.error("Exportar PDF",err);feedback.textContent="Erro ao gerar: "+err.message;}
}
