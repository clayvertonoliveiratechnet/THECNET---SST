import {collection,doc,getDoc,getDocs,writeBatch} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Importação local e autenticada: os dados pessoais nunca entram no código público.
const ID_INDICADOR="indicadores-acidentes-sst-2026";
const REGIOES=new Set(["cabeca","olhos","pescoco","ombro","torax","abdomen","costas","coluna","braco","antebraco","mao","quadril","coxa","joelho","perna","pe"]);
const $=s=>document.querySelector(s);
const safe=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let services,selected=null,importing=false;

export function renderAccidentImportButton(role){
 return role==="admin"
  ?'<button type="button" class="btn btn-muted" id="sst-open-import-acidentes">Importar indicadores 2026</button>'
  :"";
}
export function getAccidentSummary(evidencias){
 return (evidencias||[]).find(x=>x.id===ID_INDICADOR&&x.indicadoresSst)?.indicadoresSst||null;
}
export function renderAccidentIndicators(evidencias){
 const all=evidencias||[];
 const item=all.find(x=>x.id===ID_INDICADOR&&x.indicadoresSst);
 if(!item)return "";
 const s=item.indicadoresSst;
 const nf=new Intl.NumberFormat("pt-BR"),dec=new Intl.NumberFormat("pt-BR",{maximumFractionDigits:2});
 const metric=(value,label)=>'<div><strong>'+safe(value)+'</strong><span>'+safe(label)+'</span></div>';
 return '<section class="card sst-indicadores-2026"><div><span class="eyebrow">INDICADORES DE ACIDENTES · PLANILHA 2026</span><h2>Acidentes e horas-homem trabalhadas</h2><p>Valores extraídos da planilha informada pela equipe SST. Para o mapa corporal, as regiões são vinculadas aos registros importados.</p></div><div class="sst-indicadores-grid">'+
 metric(s.acidentes,"Acidentes")+metric(s.comAfastamento,"Com afastamento")+metric(s.semAfastamento,"Sem afastamento")+
 metric(nf.format(s.hht),"HHT informada")+metric(dec.format(s.frequencia),"Taxa de frequência (TF)")+metric(dec.format(s.gravidade),"Taxa de gravidade (TG)")+
 metric(s.diasPerdidosMaisDebitados,"Dias perdidos + debitados")+metric(dec.format(100*s.indiceAfastamento)+"%","Índice de afastamento")+'</div>'+
 '<p class="sst-indicadores-foot">Fonte: '+safe(item.fonteImportacao||"Planilha de indicadores")+
 '. TF e TG seguem os critérios da planilha. Atenção: 1 acidente tem dias perdidos em branco e 1 caso possui a indicação “Múltiplas partes”, sem regiões específicas.</p></section>';
}
function validate(raw){
 if(!raw||raw.schema!=="technet-sst-acidentes-import-v1")throw Error("Formato de importação não reconhecido.");
 if(!Array.isArray(raw.acidentes)||raw.acidentes.length<1||raw.acidentes.length>100)throw Error("Número de acidentes fora do limite.");
 if(!Array.isArray(raw.hhtMensal)||raw.hhtMensal.length>100)throw Error("HHT inválida.");
 if(raw.indicadores?.ano!==2026)throw Error("Ano dos indicadores não corresponde à importação 2026.");
 const known=new Set();
 for(const r of raw.acidentes){
  if(!/^planilha-acidentes-sst-2026-\d{3}$/.test(String(r.id)))throw Error("Identificador inválido.");
  if(known.has(r.id))throw Error("Há identificadores repetidos.");
  known.add(r.id);
  if(!/^2026-\d{2}-\d{2}$/.test(String(r.data))||!r.titulo||!r.colaborador)throw Error("Registro incompleto.");
  if(!Array.isArray(r.partesCorpo)||r.partesCorpo.some(v=>!REGIOES.has(v)))throw Error("Região corporal não reconhecida.");
  if(r.diasPerdidos!==null&&(!Number.isInteger(r.diasPerdidos)||r.diasPerdidos<0))throw Error("Dias perdidos inválidos.");
 }
 if(raw.acidentes.length!==raw.indicadores.acidentes)throw Error("Total de acidentes diferente dos registros.");
 if(raw.hhtMensal.reduce((n,r)=>n+(Number(r.hht)||0),0)!==raw.indicadores.hht)throw Error("HHT não confere com o resumo.");
 return raw;
}
function renderPreview(raw,found){
 const lines=raw.acidentes.length;
 const personal=raw.acidentes.filter(r=>r.colaborador).length;
 const mapped=raw.acidentes.filter(r=>r.partesCorpo.length>0).length;
 $("#sst-import-preview").innerHTML='<strong>Arquivo validado</strong><p>'+lines+' acidentes; '+raw.hhtMensal.length+' registros de HHT; '+mapped+' acidentes com regiões definidas; '+personal+' registros com nomes de colaboradores.</p><p><b>'+found+' ocorrência(s) já cadastrada(s)</b> serão ignoradas para evitar duplicatas. Os novos registros serão gravados no Firestore, acessíveis somente a contas autorizadas.</p><p>As informações não serão publicadas no GitHub. Revise os casos de múltiplas partes e os dias perdidos não informados após importar.</p>';
 $("#sst-import-commit").disabled=false;
}
function msg(m,error=false){const el=$("#sst-import-message");if(el){el.textContent=m;el.classList.toggle("is-error",error);}}
function sameAccident(a,b){
 const person=v=>String(v??"").trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 return a.data===b.data && person(a.colaborador||a.responsavel)===person(b.colaborador||b.responsavel) &&
 person(a.unidade)===person(b.unidade);
}
async function preview(file){
 selected=null;$("#sst-import-commit").disabled=true;$("#sst-import-preview").innerHTML="";
 if(!file)return;
 if(file.size>2*1024*1024){msg("Arquivo maior que 2 MB.",true);return;}
 try{
  const raw=validate(JSON.parse(await file.text()));
  const snap=await getDocs(collection(services.db,"incidentes"));
  const existing=snap.docs.map(d=>({id:d.id,...d.data()}));
  const missing=raw.acidentes.filter(r=>!existing.some(ex=>ex.id===r.id||sameAccident(r,ex)));
  selected={raw,missing,existing:raw.acidentes.length-missing.length};
  renderPreview(raw,selected.existing);
  msg("Conferência concluída. Clique em Confirmar importação para gravar.");
 }catch(err){console.error("Importação SST",err);msg("Arquivo não aceito: "+err.message,true);}
}
async function commitImport(){
 if(importing||!selected||services.getCtx().role!=="admin"||services.getCtx().mode!=="cloud")return;
 importing=true;$("#sst-import-commit").disabled=true;
 try{
  const {raw,missing,existing}=selected, stamp=new Date().toISOString();
  const batch=writeBatch(services.db);
  for(const r of missing)batch.set(doc(services.db,"incidentes",r.id),{...r,criadoEm:stamp,atualizadoEm:stamp});
  const evidenceRef=doc(services.db,"evidencias",ID_INDICADOR);
  const previous=await getDoc(evidenceRef);
  batch.set(evidenceRef,{
   titulo:"Indicadores de acidentes SST — planilha 2026",
   categoria:"Outras evidências",data:"2026-10-02",setor:"SST",responsavel:"Equipe SST",
   referencia:"Indicadores 2026 · HHT, TF e TG",
   observacoes:"Fonte documental: indicadores de acidentes SST 2026. Conserva os cálculos e a HHT informados na planilha; confirmar o caso Múltiplas partes e dias perdidos ausentes.",
   fonteImportacao:raw.origem,hashFonteSha256:raw.hashFonteSha256,
   indicadoresSst:raw.indicadores,hhtMensal:raw.hhtMensal,
   criadoEm:previous.exists()?previous.data().criadoEm:stamp,atualizadoEm:stamp
  });
  await batch.commit();
  msg("Importação concluída: "+missing.length+" acidentes novos, "+existing+" já presentes, 12 registros mensais de HHT e resumo de 2026.");
  services.toast("Indicadores SST importados com sucesso.");
  selected=null;
  await services.afterImport();
 }catch(err){console.error("Erro ao importar",err);msg("Falha ao gravar no Firestore: "+err.message,true);services.toast("Falha na importação SST.",true);}
 finally{importing=false;$("#sst-import-commit").disabled=false;}
}
export function setupAccidentImport(options){
 services=options;
 const dialog=document.createElement("dialog");
 dialog.id="sst-import-dialog";dialog.className="dialog sst-import-dialog";
 dialog.innerHTML='<div class="dialog-head"><div><span class="eyebrow">IMPORTAÇÃO RESTRITA · SST</span><h2>Indicadores de acidentes 2026</h2></div><button type="button" class="icon-button" id="sst-import-close" aria-label="Fechar">×</button></div>'+
 '<p class="sst-import-helper">Selecione o JSON privado preparado a partir de <b>INDICADORES_DE_ACIDENTES-SST.xlsx</b>. Os dados pessoais serão enviados somente ao Firestore protegido, após sua confirmação.</p>'+
 '<input type="file" id="sst-import-file" accept=".json,application/json" aria-label="Selecionar arquivo JSON de indicadores">'+
 '<div class="sst-import-preview" id="sst-import-preview"></div><p class="sst-import-status" id="sst-import-message" role="status"></p>'+
 '<div class="dialog-footer"><button type="button" class="btn btn-muted" id="sst-import-cancel">Cancelar</button><button type="button" class="btn btn-primary" id="sst-import-commit" disabled>Confirmar importação</button></div>';
 document.body.appendChild(dialog);
 document.addEventListener("click",e=>{
  const btn=e.target.closest("#sst-open-import-acidentes");
  if(btn&&services.getCtx().mode==="cloud"&&services.getCtx().role==="admin"){
   selected=null;$("#sst-import-file").value="";$("#sst-import-preview").innerHTML="";
   $("#sst-import-commit").disabled=true;msg("Nenhum arquivo selecionado.");
   dialog.showModal();
  }
 });
 $("#sst-import-close").addEventListener("click",()=>dialog.close());
 $("#sst-import-cancel").addEventListener("click",()=>dialog.close());
 $("#sst-import-file").addEventListener("change",e=>preview(e.target.files?.[0]));
 $("#sst-import-commit").addEventListener("click",commitImport);
}
