const CATEGORIES_COLLECTIVE=["Diálogo de Segurança (DDS)","Instrução de Segurança (IS)","Treinamento / capacitação","Lista de presença"];
export const COLLECTIVE_CATEGORIES=CATEGORIES_COLLECTIVE;
export const COLLECTIVE_TYPES=["Coletiva","Individual"];
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>{if(c==="&")return "&amp;";if(c==="<")return "&lt;";if(c===">")return "&gt;";if(c===String.fromCharCode(34))return "&quot;";return "&#39;";});
let participantsSource=()=>[];
let onAlert=()=>{};
const $$=sel=>document.querySelector(sel);
let parsedList=[];
export function setupCollectiveEvidence({getCollaborators,notify}){
 participantsSource=getCollaborators;onAlert=notify;
 document.addEventListener("change",e=>{
  if(e.target.id==="evi-modalidade"||e.target.id==="evi-categoria"){
   updateCollectiveMode();
  }
  if(e.target.id==="evi-lista-xlsx")parseAttendance(e.target.files?.[0]);
 });
 document.addEventListener("click",e=>{
  if(e.target.closest("#evi-template"))downloadTemplate();
 });
}
export function resetCollectiveBuffer(){parsedList=[];}
function getCurrentList(){return parsedList.slice();}
function names(old){
 if(Array.isArray(old?.participantesAvulsos))return old.participantesAvulsos;
 return [];
}
export function renderCollectiveFields(old={}){
 const v=old||{};
 const collective=v.modalidade==="Coletiva"||(!v.modalidade&&CATEGORIES_COLLECTIVE.includes(v.categoria));
 const people=participantsSource().filter(x=>x.status!=="Inativo").sort((a,b)=>String(a.titulo||"").localeCompare(String(b.titulo||""),"pt-BR"));
 const chosen=new Set((v.participantesIds||[]).map(String));
 const optional=names(v);
 parsedList=optional.slice();
 return '<div class="form-field wide evi-type"><label>Modalidade da evidência *</label><select id="evi-modalidade" name="modalidade" required>'+
 COLLECTIVE_TYPES.map(t=>'<option value="'+t+'" '+((collective?"Coletiva":"Individual")===t?"selected":"")+'>'+t+'</option>').join("")+'</select><small>Coletiva: uma atividade e uma lista para vários participantes. Individual: ficha específica de um colaborador ou inspeção.</small></div>'+
 '<div id="evi-collective" class="evi-collective-block" '+(!collective?"hidden":"")+'>'+
 '<div class="form-field wide"><label>Tema / assunto *</label><input name="tema" maxlength="180" value="'+esc(v.tema||"")+'" placeholder="Ex.: DDS – trabalho em altura"></div>'+
 '<div class="form-field"><label>Ministrante / facilitador</label><input name="ministrante" maxlength="120" value="'+esc(v.ministrante||"")+'"></div>'+
 '<div class="form-field"><label>Duração (minutos)</label><input name="duracaoMinutos" type="number" min="0" max="1440" value="'+esc(v.duracaoMinutos||"")+'"></div>'+
 '<div class="form-field wide"><label>Participantes cadastrados</label><div class="evi-person-list" id="evi-person-list">'+
 (people.length?people.map(p=>'<label class="evi-person"><input type="checkbox" name="participantesIds" value="'+esc(p.id)+'" '+(chosen.has(String(p.id))?"checked":"")+'><span>'+esc(p.titulo||"Colaborador")+'</span><small>'+esc(p.responsavel||"Sem matrícula")+'</small></label>').join(""):'<p class="evi-person-empty">Nenhum colaborador ativo cadastrado. Utilize a lista externa abaixo.</p>')+'</div></div>'+
 '<div class="form-field wide"><label>Adicionar participantes pela planilha Excel ou CSV</label><input id="evi-lista-xlsx" type="file" accept=".xlsx,.xls,.csv"><small>Leia a lista de participantes, confira os nomes e salve o vínculo. O arquivo original deve ser mantido como evidência por link ou armazenamento privado.</small></div>'+
 '<div class="form-field wide"><div class="evi-template-line"><button id="evi-template" type="button" class="btn btn-muted">Baixar modelo CSV da lista</button><small id="evi-list-status">'+esc(parsedList.length?parsedList.length+" participante(s) externo(s) preservado(s).":"Nenhuma lista importada.")+'</small></div></div>'+
 '<div class="form-field wide"><label>Outros participantes (um por linha, opcional)</label><textarea id="evi-extra-participants" rows="3" maxlength="12000" placeholder="Nome completo; matrícula (opcional)">'+esc(optional.map(x=>x.matricula?x.nome+"; "+x.matricula:x.nome).join("\n"))+'</textarea><small>Ao ler uma planilha, os participantes aparecem aqui para conferência.</small></div>'+
 '</div>';
}
export function updateCollectiveMode(){
 const block=$$("#evi-collective"),mode=$$("#evi-modalidade");
 if(!block||!mode)return;
 const cat=$$("#lib-fields select[name=categoria]")?.value;
 if(CATEGORIES_COLLECTIVE.includes(cat)&&mode.value!=="Coletiva")mode.value="Coletiva";
 block.hidden=mode.value!=="Coletiva";
 const r=$$("#lib-fields [name=referencia]")?.closest(".form-field");
 const ref=$$("#lib-fields [name=referencia]");
 if(r&&ref){r.hidden=mode.value==="Coletiva";ref.disabled=mode.value==="Coletiva";}
 const responsible=$$("#lib-fields [name=responsavel]")?.closest(".form-field label");
 if(responsible)responsible.textContent=mode.value==="Coletiva"?"Responsável pela atividade":"Responsável / colaborador";
}
function normalize(s){return String(s||"").trim();}
export function readCollectiveForm(fd,existing){
 const mode=fd.get("modalidade")==="Coletiva"?"Coletiva":"Individual";
 const current=(existing||{});
 if(mode==="Individual")return {modalidade:mode,tema:"",ministrante:"",duracaoMinutos:"",participantesIds:[],participantesAvulsos:[],totalParticipantes:0};
 const tema=normalize(fd.get("tema"));
 if(!tema)throw Error("Informe o tema da atividade coletiva.");
 const ids=[...new Set(fd.getAll("participantesIds").map(String))].filter(Boolean).slice(0,300);
 const raw=String($$("#evi-extra-participants")?.value||"").trim();
 const external=raw.split(/\r?\n/).map(line=>{
  const [nome,...matricula]=line.split(";");return {nome:normalize(nome).slice(0,150),matricula:normalize(matricula.join(";")).slice(0,50)};
 }).filter(x=>x.nome).slice(0,300);
 const registered=participantsSource().filter(x=>ids.includes(String(x.id)));
 const knownNames=new Set(registered.map(x=>String(x.titulo||"").trim().toLocaleLowerCase("pt-BR")));
 const knownMatriculas=new Set(registered.map(x=>String(x.responsavel||"").trim()).filter(Boolean));
 const uniq=[...new Map(external.map(x=>[(x.nome+"|"+x.matricula).toLocaleLowerCase("pt-BR"),x])).values()].filter(x=>!knownNames.has(x.nome.toLocaleLowerCase("pt-BR"))&&(!x.matricula||!knownMatriculas.has(x.matricula)));
 if(ids.length+uniq.length===0)throw Error("Selecione ou importe ao menos um participante para a atividade coletiva.");
 return {modalidade:mode,tema,ministrante:normalize(fd.get("ministrante")).slice(0,120),duracaoMinutos:fd.get("duracaoMinutos")?Math.floor(Number(fd.get("duracaoMinutos"))):"",participantesIds:ids,participantesAvulsos:uniq,totalParticipantes:ids.length+uniq.length};
}
async function loadXlsx(){
 if(window.XLSX)return window.XLSX;
 if(!window.__sstXlsxPromise)window.__sstXlsxPromise=new Promise((resolve,reject)=>{
  const script=document.createElement("script");script.src="./vendor/xlsx.full.min.js";script.onload=()=>window.XLSX?resolve(window.XLSX):reject(Error("Biblioteca XLSX indisponível."));script.onerror=()=>reject(Error("Falha ao carregar o leitor Excel."));document.head.appendChild(script);
 });
 return window.__sstXlsxPromise;
}
export async function parseAttendance(file){
 if(!file)return;
 if(file.size>5*1024*1024)return onAlert("Planilha acima do limite de 5 MB.",true);
 try{
  const X=await loadXlsx(),wb=X.read(await file.arrayBuffer(),{type:"array",cellDates:true});
  const ws=wb.Sheets[wb.SheetNames[0]],matrix=X.utils.sheet_to_json(ws,{header:1,defval:"",raw:false});
  const norm=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const idx=matrix.findIndex(row=>row.some(cell=>["nome","nome completo","colaborador","participante"].includes(norm(cell))));
  if(idx<0)throw Error("Não encontrei uma coluna Nome ou Participante. Use o modelo CSV.");
  const header=matrix[idx].map(norm),cName=header.findIndex(x=>["nome","nome completo","colaborador","participante"].includes(x));
  const cReg=header.findIndex(x=>["matricula","registro","matrícula"].includes(x));
  const participants=matrix.slice(idx+1).map(row=>({nome:normalize(row[cName]).slice(0,150),matricula:cReg>=0?normalize(row[cReg]).slice(0,50):""})).filter(x=>x.nome).slice(0,300);
  if(!participants.length)throw Error("A planilha não possui participantes válidos.");
  parsedList=participants;
  const field=$$("#evi-extra-participants");
  if(field)field.value=participants.map(x=>x.nome+(x.matricula?"; "+x.matricula:"")).join("\n");
  const status=$$("#evi-list-status");if(status)status.textContent=participants.length+" participante(s) importado(s) para conferência.";
  onAlert(participants.length+" participantes lidos. Confira e salve a evidência.");
 }catch(err){console.error("participants",err);onAlert("Erro ao ler participantes: "+err.message,true);}
}
function downloadTemplate(){
 const rows=[["Nome","Matrícula","Função","Setor"],["Exemplo de participante","1234","Técnico","MDU"]];
 const csv="\ufeff"+rows.map(row=>row.map(x=>'"'+x.replace(/"/g,'""')+'"').join(";")).join("\r\n");
 const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
 const a=document.createElement("a");a.href=url;a.download="Modelo_Lista_Participantes_SST.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
