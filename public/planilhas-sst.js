import {collection,doc,getDoc,getDocs,writeBatch} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
let env,preview=null,handle=null,linkedModified=0,watchTimer=null,committing=false;
const $=s=>document.querySelector(s);
const escape=v=>String(v??"").replace(/[&<>"']/g,c=>{if(c==="&")return "&amp;";if(c==="<")return "&lt;";if(c===">")return "&gt;";if(c===String.fromCharCode(34))return "&quot;";return "&#39;";});
const norm=s=>String(s??"").trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const plain=s=>String(s??"").trim();
const unique=items=>[...new Set(items)];
const bodyMap=[
 ["dedos do pe",["pe"]],["tornozelo",["pe"]],["dedos da mao",["mao"]],["mao",["mao"]],
 ["face",["olhos"]],["olho",["olhos"]],["ombro",["ombro"]],["costas / coluna",["costas","coluna"]],
 ["costas",["costas"]],["coluna",["coluna"]],["braco",["braco"]],["perna",["perna"]],["joelho",["joelho"]],["cabeca",["cabeca"]],["pes",["pe"]],["múltiplas partes",[]],["multiplas partes",[]]
];
function mappedBody(text){
 const v=norm(text);const exact=bodyMap.find(([k])=>norm(k)===v);
 return exact?exact[1].slice():[];
}
function cellNum(v){if(v===null||v===undefined||String(v).trim()==="")return null;const n=Number(String(v).replace(",","."));return Number.isFinite(n)?n:null;}
function isoDate(input,X){
 if(input instanceof Date&&!isNaN(input))return input.toISOString().slice(0,10);
 if(typeof input==="number"){const d=X.SSF.parse_date_code(input);if(d)return [d.y,String(d.m).padStart(2,"0"),String(d.d).padStart(2,"0")].join("-");}
 if(/^\d{4}-\d\d-\d\d/.test(String(input)))return String(input).slice(0,10);
 const m=String(input).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
 return m?[m[3],m[2].padStart(2,"0"),m[1].padStart(2,"0")].join("-"):"";
}
async function parser(){
 if(window.XLSX)return window.XLSX;
 if(!window.__sstXlsxPromise)window.__sstXlsxPromise=new Promise((resolve,reject)=>{
  const script=document.createElement("script");script.src="./vendor/xlsx.full.min.js";script.onload=()=>window.XLSX?resolve(window.XLSX):reject(Error("Leitor de planilhas indisponível."));script.onerror=()=>reject(Error("Não foi possível abrir o leitor Excel."));document.head.appendChild(script);
 });
 return window.__sstXlsxPromise;
}
function matrix(wb,name,X){const ws=wb.Sheets[name];return ws?X.utils.sheet_to_json(ws,{header:1,defval:"",raw:true}):null;}
function headerIndex(rows,needed){
 return rows.findIndex(row=>row.some(c=>needed.includes(norm(c))));
}
function parseAccidents(wb,X){
 const rows=matrix(wb,"Registros",X);
 if(!rows)throw Error('A planilha precisa ter uma aba "Registros".');
 const head=headerIndex(rows,["id"]);
 if(head<0)throw Error("Coluna ID não encontrada na aba Registros.");
 const headers=rows[head].map(norm);
 const at=(row,names)=>{const i=headers.findIndex(h=>names.includes(h));return i<0?"":row[i]};
 const mapped=[];const errors=[];const ids=new Set();
 for(const [index,row] of rows.slice(head+1).entries()){
  const idNo=cellNum(at(row,["id"]));if(idNo===null)continue;
  if(!Number.isInteger(idNo)||idNo<1||idNo>999)throw Error("ID inválido na linha "+(index+head+2));
  const id="planilha-acidentes-sst-2026-"+String(idNo).padStart(3,"0");
  if(ids.has(id))throw Error("ID repetido: "+idNo);ids.add(id);
  const date=isoDate(at(row,["data da ocorrencia","data"]),X),person=plain(at(row,["colaborador","nome"]));
  if(!date||!person)throw Error("Data ou colaborador vazio na ocorrência "+idNo);
  const part=plain(at(row,["parte do corpo"])),parts=mappedBody(part);
  if(!parts.length&&part)errors.push("Registro "+idNo+": região "+part+" requer conferência.");
  const leave=plain(at(row,["houve afastamento?","houve afastamento"]));
  const lost=cellNum(at(row,["dias perdidos"])),debited=cellNum(at(row,["dias debitados"]));
  const cat=plain(at(row,["cat"]));
  const out={
   id,fonteRegistroId:idNo,fonteImportacao:"INDICADORES_DE_ACIDENTES-SST.xlsx",referenciaAno:Number(date.slice(0,4)),
   titulo:"Acidente "+idNo+" - "+person, tipo:"Acidente",
   classificacaoOriginal:plain(at(row,["classificacao"])),data:date,
   unidade:plain(at(row,["unidade"])),empresa:plain(at(row,["empresa"])),
   colaborador:person,responsavel:person,funcao:plain(at(row,["funcao"])),setor:"",
   houveAfastamento:leave,diasPerdidos:lost,diasDebitados:debited,
   catOriginal:cat,catEmitida:norm(cat).includes("nao")?"Não":norm(cat).includes("emit")?"Sim":"Em análise",
   parteCorpoOriginal:part,partesCorpo:parts,
   grupoCausa:plain(at(row,["grupo de causa"])),
   descricao:plain(at(row,["descricao resumida","descricao"])),
   status:plain(at(row,["status"]))||"Em análise"
  };
  mapped.push(out);
 }
 if(!mapped.length)throw Error("Nenhum acidente válido encontrado na planilha.");
 if(mapped.length>100)throw Error("Importe até 100 acidentes por vez.");
 return {mapped,errors};
}
function parseHht(wb,X){
 const rows=matrix(wb,"Horas Trabalhadas",X);
 if(!rows)throw Error('Não encontrei a aba "Horas Trabalhadas".');
 const header=headerIndex(rows,["ano"]);
 if(header<0)throw Error("A coluna Ano está ausente na aba Horas Trabalhadas.");
 const h=rows[header].map(norm);
 const get=(r,label)=>{const index=h.indexOf(label);return index<0?"":r[index]};
 const items=[];
 for(const row of rows.slice(header+1)){
  const year=cellNum(get(row,"ano")),month=cellNum(get(row,"mes")),amount=cellNum(get(row,"horas-homem trabalhadas")),source=plain(get(row,"fonte / evidencia"));
  // Excluir explicitamente células-modelo "38" (preenchimento de placeholder), não usá-las como HHT.
  if(!year||!month||amount===null||amount<=100||norm(source)==="38")continue;
  if(!Number.isInteger(month)||month<1||month>12)continue;
  items.push({ano:year,mes:month,unidade:plain(get(row,"unidade")),hht:amount,fonte:source,responsavel:plain(get(row,"responsavel")),observacoes:plain(get(row,"observacoes"))});
 }
 if(!items.length)throw Error("Nenhuma HHT válida encontrada. Verifique os valores por unidade e mês.");
 const keys=items.map(x=>[x.ano,x.mes,x.unidade].join(":"));if(unique(keys).length!==keys.length)throw Error("HHT contém competência e unidade duplicadas.");
 return items;
}
function buildIndicators(records,hht){
 const incidents=records.filter(x=>x.tipo==="Acidente");
 const withLeave=incidents.filter(x=>norm(x.houveAfastamento)==="sim").length;
 const total=hht.reduce((n,r)=>n+r.hht,0);
 const lost=incidents.reduce((n,r)=>n+(r.diasPerdidos||0),0);
 const debit=incidents.reduce((n,r)=>n+(r.diasDebitados||0),0);
 const year=Number(records[0]?.data?.slice(0,4));
 if(records.some(r=>Number(r.data.slice(0,4))!==year))throw Error("Não misture anos na mesma importação.");
 return {ano:year,acidentes:incidents.length,comAfastamento:withLeave,semAfastamento:incidents.length-withLeave,
  incidentesQuaseAcidentes:0,diasPerdidosInformados:lost,diasDebitadosInformados:debit,
  diasPerdidosMaisDebitados:lost+debit,hht:total,frequencia:total?withLeave*1000000/total:0,
  gravidade:total?(lost+debit)*1000000/total:0,indiceAfastamento:incidents.length?withLeave/incidents.length:0,
  quantidadeDiasPerdidosNaoInformados:incidents.filter(x=>x.diasPerdidos===null).length,
  criterioFrequencia:"Acidentes com afastamento × 1.000.000 / HHT, conforme planilha",
  criterioGravidade:"(Dias perdidos + dias debitados) × 1.000.000 / HHT"};
}
const fields=["fonteRegistroId","titulo","tipo","classificacaoOriginal","data","unidade","empresa","colaborador","responsavel","funcao","houveAfastamento","diasPerdidos","diasDebitados","catOriginal","catEmitida","parteCorpoOriginal","partesCorpo","grupoCausa","descricao","status","referenciaAno"];
function same(x,y){return JSON.stringify(x)===JSON.stringify(y);}
function changes(before,next){
 const diff={};for(const k of fields)if(!same(before[k]??null,next[k]??null))diff[k]={antes:before[k]??null,depois:next[k]??null};
 return diff;
}
async function sha256(file){const bytes=await crypto.subtle.digest("SHA-256",await file.arrayBuffer());return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,"0")).join("");}
const status=(text,error=false)=>{const t=$("#sheet-status");if(t){t.textContent=text;t.classList.toggle("is-error",error);}};
async function inspect(file){
 if(!file)return;
 if(file.size>7*1024*1024){status("Planilha maior que o limite de 7 MB.",true);return;}
 try{
  const X=await parser(),wb=X.read(await file.arrayBuffer(),{type:"array",cellDates:true});
  const accidents=parseAccidents(wb,X),hht=parseHht(wb,X),indicators=buildIndicators(accidents.mapped,hht);
  const snap=await getDocs(collection(env.db,"incidentes"));
  const existing=snap.docs.map(d=>({id:d.id,...d.data()}));
  const operations=accidents.mapped.map(item=>{
   const old=existing.find(x=>x.id===item.id||x.fonteRegistroId===item.fonteRegistroId&&x.data===item.data);
   const patch=old?changes(old,item):null;
   // preservar correção humana para região ambígua sem atribuir regiões artificiais
   if(old&&item.partesCorpo.length===0&&old.parteCorpoOriginal===item.parteCorpoOriginal&&old.partesCorpo?.length){
    item.partesCorpo=old.partesCorpo;delete patch.partesCorpo;
   }
   return {type:!old?"create":Object.keys(patch).length?"update":"same",id:old?.id||item.id,item,old:old||null,diff:patch||{}};
  });
  const hash=await sha256(file);
  const diffCount=operations.filter(x=>x.type==="update").length;
  const newCount=operations.filter(x=>x.type==="create").length;
  const sameCount=operations.filter(x=>x.type==="same").length;
  preview={fileName:file.name,hash,operations,hht,indicators,errors:accidents.errors,originalModified:file.lastModified};
  const t=$("#sheet-preview");
  t.innerHTML='<div class="sheet-counts"><span><b>'+newCount+'</b> novos</span><span><b>'+diffCount+'</b> alterados</span><span><b>'+sameCount+'</b> sem mudanças</span></div>'+
  '<p><strong>HHT:</strong> '+new Intl.NumberFormat("pt-BR").format(indicators.hht)+
  ' · <strong>Acidentes:</strong> '+indicators.acidentes+
  ' · <strong>TF:</strong> '+indicators.frequencia.toFixed(2).replace(".",",")+
  ' · <strong>TG:</strong> '+indicators.gravidade.toFixed(2).replace(".",",")+'</p>'+
  (diffCount?'<details><summary>Conferir campos alterados</summary><ul>'+operations.filter(x=>x.type==="update").map(x=>'<li>Registro '+escape(x.item.fonteRegistroId)+': '+escape(Object.keys(x.diff).join(", "))+'</li>').join("")+'</ul></details>':"")+
  (accidents.errors.length?'<p class="sheet-warnings">'+accidents.errors.slice(0,5).map(escape).join(" · ")+'</p>':"")+
  '<p>As informações existentes serão atualizadas apenas após sua confirmação. Cada importação gera registro de auditoria e conserva os valores anteriores.</p>';
  $("#sheet-apply").disabled=false;
  status("Prévia pronta. Compare os indicadores antes de confirmar.");
 }catch(err){preview=null;$("#sheet-apply").disabled=true;console.error("planilha",err);status("Não foi possível validar: "+err.message,true);}
}
async function apply(){
 if(committing||!preview||env.getCtx().role!=="admin"||env.getCtx().mode!=="cloud")return;
 committing=true;$("#sheet-apply").disabled=true;
 try{
  const {operations,indicators,hht,hash,fileName}=preview,now=new Date().toISOString();
  const auditRef=doc(collection(env.db,"importacoesPlanilhas"));
  const evidenceRef=doc(env.db,"evidencias","indicadores-acidentes-sst-"+indicators.ano);
  const existingEvidence=await getDoc(evidenceRef);
  const batch=writeBatch(env.db);
  const audit=[];
  for(const op of operations){
   if(op.type==="same")continue;
   const before=op.old||null;
   const rec={...before,...op.item,criadoEm:before?.criadoEm||now,atualizadoEm:now,ultimaImportacao:auditRef.id};
   delete rec.id;
   if(op.type==="create")batch.set(doc(env.db,"incidentes",op.id),rec);
   else batch.update(doc(env.db,"incidentes",op.id),rec);
   audit.push({id:op.id,acao:op.type,antes:Object.fromEntries(Object.keys(op.diff).map(k=>[k,op.diff[k].antes])),depois:Object.fromEntries(Object.keys(op.diff).map(k=>[k,op.diff[k].depois]))});
  }
  batch.set(evidenceRef,{...(existingEvidence.exists()?existingEvidence.data():{}),
   titulo:"Indicadores de acidentes SST — planilha "+indicators.ano,
   categoria:"Outras evidências",data:now.slice(0,10),setor:"SST",responsavel:"Equipe SST",
   fonteImportacao:fileName,hashFonteSha256:hash,indicadoresSst:indicators,hhtMensal:hht,
   criadoEm:existingEvidence.exists()?existingEvidence.data().criadoEm:now,atualizadoEm:now});
  batch.set(auditRef,{tipo:"atualizacao_indicadores",arquivoNome:fileName,hashFonteSha256:hash,
   ano:indicators.ano,em:now,por:env.auth.currentUser.uid,novos:operations.filter(x=>x.type==="create").length,
   alterados:operations.filter(x=>x.type==="update").length,semMudancas:operations.filter(x=>x.type==="same").length,
   alteracoes:audit,indicadores:indicators});
  await batch.commit();
  status("Atualização aplicada. Histórico registrado. Atualize a planilha no computador e importe novamente quando necessário.");
  env.toast("Planilha atualizada e histórico salvo.");
  preview=null;
  $("#sheet-file").value="";
  await env.refresh();
 }catch(err){console.error("apply spreadsheet",err);status("Falha ao gravar: "+err.message,true);env.toast("Falha ao atualizar a planilha.",true);}
 finally{committing=false;$("#sheet-apply").disabled=false;}
}
async function linkLocalFile(){
 if(typeof window.showOpenFilePicker!=="function"){status("Neste navegador, use Selecionar planilha. Vincular exige Chrome/Edge compatível.",true);return;}
 try{
  const [picked]=await window.showOpenFilePicker({types:[{description:"Planilhas SST",accept:{"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":[".xlsx"],"text/csv":[".csv"]}}],multiple:false});
  handle=picked;
  const file=await handle.getFile();linkedModified=file.lastModified;
  await inspect(file);
  status("Planilha vinculada nesta sessão. Enquanto esta tela estiver aberta, avisarei se o arquivo mudar. Nada será gravado automaticamente.");
 }catch(err){if(err.name!=="AbortError")status("Não foi possível vincular: "+err.message,true);}
}
async function checkLinked(){
 if(!handle||document.hidden)return;
 try{
  const file=await handle.getFile();
  if(file.lastModified!==linkedModified){
   linkedModified=file.lastModified;
   status("A planilha vinculada foi alterada no computador. Clique em Recarregar prévia para conferir as mudanças.");
   $("#sheet-reload").hidden=false;
  }
 }catch{handle=null;}
}
function openDialog(){
 if(env.getCtx().mode!=="cloud"||env.getCtx().role!=="admin")return;
 preview=null;$("#sheet-apply").disabled=true;$("#sheet-preview").innerHTML="";status("Selecione o Excel de indicadores atualizado.");$("#sheet-dialog").showModal();
}
export function setupSpreadsheetUpdates(options){
 env=options;
 const dlg=document.createElement("dialog");dlg.id="sheet-dialog";dlg.className="dialog sheet-dialog";
 dlg.innerHTML='<div class="dialog-head"><div><span class="eyebrow">ATUALIZAÇÃO CONTROLADA · SST</span><h2>Importar / atualizar Excel</h2></div><button type="button" id="sheet-close" class="icon-button">×</button></div>'+
 '<p class="sheet-help">Aceita a planilha de indicadores SST com as abas <b>Registros</b> e <b>Horas Trabalhadas</b>. Mostra entradas novas, campos alterados e HHT antes de aplicar. Registra histórico das atualizações.</p>'+
 '<div class="sheet-actions"><input type="file" id="sheet-file" accept=".xlsx,.xls,.csv"><button type="button" class="btn btn-muted" id="sheet-link">Vincular arquivo local (Chrome)</button><button type="button" class="btn btn-muted" id="sheet-reload" hidden>Recarregar prévia</button></div>'+
 '<div id="sheet-preview"></div><p id="sheet-status" role="status" class="sheet-help"></p><button type="button" class="btn btn-muted" id="sheet-history">Ver histórico das importações</button><div id="sheet-history-list" class="sheet-history" hidden></div>'+
 '<div class="dialog-footer"><button type="button" class="btn btn-muted" id="sheet-cancel">Fechar</button><button type="button" class="btn btn-primary" id="sheet-apply" disabled>Confirmar atualização</button></div>';
 document.body.appendChild(dlg);
 document.addEventListener("click",e=>{if(e.target.closest("#sheet-open"))openDialog();});
 $("#sheet-close").addEventListener("click",()=>dlg.close());$("#sheet-cancel").addEventListener("click",()=>dlg.close());
 $("#sheet-file").addEventListener("click",e=>{e.target.value="";});
 $("#sheet-file").addEventListener("change",e=>inspect(e.target.files?.[0]));
 $("#sheet-link").addEventListener("click",linkLocalFile);
 $("#sheet-reload").addEventListener("click",async()=>{if(handle){await inspect(await handle.getFile());$("#sheet-reload").hidden=true;}});
 $("#sheet-apply").addEventListener("click",apply);
 $("#sheet-history").addEventListener("click",async()=>{
   const box=$("#sheet-history-list");
   if(!box.hidden){box.hidden=true;return;}
   box.hidden=false;box.textContent="Carregando histórico...";
   try{
     const snap=await getDocs(collection(env.db,"importacoesPlanilhas"));
     const records=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.em||"").localeCompare(String(a.em||""))).slice(0,15);
     box.innerHTML=records.length?records.map(r=>'<div class="sheet-history-item"><strong>'+escape(r.arquivoNome||"Planilha SST")+'</strong><span>'+escape(r.em?new Date(r.em).toLocaleString("pt-BR"):"Sem data")+' · '+Number(r.novos||0)+' novos · '+Number(r.alterados||0)+' alterados · '+Number(r.semMudancas||0)+' sem alterações</span><small>Versão '+escape(String(r.hashFonteSha256||"").slice(0,12))+'</small></div>').join(""):'Nenhuma importação anterior registrada.';
   }catch(err){console.error("spreadsheet history",err);box.textContent="Falha ao consultar histórico. Verifique sua permissão de administrador.";}
 });
 watchTimer=setInterval(checkLinked,30000);
}
export function renderSpreadsheetButton(role){return role==="admin"?'<button type="button" id="sheet-open" class="btn btn-muted">Importar / atualizar Excel</button>':"";}
