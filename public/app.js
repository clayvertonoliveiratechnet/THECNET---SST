import {initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore,collection,getDocs,addDoc,updateDoc,deleteDoc,doc,getDoc} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {setupLibrary,renderLibrary,loadLibrary,clearLibrary,libraryStats} from "./biblioteca.js";

const config={apiKey:"AIzaSyCxm8bh7KLU2QQUEdED71xyO2GjhZsBs1s",authDomain:"technet-sst-2026.firebaseapp.com",projectId:"technet-sst-2026",storageBucket:"technet-sst-2026.firebasestorage.app",messagingSenderId:"276807543932",appId:"1:276807543932:web:adca9a2ab35b8644e22df9"};
const app=initializeApp(config),auth=getAuth(app),db=getFirestore(app),provider=new GoogleAuthProvider();
provider.setCustomParameters({prompt:"select_account"});
const OWNER="clayvertonoliveira@gmail.com";
const $=s=>document.querySelector(s),keys=["incidentes","inspecoes","epis","treinamentos","acoes","colaboradores"];
const names={dashboard:"Visão geral",incidentes:"Incidentes",inspecoes:"Inspeções",epis:"Controle de EPIs",treinamentos:"Treinamentos",acoes:"Ações corretivas",colaboradores:"Colaboradores",relatorios:"Relatórios",evidencias:"Evidências",programas:"Programas e laudos"};
const descriptions={incidentes:"Registre acidentes, quase acidentes e condições inseguras.",inspecoes:"Acompanhe vistorias de campo e verificações de conformidade.",epis:"Controle entregas, substituições e validade dos EPIs.",treinamentos:"Gerencie capacitações e reciclagens NR.",acoes:"Gerencie responsáveis, prazos e ações preventivas.",colaboradores:"Organize a equipe técnica por função e setor."};
const specs={
 incidentes:[["titulo","Ocorrência","text",true],["tipo","Tipo","select","Acidente|Quase acidente|Condição insegura|Incidente"],["data","Data","date",true],["setor","Setor","select","Campo|MDU|Construção|Técnico|Comercial|Administrativo"],["responsavel","Responsável","text",true],["gravidade","Gravidade","select","Baixa|Média|Alta|Crítica"],["status","Status","select","Aberto|Em análise|Resolvido"],["descricao","Descrição","textarea"]],
 inspecoes:[["titulo","Inspeção","text",true],["tipo","Tipo","select","Campo|Veículo|Ferramentas|EPI|Instalação|Altura"],["data","Data","date",true],["setor","Setor","select","Campo|MDU|Construção|Técnico|Comercial|Administrativo"],["responsavel","Inspetor","text",true],["status","Resultado","select","Conforme|Pendente|Não conforme"],["descricao","Observações","textarea"]],
 epis:[["titulo","Equipamento","text",true],["tipo","Categoria","select","Capacete|Óculos|Luvas|Cinturão|Botina|Protetor auricular|Outro"],["responsavel","Colaborador","text",true],["data","Data de entrega","date",true],["validade","Validade ou revisão","date"],["status","Situação","select","Entregue|Pendente|Vencido|Substituído"],["descricao","CA / série / observações","textarea"]],
 treinamentos:[["titulo","Treinamento","text",true],["tipo","Norma","select","NR-10|NR-35|NR-06|NR-01|Direção defensiva|Integração|Outros"],["responsavel","Turma / colaborador","text",true],["data","Realização","date",true],["validade","Reciclagem","date"],["status","Situação","select","Em dia|Pendente|Vencido"],["descricao","Observações","textarea"]],
 acoes:[["titulo","Ação corretiva","text",true],["tipo","Origem","select","Inspeção|Incidente|Auditoria|Treinamento|Preventiva"],["responsavel","Responsável","text",true],["data","Abertura","date",true],["prazo","Prazo","date",true],["prioridade","Prioridade","select","Baixa|Média|Alta|Crítica"],["status","Status","select","Aberta|Em andamento|Concluída"],["descricao","Plano de ação","textarea"]],
 colaboradores:[["titulo","Nome completo","text",true],["tipo","Função","select","Técnico|Supervisor|Técnico de SST|Coordenador|Gestor|Outro"],["setor","Setor","select","Campo|MDU|Construção|Técnico|Comercial|Administrativo"],["responsavel","Matrícula","text"],["data","Admissão","date"],["status","Situação","select","Ativo|Afastado|Inativo"],["descricao","Observações","textarea"]]
};
const display={
 incidentes:["titulo","tipo","data","setor","gravidade","status"],inspecoes:["titulo","tipo","data","responsavel","status"],epis:["titulo","tipo","responsavel","validade","status"],treinamentos:["titulo","tipo","responsavel","validade","status"],acoes:["titulo","responsavel","prazo","prioridade","status"],colaboradores:["titulo","tipo","setor","responsavel","status"]
};
const symbols={
 "layout-dashboard":'<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
 "alert-triangle":'<path d="M10.3 3.8 2.2 17.8a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3l-8.1-14a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 4h.01"/>',
 "clipboard-check":'<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4h6V2H9zM9 14l2 2 4-4"/>',
 "hard-hat":'<path d="M3 18h18v3H3zM5 18v-4a7 7 0 0 1 14 0v4M12 7v7"/>',
 "graduation-cap":'<path d="m2 10 10-5 10 5-10 5-10-5Zm4 3v5c4 3 8 3 12 0v-5M22 10v7"/>',
 "list-checks":'<path d="m3 7 2 2 3-4M11 7h10M3 17l2 2 3-4M11 17h10"/>',
 "users":'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3a4 4 0 0 1 0 8"/>',
 "chart-column":'<path d="M3 3v18h18M7 16v-5M12 16V7M17 16v-9"/>',
 "shield-check":'<path d="M12 22s9-4 9-10V5l-9-3-9 3v7c0 6 9 10 9 10Z"/><path d="m9 12 2 2 4-4"/>',
 "chevrons-up-down":'<path d="m7 9 5-5 5 5M7 15l5 5 5-5"/>',
 "menu":'<path d="M4 6h16M4 12h16M4 18h16"/>',
 "moon":'<path d="M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z"/>',
 "sun":'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.5 1.5m11.2 11.2 1.5 1.5M2 12h2m16 0h2M5 19l1.4-1.4M17.6 6.4 19 5"/>',
 "user-round":'<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
 "plus":'<path d="M12 5v14M5 12h14"/>',
 "download":'<path d="M12 3v12m-4-4 4 4 4-4M5 17v4h14v-4"/>',
 "activity":'<path d="M2 12h4l3-8 6 16 3-8h4"/>',
 "check-circle":'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
 "clock":'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
 "search":'<circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/>',
 "edit":'<path d="m5 19 4-.8L20 7a2 2 0 0 0-3-3L6 15l-1 4Z"/>',
 "trash":'<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6m4-6v6"/>',
 "x":'<path d="M6 6l12 12M18 6 6 18"/>',
 "save":'<path d="M4 4h13l3 3v13H4V4Zm3 0v6h9V4M7 20v-7h10v7"/>',
 "log-in":'<path d="M10 17l5-5-5-5M15 12H3M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/>',
 "info":'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
 "file-text":'<path d="M13 2H5v20h14V8l-6-6ZM13 2v6h6M9 13h6M9 17h6"/>'
};
function ico(key){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(symbols[key]||symbols.info)+'</svg>';}
function icons(){document.querySelectorAll("[data-icon]").forEach(el=>el.innerHTML=ico(el.dataset.icon));}
function escape(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function today(n=0){let d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);}
function date(v){if(!v)return "—";let d=new Date(v+"T12:00:00");return Number.isNaN(d.getTime())?escape(v):d.toLocaleDateString("pt-BR");}
function sorted(a){return [...a].sort((x,y)=>String(y.criadoEm||y.data||"").localeCompare(String(x.criadoEm||x.data||"")));}

