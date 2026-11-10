import {collection,doc,getDocs,writeBatch} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Importação orientada por módulo. Nenhum arquivo ou dado pessoal entra no bundle/ GitHub.
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>c==="&"?"&amp;":c==="<"?"&lt;":c===">"?"&gt;":c==='"'?"&quot;":"&#39;");
const norm=v=>String(v??"").trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ");
const KEYS=["titulo","tipo","data","setor","responsavel","gravidade","status","descricao","validade","prazo","prioridade","unidade","empresa","categoria","modalidade","tema","ministrante","duracaoMinutos","referencia","vinculo","registroId","link","observacoes","emissao","revisaoPrevista","versao","cnpj","periodoCapa"];
const MAIN={
 incidentes:{nome:"Ocorrências",colecao:"incidentes",requer:["titulo","data","responsavel"],campos:[["titulo","Ocorrência"],["tipo","Tipo"],["data","Data"],["setor","Setor"],["responsavel","Responsável"],["gravidade","Gravidade"],["status","Status"],["descricao","Descrição"],["unidade","Unidade"]]},
 inspecoes:{nome:"Inspeções",colecao:"inspecoes",requer:["titulo","data","responsavel"],campos:[["titulo","Inspeção"],["tipo","Tipo"],["data","Data"],["setor","Setor"],["responsavel","Inspetor"],["status","Resultado"],["descricao","Observações"],["unidade","Unidade"]]},
 epis:{nome:"Controle de EPIs",colecao:"epis",requer:["titulo","responsavel","data"],campos:[["titulo","Equipamento"],["tipo","Categoria"],["responsavel","Colaborador"],["data","Data de entrega"],["validade","Validade ou revisão"],["status","Situação"],["descricao","CA / série / observações"],["unidade","Unidade"]]},
 treinamentos:{nome:"Treinamentos",colecao:"treinamentos",requer:["titulo","responsavel","data"],campos:[["titulo","Treinamento"],["tipo","Norma"],["responsavel","Turma / colaborador"],["data","Realização"],["validade","Reciclagem"],["status","Situação"],["descricao","Observações"],["unidade","Unidade"]]},
 acoes:{nome:"Ações corretivas",colecao:"acoes",requer:["titulo","responsavel","data","prazo"],campos:[["titulo","Ação corretiva"],["tipo","Origem"],["responsavel","Responsável"],["data","Abertura"],["prazo","Prazo"],["prioridade","Prioridade"],["status","Status"],["descricao","Plano de ação"],["unidade","Unidade"]]},
 colaboradores:{nome:"Colaboradores",colecao:"colaboradores",requer:["titulo"],campos:[["titulo","Nome completo"],["tipo","Função"],["setor","Setor"],["responsavel","Matrícula"],["data","Admissão"],["status","Situação"],["descricao","Observações"],["unidade","Unidade"]]},
 evidencias:{nome:"Evidências documentais",colecao:"evidencias",requer:["titulo","categoria","data","link"],campos:[["titulo","Nome da evidência"],["categoria","Tipo de evidência"],["data","Data da evidência"],["setor","Setor / equipe"],["responsavel","Responsável"],["referencia","Matrícula, placa, OS ou ID da inspeção"],["vinculo","Vinculado ao módulo"],["registroId","ID do registro vinculado"],["link","Link HTTPS do comprovante"],["observacoes","Observações"],["modalidade","Modalidade"],["tema","Tema"]]},
 programas:{nome:"Programas e laudos",colecao:"programasSst",requer:["titulo","tipo","emissao","link"],campos:[["tipo","Tipo de documento"],["titulo","Título ou escopo"],["versao","Versão / revisão"],["unidade","Unidade / contrato"],["emissao","Emissão"],["revisaoPrevista","Próxima revisão planejada"],["responsavel","Responsável técnico"],["cnpj","CNPJ"],["periodoCapa","Período indicado no documento"],["status","Estado do documento"],["link","Link HTTPS do programa / laudo"],["observacoes","Observações"]]}
};
const DATES=new Set(["data","prazo","validade","emissao","revisaoPrevista"]);
const GLOBAL_ALIASES={
 titulo:["titulo","título","nome","descricao do registro","descrição do registro"],
 tipo:["tipo","norma","norma regulamentadora","nr","categoria","classe"],
 data:["data","data do registro","data da ocorrencia","data da ocorrência","realizacao","realização","data de realizacao","data de realização","entrega","admissao","admissão"],
 responsavel:["responsavel","responsável","responsavel tecnico","responsável técnico","nome do colaborador","colaborador","matricula","matrícula","registro"],
 status:["status","situacao","situação","resultado"],
 descricao:["descricao","descrição","observacoes","observações"],
 link:["url","link","url do comprovante","link do documento","link da evidencia","link da evidência"],
 unidade:["unidade","filial","estabelecimento","local"],
 setor:["setor","equipe"]
};
const EXT_IDS=["id na planilha","id da planilha","identificador externo","codigo externo","código externo","id externo","id sst","id"];
const getLabels=profile=>["ID na planilha",...profile.campos.map(x=>x[1])];
const attr=key=>key==="link"?"link":key;
const download=(filename,bytes,type)=>{
 const u=URL.createObjectURL(new Blob([bytes],{type})),a=document.createElement("a");
 a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),8000);
};
async function loadXlsx(){
 if(window.XLSX)return window.XLSX;
 if(!window.__sstXlsxPromise)window.__sstXlsxPromise=new Promise((resolve,reject)=>{
  const s=document.createElement("script");s.src="./vendor/xlsx.full.min.js";
  s.onload=()=>window.XLSX?resolve(window.XLSX):reject(Error("Biblioteca XLSX indisponível."));
  s.onerror=()=>reject(Error("Falha ao carregar leitor Excel."));document.head.appendChild(s);
 });
 return window.__sstXlsxPromise;
}
function dateISO(value){
 if(value instanceof Date){if(isNaN(value))return "";return [value.getFullYear(),String(value.getMonth()+1).padStart(2,"0"),String(value.getDate()).padStart(2,"0")].join("-");}
 const v=String(value??"").trim();
 if(!v)return "";
 const check=(y,m,d)=>{
  const dt=new Date(Date.UTC(y,m-1,d));
  return dt.getUTCFullYear()===y&&dt.getUTCMonth()+1===m&&dt.getUTCDate()===d?[y,String(m).padStart(2,"0"),String(d).padStart(2,"0")].join("-"):"";
 };
 let m=v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
 if(m)return check(+m[1],+m[2],+m[3]);
 m=v.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{2}|\d{4})$/);
 if(m){let y=+m[3];if(y<100)y+=y<70?2000:1900;return check(y,+m[2],+m[1]);}
 return "";
}
const matchKey=(profile,header)=>{
 const n=norm(header);if(!n)return null;
 for(const [key,label] of profile.campos){
  if(n===norm(key)||n===norm(label)||(GLOBAL_ALIASES[key]||[]).some(alias=>n===norm(alias)))return key;
 }
 return null;
};
function parseRows(sheet,X,profile,sourceName){
 const matrix=X.utils.sheet_to_json(sheet,{header:1,defval:"",raw:false,blankrows:false});
 const headings=matrix.slice(0,20).map((line,i)=>{
  const mapping=line.map(v=>matchKey(profile,v));
  return {line:i,mapping,score:new Set(mapping.filter(Boolean)).size,title:mapping.includes("titulo")};
 }).filter(x=>x.title).sort((a,b)=>b.score-a.score);
 if(!headings.length||headings[0].score<2)throw Error("Cabeçalho incompatível. Baixe o modelo desta aba e confira as colunas.");
 const row=headings[0].line,header=matrix[row].map(v=>norm(v));
 const found=new Map(),errors=[],used=new Set();
 for(let i=0;i<header.length;i++){
  const key=matchKey(profile,header[i]);
  if(key){
   if(found.has(key)){errors.push("Há duas colunas que representam "+key+". Renomeie a coluna ambígua.");}
   else found.set(key,i);
  }
 }
 const idPosition=header.findIndex(x=>EXT_IDS.some(z=>norm(z)===x));
 const records=[];
 for(let i=row+1;i<matrix.length;i++){
  const line=matrix[i],filled=line.some(c=>String(c??"").trim());
  if(!filled)continue;
  const item={},present=[];
  for(const [key,col] of found.entries()){
   let val=String(line[col]??"").trim();
   if(!val)continue; // células vazias nunca apagam valores existentes
   if(/^[=+@]/.test(val)&&!DATES.has(key)){errors.push("Linha "+(i+1)+": expressão de planilha não permitida em "+key+".");continue;}
   if(DATES.has(key)){
    const dt=dateISO(val);
    if(!dt){errors.push("Linha "+(i+1)+": data inválida em "+key+" ("+val.slice(0,16)+").");continue;}
    val=dt;
   }
   if(val.length>1200){errors.push("Linha "+(i+1)+": "+key+" excede 1.200 caracteres.");continue;}
   item[key]=val;present.push(key);
  }
  if(!Object.keys(item).length)continue;
  const sourceId=idPosition>=0?String(line[idPosition]??"").trim():"";
  if(sourceId.length>100){errors.push("Linha "+(i+1)+": identificador acima de 100 caracteres.");continue;}
  if(!item.titulo){errors.push("Linha "+(i+1)+": título/nome obrigatório.");continue;}
  if(sourceId)item.idPlanilhaSst=sourceId;
  if(item.link){let validUrl=false;try{const u=new URL(item.link);validUrl=u.protocol==="https:"&&!!u.hostname;}catch{}if(!validUrl){errors.push("Linha "+(i+1)+": link HTTPS inválido.");continue;}}
  if(profile===MAIN.programas && item.tipo && !["PGR","PCMSO","LTCAT","PERICULOSIDADE"].includes(item.tipo.toUpperCase())){
   errors.push("Linha "+(i+1)+": programa precisa ser PGR, PCMSO, LTCAT ou PERICULOSIDADE.");continue;
  }
  records.push({item,row:i+1,present});
 }
 if(records.length>80)errors.push("Limite de 80 linhas por importação. Divida a planilha em lotes.");
 if(records.length===0)errors.push("Não foram encontradas linhas de dados válidas.");
 return {records,errors,used,headings:found.size};
}
function fingerprint(profile,r){
 if(profile===MAIN.colaboradores)return r.responsavel?("mat:"+norm(r.responsavel)):"nome:"+norm(r.titulo);
 if(profile===MAIN.programas)return [r.tipo,r.unidade,r.versao,r.titulo].map(norm).join("|");
 if(profile===MAIN.evidencias)return [r.categoria,r.data,r.referencia,r.titulo].map(norm).join("|");
 return [r.titulo,r.data,r.responsavel].map(norm).join("|");
}
function align(record,all,profile){
 const source=record.idPlanilhaSst;
 if(source){
  const match=all.filter(x=>x.idPlanilhaSst===source||x.id===source);
  if(match.length>0)return match;
 }
 const key=fingerprint(profile,record);
 return key?all.filter(x=>fingerprint(profile,x)===key):[];
}
const diff=(before,after,keys)=>{
 const changed={};
 for(const k of keys)if(JSON.stringify(before[k]??null)!==JSON.stringify(after[k]??null))
  changed[k]={antes:before[k]??null,depois:after[k]??null};
 return changed;
};
async function checksum(file){
 const hash=await crypto.subtle.digest("SHA-256",await file.arrayBuffer());
 return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
let env,activeModule=null,pendingFile=null,pendingWorkbook=null,selectedSheet="",state=null,working=false;
const message=(txt,error=false)=>{
 const el=$("#mod-import-message");if(!el)return;
 el.textContent=txt;el.classList.toggle("is-error",error);
};
function updateSession(){
 const authorized=env.getCtx().mode==="cloud"&&env.getCtx().role==="admin";
 if(!authorized){$("#mod-import-dialog").close();return false;}
 return true;
}
function explain(module){
 const p=MAIN[module];
 return module==="incidentes"
  ?'Ocorrências comuns. Para a planilha INDICADORES_DE_ACIDENTES-SST.xlsx com HHT/TF/TG, use o importador específico ao lado.'
  :module==="evidencias"
  ?'Importa metadados e links HTTPS dos comprovantes. Para listas coletivas de participantes, abra Nova evidência e importe a lista dentro dela. PDFs não são anexados por Excel.'
  :module==="programas"
  ?'Importa catálogo e links HTTPS de PGR, PCMSO, LTCAT e laudos. Os PDFs originais continuam vinculados por link ou arquivo autorizado.'
  :'Use o modelo desta aba, com as colunas específicas. Os campos vazios não apagam dados já cadastrados.';
}
export function renderModuleImporterButton(module,role){
 return role==="admin"&&MAIN[module]?'<button type="button" class="btn btn-muted" data-mod-import="'+module+'">Importar planilha</button>':"";
}
export function renderImportHubButton(role){
 return role==="admin"?'<button type="button" class="btn btn-muted" data-mod-import-hub="1">Importar dados</button>':"";
}
function openHub(){
 if(!updateSession())return;
 const dlg=$("#mod-import-hub");
 dlg.innerHTML='<div class="dialog-head"><div><span class="eyebrow">CENTRAL DE PLANILHAS SST</span><h2>Escolha a origem dos dados</h2></div><button class="icon-button" id="mod-hub-close" type="button">×</button></div>'+
 '<p class="mod-import-help">Cada módulo utiliza seu próprio modelo e dados. Os indicadores com HHT seguem o importador especializado em Incidentes.</p>'+
 '<div class="mod-hub-grid">'+Object.entries(MAIN).map(([key,p])=>'<button class="mod-hub-choice" type="button" data-mod-import="'+key+'"><strong>'+esc(p.nome)+'</strong><small>Importar Excel / CSV</small></button>').join("")+'</div>'+
 '<p class="mod-import-help">Assinaturas eletrônicas: utilize Criar lista para importar os participantes. Relatórios e Dashboard são atualizados a partir dos módulos de origem.</p>';
 dlg.showModal();
 $("#mod-hub-close").addEventListener("click",()=>dlg.close());
}
function openModule(module){
 if(!MAIN[module]||!updateSession())return;
 $("#mod-import-hub").close();
 activeModule=module;pendingFile=null;pendingWorkbook=null;selectedSheet="";state=null;$("#mod-import-history-list").hidden=true;$("#mod-import-history-list").innerHTML="";
 const p=MAIN[module];
 $("#mod-import-title").textContent="Importar — "+p.nome;
 $("#mod-import-help").textContent=explain(module);
 $("#mod-import-file").value="";$("#mod-import-file").disabled=false;
 $("#mod-import-sheet-wrap").hidden=true;$("#mod-import-preview").innerHTML="";
 $("#mod-import-apply").disabled=true;message("Selecione um arquivo ou baixe o modelo desta aba.");
 $("#mod-import-dialog").showModal();
}
async function model(){
 if(!MAIN[activeModule])return;
 const profile=MAIN[activeModule],header=getLabels(profile);
 try{
  const X=await loadXlsx(),book=X.utils.book_new(),sheet=X.utils.aoa_to_sheet([header]);
  sheet["!cols"]=header.map(h=>({wch:Math.max(18,Math.min(39,h.length+4))}));
  X.utils.book_append_sheet(book,sheet,"Dados");
  const notes=[
   ["TECHNET SST · Modelo de importação de "+profile.nome],
   ["1. Preencha uma linha por registro; não modifique os cabeçalhos."],
   ["2. ID na planilha é recomendado, especialmente para atualizar títulos ou datas."],
   ["3. Reimporte o mesmo arquivo para atualizar; registros existentes são comparados antes."],
   ["4. Células em branco não apagam campos anteriores."],
   ["5. Datas aceitas: DD/MM/AAAA ou AAAA-MM-DD."],
   ["6. Registros novos precisam preencher: "+profile.requer.map(x=>profile.campos.find(f=>f[0]===x)?.[1]||x).join(", ")+"."],
   ["7. Não cole registros médicos ou dados sensíveis desnecessários."],
   ["8. Para documentos, informe um link HTTPS autorizado; Excel não envia arquivos binários."],
   ["9. Apenas administradores podem executar importações. Sem exclusão automática."]
  ];
  X.utils.book_append_sheet(book,X.utils.aoa_to_sheet(notes),"Orientações");
  const bytes=X.write(book,{bookType:"xlsx",type:"array"});
  download("MODELO_SST_"+activeModule.toUpperCase()+".xlsx",bytes,"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  message("Modelo baixado. Preencha a aba Dados e selecione o arquivo.");
 }catch(err){message("Não foi possível gerar o modelo: "+err.message,true);}
}
async function readFile(file){
 state=null;$("#mod-import-apply").disabled=true;$("#mod-import-preview").innerHTML="";
 if(!file)return;
 if(file.size>8*1024*1024){message("Arquivo acima de 8 MB.",true);return;}
 try{
  pendingFile=file;
  const X=await loadXlsx();
  pendingWorkbook=X.read(await file.arrayBuffer(),{type:"array",cellDates:true});
  if(activeModule==="incidentes"&&pendingWorkbook.SheetNames.includes("Horas Trabalhadas")&&pendingWorkbook.SheetNames.includes("Registros")){
   message("Esta é a planilha de indicadores com HHT. Use Incidentes → Importar / atualizar Excel para preservar TF e TG.",true);
   pendingWorkbook=null;return;
  }
  const names=pendingWorkbook.SheetNames.filter(n=>!["Orientações","Instruções","Notas","Listas"].includes(n));
  if(!names.length)throw Error("Nenhuma aba de dados encontrada.");
  const key=names.find(n=>norm(n)===norm(activeModule)||norm(n)==="dados")||names[0];
  selectedSheet=key;
  const select=$("#mod-import-sheet");
  select.innerHTML=names.map(n=>'<option '+(n===key?"selected":"")+' value="'+esc(n)+'">'+esc(n)+'</option>').join("");
  $("#mod-import-sheet-wrap").hidden=names.length<2;
  await inspect(key);
 }catch(err){message("Arquivo inválido: "+err.message,true);}
}
async function inspect(sheetName){
 if(!pendingWorkbook||!MAIN[activeModule]||!updateSession())return;
 const module=activeModule,profile=MAIN[module];
 $("#mod-import-apply").disabled=true;state=null;message("Conferindo os registros existentes…");
 try{
  const X=await loadXlsx(),parsed=parseRows(pendingWorkbook.Sheets[sheetName],X,profile,pendingFile?.name);
  const errors=[...parsed.errors],existing=await getDocs(collection(env.db,profile.colecao));
  const current=existing.docs.map(d=>({id:d.id,...d.data()}));
  const used=new Set(),operations=[];
  for(const x of parsed.records){
   const matches=align(x.item,current,profile);
   if(matches.length>1){errors.push("Linha "+x.row+": corresponde a mais de um registro. Inclua um ID na planilha.");continue;}
   const found=matches[0]||null;
   let merged=found?{...found,...x.item}:{...x.item};
   for(const req of profile.requer){
    if(!String(merged[req]??"").trim() &&!(profile===MAIN.evidencias&&req==="link"&&merged.arquivoPath)&&!(profile===MAIN.programas&&req==="link"&&merged.arquivoPath)){
     errors.push("Linha "+x.row+": campo obrigatório "+(profile.campos.find(y=>y[0]===req)?.[1]||req)+" ausente.");
    }
   }
   if(profile===MAIN.evidencias&&merged.modalidade==="Coletiva"&&!found){
     errors.push("Linha "+x.row+": para cadastrar evidência coletiva com participantes, use Nova evidência → Importar participantes.");
   }
   const identity=found?.id||(x.item.idPlanilhaSst||fingerprint(profile,x.item));
   if(used.has(identity)){errors.push("Linha "+x.row+": identificador repetido dentro da planilha.");continue;}
   used.add(identity);
   const present=[...Object.keys(x.item)];
   const changes=found?diff(found,merged,present):{};
   operations.push({row:x.row,action:!found?"create":Object.keys(changes).length?"update":"same",before:found,fields:merged,delta:changes,documentId:found?.id||null});
  }
  const totals={create:operations.filter(x=>x.action==="create").length,update:operations.filter(x=>x.action==="update").length,same:operations.filter(x=>x.action==="same").length};
  const hash=await checksum(pendingFile);
  state={module,profile,operations,errors,totals,filename:pendingFile.name,hash,sheet:sheetName};
  $("#mod-import-preview").innerHTML='<div class="mod-import-metrics"><div><b>'+totals.create+'</b><small>Novos</small></div><div><b>'+totals.update+'</b><small>Alterados</small></div><div><b>'+totals.same+'</b><small>Sem mudanças</small></div></div>'+
   '<p>Origem: <strong>'+esc(pendingFile.name)+'</strong> · Aba: '+esc(sheetName)+' · '+parsed.records.length+' linha(s) válida(s).</p>'+
   (totals.update?'<details><summary>Ver alterações previstas</summary><ul>'+operations.filter(o=>o.action==="update").map(o=>'<li>Linha '+o.row+': '+esc(Object.keys(o.delta).join(", "))+'</li>').join("")+'</ul></details>':"")+
   (errors.length?'<div class="mod-import-errors"><strong>Corrija antes de continuar ('+errors.length+')</strong><ul>'+errors.slice(0,18).map(e=>'<li>'+esc(e)+'</li>').join("")+'</ul></div>':"")+
   '<p><b>Segurança:</b> o envio só ocorrerá após confirmação. Não serão excluídos registros e as células vazias não apagam informações anteriores. O histórico ficará disponível para auditoria.</p>';
  $("#mod-import-apply").disabled=errors.length>0||totals.create+totals.update===0;
  message(errors.length?errors.length+" inconsistência(s). Revise a planilha.":totals.create+totals.update?"Prévia validada. Confira antes de confirmar.":"Nenhuma mudança detectada.",!!errors.length);
 }catch(err){state=null;message("Não foi possível conferir: "+err.message,true);}
}
async function apply(){
 if(working||!state||state.errors.length||env.getCtx().mode!=="cloud"||env.getCtx().role!=="admin")return;
 const snapshot=state;
 working=true;$("#mod-import-apply").disabled=true;message("Gravando "+(snapshot.totals.create+snapshot.totals.update)+" registro(s) e histórico…");
 try{
  const now=new Date().toISOString(),auditRef=doc(collection(env.db,"importacoesPlanilhas"));
  const batch=writeBatch(env.db),audit=[];
  for(const op of snapshot.operations){
   if(op.action==="same")continue;
   const ref=op.documentId?doc(env.db,snapshot.profile.colecao,op.documentId):doc(collection(env.db,snapshot.profile.colecao));
   const value={...op.fields,criadoEm:op.before?.criadoEm||now,atualizadoEm:now,ultimaImportacao:auditRef.id};
   delete value.id; // Firestore document ID nunca vira campo editável.
   if(op.action==="create")batch.set(ref,value);
   else batch.update(ref,value);
   const changed=op.action==="create"?Object.fromEntries(Object.keys(op.fields).map(k=>[k,{antes:null,depois:op.fields[k]}])):op.delta;
   audit.push({id:ref.id,linha:op.row,acao:op.action,alteracoes:changed});
  }
  if(JSON.stringify(audit).length>500000)throw Error("Histórico grande demais. Divida a planilha em lotes menores.");
  batch.set(auditRef,{
   tipo:"atualizacao_modulo",modulo:snapshot.module,arquivoNome:snapshot.filename,aba:snapshot.sheet,
   hashFonteSha256:snapshot.hash,em:now,por:env.auth.currentUser.uid,
   novos:snapshot.totals.create,alterados:snapshot.totals.update,semMudancas:snapshot.totals.same,alteracoes:audit
  });
  await batch.commit();
  state=null;$("#mod-import-apply").disabled=true;$("#mod-import-file").value="";
  message("Importação concluída: "+snapshot.totals.create+" novos, "+snapshot.totals.update+" atualizados. Histórico salvo.");
  env.toast(snapshot.profile.nome+": planilha atualizada.");
  await env.refresh();
 }catch(err){console.error("Gravar planilha",err);message("Não foi possível gravar: "+err.message,true);env.toast("Falha ao importar a planilha.",true);}
 finally{working=false;$("#mod-import-apply").disabled=false;if(!state)$("#mod-import-apply").disabled=true;}
}
export function setupModuleImporter(options){
 env=options;
 const dlg=document.createElement("dialog");dlg.className="dialog mod-import-dialog";dlg.id="mod-import-dialog";
 dlg.innerHTML='<div class="dialog-head"><div><span class="eyebrow">PLANILHA DO MÓDULO · SST</span><h2 id="mod-import-title">Importar planilha</h2></div><button type="button" id="mod-import-close" class="icon-button" aria-label="Fechar">×</button></div>'+
 '<p id="mod-import-help" class="mod-import-help"></p>'+
 '<div class="mod-import-toolbar"><button type="button" class="btn btn-muted" id="mod-import-model">Baixar modelo Excel</button><label class="mod-import-file-label">Selecionar planilha (.xlsx, .xls ou .csv)<input id="mod-import-file" type="file" accept=".xlsx,.xls,.csv"></label></div>'+
 '<label id="mod-import-sheet-wrap" class="mod-import-sheet" hidden>Selecione a aba de dados<select id="mod-import-sheet"></select></label>'+
 '<div id="mod-import-preview" class="mod-import-preview"></div><p id="mod-import-message" class="mod-import-message" role="status"></p>'+
 '<button type="button" class="btn btn-muted" id="mod-import-history">Histórico de importações</button><div class="mod-import-history" id="mod-import-history-list" hidden></div>'+ 
 '<div class="dialog-footer"><button type="button" class="btn btn-muted" id="mod-import-cancel">Cancelar</button><button type="button" id="mod-import-apply" class="btn btn-primary" disabled>Confirmar importação</button></div>';
 document.body.appendChild(dlg);
 const hub=document.createElement("dialog");hub.id="mod-import-hub";hub.className="dialog mod-import-hub";document.body.appendChild(hub);
 document.addEventListener("click",e=>{
  const trigger=e.target.closest("[data-mod-import]");
  if(trigger)return openModule(trigger.dataset.modImport);
  if(e.target.closest("[data-mod-import-hub]"))return openHub();
 });
 $("#mod-import-close").addEventListener("click",()=>dlg.close());
 $("#mod-import-cancel").addEventListener("click",()=>dlg.close());
 $("#mod-import-model").addEventListener("click",model);
 $("#mod-import-file").addEventListener("click",e=>{e.target.value="";});
 $("#mod-import-file").addEventListener("change",e=>readFile(e.target.files?.[0]));
 $("#mod-import-sheet").addEventListener("change",e=>inspect(e.target.value));
 $("#mod-import-apply").addEventListener("click",apply);
 $("#mod-import-history").addEventListener("click",async()=>{
  const box=$("#mod-import-history-list");
  if(!updateSession()||!activeModule)return;
  if(!box.hidden){box.hidden=true;return;}
  box.hidden=false;box.textContent="Consultando histórico…";
  try{
   const snap=await getDocs(collection(env.db,"importacoesPlanilhas"));
   const items=snap.docs.map(d=>d.data()).filter(x=>x.modulo===activeModule&&x.tipo==="atualizacao_modulo")
    .sort((a,b)=>String(b.em||"").localeCompare(String(a.em||""))).slice(0,15);
   box.innerHTML=items.length?items.map(x=>'<div class="mod-import-history-item"><b>'+esc(x.arquivoNome)+'</b><small>'+esc(new Date(x.em).toLocaleString("pt-BR"))+
    ' · '+Number(x.novos||0)+' novos · '+Number(x.alterados||0)+' alterados · '+Number(x.semMudancas||0)+' iguais</small>'+
    '<small>SHA-256: '+esc(String(x.hashFonteSha256||"").slice(0,16))+'…</small></div>').join(""):'Não existem importações registradas nesta aba.';
  }catch(err){console.error("Histórico de importação",err);box.textContent="Não foi possível ler o histórico. Confira as permissões.";}
 });
}