function emptyData(){return Object.fromEntries(keys.map(k=>[k,[]]));}
let data=emptyData(),user=null,role="leitura",mode="loading",current="dashboard",search="",statusFilter="",editing=null;
let sessionVersion=0,accessError="";
try{localStorage.removeItem("technet-sst-demo-v2");}catch{}

function canWrite(){return mode==="cloud"&&["admin","supervisor","sst"].includes(role);}
function count(k){return data[k].length;}
function toast(text,error=false){let el=document.createElement("div");el.className="toast"+(error?" error":"");el.textContent=text;$("#toast-region").append(el);setTimeout(()=>el.remove(),4600);}
function pill(v){let color=["Conforme","Resolvido","Concluída","Em dia","Entregue","Ativo"].includes(v)?"green":["Vencido","Não conforme","Aberto","Aberta","Crítica","Inativo"].includes(v)?"red":["Pendente","Em análise","Em andamento","Alta","Média"].includes(v)?"yellow":"blue";return '<span class="status status-'+color+'">'+escape(v||"—")+'</span>';}
function button(text,icon,action,style="btn-muted"){return '<button type="button" class="btn '+style+'" data-action="'+action+'">'+ico(icon)+escape(text)+'</button>';}
function intro(title,description,buttons){return '<section class="page-intro"><div><span class="eyebrow">PAINEL DE CONTROLE · SST</span><h1>'+escape(title)+'</h1><p class="subtitle">'+escape(description)+'</p></div><div class="page-actions">'+(buttons||"")+'</div></section>';}
function banner(){return "";}
function kpi(title,num,icon,color,foot){return '<article class="card kpi-card"><div class="kpi-top"><span>'+escape(title)+'</span><span class="kpi-icon ic-'+color+'">'+ico(icon)+'</span></div><div class="kpi-value">'+escape(num)+'</div><div class="kpi-foot">'+foot+'</div></article>';}
function charts(){let now=new Date(),months=[];for(let i=5;i>=0;i--){let d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push({month:d.getMonth(),year:d.getFullYear(),name:d.toLocaleDateString("pt-BR",{month:"short"}).replace(".","")});}let getCnt=(k,m)=>data[k].filter(x=>{let d=new Date((x.data||"2000-01-01")+"T12:00:00");return d.getMonth()===m.month&&d.getFullYear()===m.year;}).length;let values=months.map(m=>[getCnt("inspecoes",m),getCnt("incidentes",m)]),max=Math.max(5,...values.flat());let bars=months.map((m,i)=>'<div class="bar-col"><div class="bar-bars"><div class="bar secondary" style="--bar-h:'+(values[i][0]/max*94)+'%" data-tip="'+values[i][0]+' inspeções"></div><div class="bar" style="--bar-h:'+(values[i][1]/max*94)+'%" data-tip="'+values[i][1]+' ocorrências"></div></div><span class="bar-label">'+escape(m.name)+'</span></div>').join("");return '<article class="card chart-card"><div class="card-heading"><div><h2>Indicadores mensais</h2><p>Inspeções e ocorrências nos últimos 6 meses</p></div><span class="chip">Últimos 6 meses</span></div><div class="bar-chart">'+bars+'</div><div class="chart-legend"><span><i class="legend-dot secondary"></i> Inspeções</span><span><i class="legend-dot"></i> Ocorrências</span></div></article>';}
function donut(){let checks=data.inspecoes,good=checks.filter(x=>x.status==="Conforme").length,pending=checks.filter(x=>x.status==="Pendente").length,bad=checks.filter(x=>x.status==="Não conforme").length,all=Math.max(checks.length,1),g=(good/all*100).toFixed(1)+"%",m=((good+pending)/all*100).toFixed(1)+"%";return '<article class="card chart-card"><div class="card-heading"><div><h2>Conformidade das inspeções</h2><p>Distribuição por resultado</p></div>'+ico("clipboard-check")+'</div><div class="donut-wrap"><div class="donut" style="--good:'+g+';--mid:'+m+'"><div class="donut-hole"><b>'+Math.round(good/all*100)+'%</b><small>Conformes</small></div></div><div class="donut-legend"><div class="donut-row"><span><i class="dot dot-green"></i> Conforme</span><b>'+good+'</b></div><div class="donut-row"><span><i class="dot dot-yellow"></i> Pendente</span><b>'+pending+'</b></div><div class="donut-row"><span><i class="dot dot-red"></i> Não conforme</span><b>'+bad+'</b></div></div></div></article>';}
function feed(){let all=keys.filter(x=>x!=="colaboradores").flatMap(k=>data[k].map(r=>({...r,_section:k})));let recent=sorted(all).slice(0,4);return '<article class="card section-card"><div class="card-heading"><div><h2>Atividade recente</h2><p>Últimos registros na plataforma</p></div><span class="chip">Atualizações</span></div><div class="timeline">'+(recent.length?recent.map(r=>'<div class="timeline-item"><span class="timeline-icon ic-'+(r._section==="incidentes"?"red":"green")+'">'+ico(r._section==="incidentes"?"alert-triangle":"clipboard-check")+'</span><div class="timeline-text"><strong>'+escape(r.titulo)+'</strong><small>'+escape(names[r._section])+' · '+escape(r.responsavel||"Equipe")+'</small></div><span class="timeline-time">'+date((r.criadoEm||"").slice(0,10))+'</span></div>').join(""):"<p>Nenhum registro encontrado.</p>")+'</div></article>';}
function tasks(){let active=data.acoes.filter(x=>x.status!=="Concluída").slice(0,4);return '<article class="card section-card"><div class="card-heading"><div><h2>Ações prioritárias</h2><p>Planos em acompanhamento</p></div><a href="#acoes" class="chip">Ver todas →</a></div><div class="tasklist">'+(active.length?active.map(a=>'<div class="task"><span class="priority '+(["Crítica","Alta"].includes(a.prioridade)?"high":a.prioridade==="Baixa"?"low":"")+'"></span><div class="task-content"><b>'+escape(a.titulo)+'</b><small>'+escape(a.responsavel||"Equipe")+' · Prazo: '+date(a.prazo)+'</small></div>'+pill(a.status)+'</div>').join(""):"<p>Sem pendências cadastradas.</p>")+'</div></article>';}
function documentsOverview(){
 const stat=libraryStats();
 return '<section class="card docs-overview"><div><span class="eyebrow">BIBLIOTECA SST · PRODUÇÃO</span><h2>Documentação técnica cadastrada</h2><p>Programas e evidências recuperados diretamente do Cloud Firestore.</p></div><div class="docs-metrics"><div><strong>'+stat.vigentes+'</strong><span>PGRs mais recentes</span></div><div><strong>'+stat.totalPgr+'</strong><span>Versões de PGR</span></div><div><strong>'+stat.evidencias+'</strong><span>Evidências vinculadas</span></div></div><a href="#programas" class="btn btn-primary">Abrir biblioteca →</a></section>';
}
function home(){let checks=count("inspecoes"),good=data.inspecoes.filter(x=>x.status==="Conforme").length,pending=data.acoes.filter(x=>x.status!=="Concluída").length;return intro("Visão geral","Centro de inteligência de SST da TECHNET.",button("Exportar dados","download","export-all")+button("Novo registro","plus","new-incidentes","btn-primary"))+banner()+'<div class="kpi-grid">'+kpi("Colaboradores",count("colaboradores"),"users","blue","Equipe cadastrada")+kpi("Ocorrências",count("incidentes"),"alert-triangle","red","Registros de incidentes")+kpi("Inspeções conformes",checks?Math.round(100*good/checks)+"%":"0%","shield-check","green",good+" de "+checks+" inspeções")+kpi("Ações pendentes",pending,"clock","orange","Precisam de atenção")+'</div><div class="dashboard-grid">'+charts()+donut()+'</div><div class="dashboard-bottom">'+feed()+tasks()+'</div>'+documentsOverview();}
function cell(key,value){return ["status","gravidade","prioridade"].includes(key)?pill(value):["data","validade","prazo"].includes(key)?date(value):escape(value||"—");}
function rows(section){let a=sorted(data[section]);if(search){let q=search.toLowerCase();a=a.filter(r=>Object.values(r).some(v=>String(v??"").toLowerCase().includes(q)));}if(statusFilter)a=a.filter(r=>r.status===statusFilter);return a.map(r=>'<tr>'+display[section].map(k=>'<td>'+(k==="titulo"?'<strong>'+cell(k,r[k])+'</strong>':cell(k,r[k]))+'</td>').join("")+'<td><div class="table-row-actions">'+(canWrite()?'<button type="button" title="Editar" data-action="edit" data-section="'+section+'" data-id="'+escape(r.id)+'">'+ico("edit")+'</button><button type="button" title="Excluir" data-action="delete" data-section="'+section+'" data-id="'+escape(r.id)+'">'+ico("trash")+'</button>':"Somente leitura")+'</div></td></tr>').join("");}
function listing(section){let states=[...new Set(data[section].map(r=>r.status).filter(Boolean))];return intro(names[section],descriptions[section],button("Exportar CSV","download","export-"+section)+(canWrite()?button("Novo registro","plus","new-"+section,"btn-primary"):""))+banner()+'<article class="card table-card"><div class="table-toolbar"><div><h2>Registros cadastrados</h2><p class="subtitle">'+count(section)+' registro(s) no total</p></div><div class="table-actions"><label class="search-box">'+ico("search")+'<input id="table-search" autocomplete="off" placeholder="Buscar registros..." value="'+escape(search)+'"></label><select class="filter-select" id="table-filter"><option value="">Todos os status</option>'+states.map(s=>'<option value="'+escape(s)+'" '+(s===statusFilter?"selected":"")+'>'+escape(s)+'</option>').join("")+'</select></div></div><div class="table-scroll"><table class="data-table"><thead><tr>'+display[section].map(k=>'<th>'+escape(specs[section].find(s=>s[0]===k)?.[1]||k)+'</th>').join("")+'<th>Ações</th></tr></thead><tbody id="table-body">'+rows(section)+'</tbody></table></div><div class="empty-state" id="empty-filter" '+(rows(section)?"hidden":"")+'>'+ico("search")+'<strong>Nenhum resultado</strong><p>Altere os filtros ou crie um registro.</p></div></article>';}
function reports(){return intro("Relatórios","Exporte os dados para auditorias e acompanhamento gerencial.",button("Exportar tudo","download","export-all","btn-primary"))+banner()+'<div class="report-callout">'+ico("shield-check")+'<span>Verifique os dados e documentos originais antes de usá-los como evidência normativa.</span></div><div class="report-grid">'+keys.map(k=>'<article class="card report-box"><span class="kpi-icon ic-blue">'+ico("file-text")+'</span><h3>'+escape(names[k])+'</h3><p>'+escape(descriptions[k])+'</p><div class="mini-progress"><div style="width:'+Math.min(count(k)*15,100)+'%"></div></div><p>'+count(k)+' registros</p>'+button("Baixar CSV","download","export-"+k)+'</article>').join("")+'</div>';}

function updateGate(){
 const ready=mode==="cloud";
 $("#app").hidden=!ready;
 $("#auth-gate").hidden=ready;
 if(ready)return;
 const text={
  loading:"Validando sua conta e carregando as informações do Firestore...",
  signed_out:"Faça login com uma conta Google autorizada pela TECHNET.",
  denied:accessError||"Esta conta ainda não possui autorização para utilizar o TECHNET SST.",
  error:accessError||"Ocorreu um erro ao carregar os dados. Tente novamente."
 };
 $("#gate-status").textContent=text[mode]||"Preparando ambiente...";
 $("#gate-status").classList.toggle("is-error",mode==="denied"||mode==="error");
 $("#gate-google-login").hidden=mode!=="signed_out";
 $("#gate-retry").hidden=mode!=="error";
 $("#gate-switch").hidden=!user||!(mode==="denied"||mode==="error");
}
function header(){
 $("#environment-pill").className="environment-pill online";
 $("#environment-pill").innerHTML='<span class="pulse-dot"></span> Produção · Firebase';
 $("#footer-state").textContent="Produção · Cloud Firestore";
 $("#user-label").textContent=user?.displayName||user?.email||"Usuário";
 $("#user-description").textContent="Perfil: "+role;
 $("#avatar").textContent=(user?.displayName||user?.email||"T")[0].toUpperCase();
 $("#signout").hidden=!user;
 $("#auth-message").textContent="Sessão autenticada. Os dados são carregados do Firebase de acordo com seu perfil de acesso.";
}
function render(){
 updateGate();
 if(mode!=="cloud")return;
 const hash=location.hash.slice(1);
 current=names[hash]?hash:"dashboard";
 $("#breadcrumb-current").textContent=names[current];
 document.querySelectorAll("[data-route]").forEach(el=>el.classList.toggle("active",el.dataset.route===current));
 $("#pending-badge").textContent=data.acoes.filter(x=>x.status!=="Concluída").length;
 $("#content").innerHTML=current==="dashboard"?home():current==="relatorios"?reports():["evidencias","programas"].includes(current)?renderLibrary(current):listing(current);
 icons();header();
}

function formFields(section,old){return specs[section].map(([key,label,type,opts])=>{let v=old?.[key]??(key==="data"?today():""),required=opts===true?"required":"";let control=type==="select"?'<select name="'+key+'"><option value="">Selecione...</option>'+String(opts).split("|").map(c=>'<option value="'+escape(c)+'" '+(v===c?"selected":"")+'>'+escape(c)+'</option>').join("")+'</select>':type==="textarea"?'<textarea name="'+key+'">'+escape(v)+'</textarea>':'<input type="'+type+'" name="'+key+'" value="'+escape(v)+'" '+required+' maxlength="180">';return '<div class="form-field '+(key==="titulo"||type==="textarea"?"wide":"")+'"><label>'+escape(label)+(required?" *":"")+'</label>'+control+'</div>';}).join("");}
function openForm(section,id){if(!canWrite()){toast("Você não tem permissão para alterar registros.",true);return;}editing=id||null;$("#record-form").dataset.section=section;$("#dialog-title").textContent=(id?"Editar ":"Novo registro · ")+names[section];$("#form-fields").innerHTML=formFields(section,id?data[section].find(r=>r.id===id):null);$("#record-dialog").showModal();}

async function refresh(version=sessionVersion){
 const expectedUid=user?.uid;
 if(!expectedUid||auth.currentUser?.uid!==expectedUid||version!==sessionVersion)throw Error("Sessão expirada.");
 const entries=await Promise.all(keys.map(async k=>{
  const snap=await getDocs(collection(db,k));
  return [k,snap.docs.map(record=>({...record.data(),id:record.id}))];
 }));
 if(auth.currentUser?.uid!==expectedUid||version!==sessionVersion)return;
 await loadLibrary();
 if(auth.currentUser?.uid!==expectedUid||version!==sessionVersion){clearLibrary();return;}
 data=Object.fromEntries(entries);
 mode="cloud";
 render();
}
async function save(event){
 event.preventDefault();
 if(!canWrite())return toast("Acesso não autorizado.",true);
 const section=event.currentTarget.dataset.section;
 const values=Object.fromEntries(new FormData(event.currentTarget).entries());
 if(!values.titulo?.trim())return toast("Informe o título do registro.",true);
 const old=data[section].find(r=>r.id===editing);
 const entry={...values,criadoEm:old?.criadoEm||new Date().toISOString(),atualizadoEm:new Date().toISOString()};
 $("#save-record").disabled=true;
 try{
  if(editing)await updateDoc(doc(db,section,editing),entry);
  else await addDoc(collection(db,section),entry);
  await refresh();
  $("#record-dialog").close();
  toast("Registro salvo no Firestore.");
 }catch(err){
  console.error("Falha ao salvar",err);
  toast("Não foi possível salvar ou atualizar a tela. Verifique sua conexão e as permissões.",true);
 }finally{$("#save-record").disabled=false;}
}
async function remove(section,id){
 if(!canWrite())return;
 const item=data[section].find(r=>r.id===id);
 if(!item||!confirm('Excluir "'+item.titulo+'"? Esta ação não pode ser desfeita.'))return;
 try{
  await deleteDoc(doc(db,section,id));
  await refresh();
  toast("Registro excluído do Firestore.");
 }catch(err){
  console.error("Falha ao excluir",err);
  toast("Não foi possível excluir ou atualizar os dados.",true);
 }
}

function download(text,filename,type){let blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function exportCsv(k){let cols=["id",...specs[k].map(s=>s[0]),"criadoEm"];let out=[cols,...data[k].map(r=>cols.map(x=>r[x]||""))].map(row=>row.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(";")).join("\r\n");download("\ufeff"+out,"TECHNET-SST-"+k+"-"+today()+".csv","text/csv;charset=utf-8");toast("CSV preparado.");}
function exportAll(){download(JSON.stringify({projeto:"TECHNET SST",ambiente:mode,exportadoEm:new Date().toISOString(),dados:data},null,2),"TECHNET-SST-"+today()+".json","application/json;charset=utf-8");toast("Backup exportado.");}

async function login(){
 try{
  await signInWithPopup(auth,provider);
  if($("#auth-dialog").open)$("#auth-dialog").close();
 }catch(err){
  console.error("Falha de autenticação",err);
  const messages={
   "auth/operation-not-allowed":"O provedor Google não está habilitado no Firebase Authentication.",
   "auth/popup-blocked":"O navegador bloqueou a janela do Google. Permita pop-ups.",
   "auth/unauthorized-domain":"O domínio deste site não está autorizado no Firebase.",
   "auth/popup-closed-by-user":"Login cancelado."
  };
  const message=messages[err.code]||"Não foi possível autenticar com o Google. Verifique a conta e tente novamente.";
  $("#auth-message").textContent=message;
  accessError=message;
  if(mode==="signed_out")$("#gate-status").textContent=message;
  toast(message,true);
 }
}
setupLibrary({db,auth,getCtx:()=>({mode,user,role}),toast,rerender:render});
async function bootstrap(currentUser){
 const version=++sessionVersion;
 clearLibrary();
 data=emptyData();
 user=currentUser;
 role="leitura";
 accessError="";
 mode=currentUser?"loading":"signed_out";
 render();
 if(!currentUser)return;
 try{
  if(currentUser.emailVerified!==true)throw Error("A conta Google precisa ter o e-mail verificado.");
  if(currentUser.email?.toLowerCase()===OWNER){
   role="admin";
  }else{
   const profile=await getDoc(doc(db,"usuarios",currentUser.uid));
   if(!profile.exists()||profile.data().ativo!==true){
    throw Error("Acesso não autorizado: sua conta ainda não foi cadastrada pelo administrador SST.");
   }
   role=["admin","supervisor","sst","leitura"].includes(profile.data().perfil)?profile.data().perfil:"leitura";
  }
  if(version!==sessionVersion)return;
  await refresh(version);
 }catch(err){
  if(version!==sessionVersion)return;
  console.error("Erro de acesso",err);
  data=emptyData();
  clearLibrary();
  accessError=err.message?.startsWith("Acesso não autorizado")||err.message?.startsWith("A conta Google")
   ?err.message
   :"Não foi possível carregar os dados do Firebase. Confira sua conexão e tente novamente.";
  mode=accessError.startsWith("Não foi possível")?"error":"denied";
  render();
 }
}
onAuthStateChanged(auth,bootstrap,err=>{
 console.error("Falha ao validar sessão Firebase",err);
 ++sessionVersion;
 user=null;role="leitura";mode="error";
 data=emptyData();clearLibrary();
 accessError="Falha ao validar a sessão do Firebase. Tente recarregar a página.";
 render();
});

document.addEventListener("click",ev=>{let el=ev.target.closest("[data-action]");if(!el)return;let act=el.dataset.action;if(act==="login")$("#auth-dialog").showModal();else if(act.startsWith("new-"))openForm(act.slice(4));else if(act==="edit")openForm(el.dataset.section,el.dataset.id);else if(act==="delete")remove(el.dataset.section,el.dataset.id);else if(act.startsWith("export-"))act==="export-all"?exportAll():exportCsv(act.slice(7));});
function filterRows(){if(!keys.includes(current))return;let contents=rows(current);$("#table-body").innerHTML=contents;$("#empty-filter").hidden=!!contents;}
document.addEventListener("input",ev=>{if(ev.target.id==="table-search"){search=ev.target.value;filterRows();}});
document.addEventListener("change",ev=>{if(ev.target.id==="table-filter"){statusFilter=ev.target.value;filterRows();}});
window.addEventListener("hashchange",()=>{search="";statusFilter="";render();$("#sidebar").classList.remove("open");$("#overlay").hidden=true;});
$("#record-form").addEventListener("submit",save);
$("#dialog-close").addEventListener("click",()=>$("#record-dialog").close());
$("#dialog-cancel").addEventListener("click",()=>$("#record-dialog").close());
$("#auth-close").addEventListener("click",()=>$("#auth-dialog").close());
$("#account-btn").addEventListener("click",()=>$("#auth-dialog").showModal());
$("#login-button").addEventListener("click",()=>$("#auth-dialog").showModal());
$("#google-login").addEventListener("click",login);
$("#signout").addEventListener("click",async()=>{await signOut(auth);if($("#auth-dialog").open)$("#auth-dialog").close();toast("Sessão encerrada.");});
$("#gate-google-login").addEventListener("click",login);
$("#gate-switch").addEventListener("click",login);
$("#gate-retry").addEventListener("click",()=>bootstrap(auth.currentUser));
$("#menu-toggle").addEventListener("click",()=>{$("#sidebar").classList.add("open");$("#overlay").hidden=false;});
$("#overlay").addEventListener("click",()=>{$("#sidebar").classList.remove("open");$("#overlay").hidden=true;});
$("#theme-toggle").addEventListener("click",()=>{let dark=document.body.classList.toggle("dark");localStorage.setItem("technet-sst-theme",dark?"dark":"light");$("#theme-toggle").innerHTML=ico(dark?"sun":"moon");});
if(localStorage.getItem("technet-sst-theme")==="dark"){document.body.classList.add("dark");$("#theme-toggle").innerHTML=ico("sun");}
render();
