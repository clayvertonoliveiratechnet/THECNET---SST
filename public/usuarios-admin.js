import {collection,doc,getDocs,writeBatch,updateDoc} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
const OWNER="clayvertonoliveira@gmail.com";
const ROLES={admin:"Administrador",supervisor:"Supervisor",sst:"Equipe SST",leitura:"Somente leitura"};
const AREAS=["Campo","MDU","Construção","Técnico","Comercial","Administrativo","SST"];
let services=null;
let state={invites:[],legacy:[],loading:false,error:"",ready:false,saving:false,filter:""};
const $=s=>document.querySelector(s);
const safe=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const normalize=s=>String(s||"").trim().toLowerCase();
const emailOk=s=>/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(s)&&s.length<=254;
const isAdmin=()=>services?.getCtx().mode==="cloud" && services?.getCtx().role==="admin";
const allCollaborators=()=>services?.getCollaborators()||[];
const labelRole=r=>ROLES[r]||"Somente leitura";
function marker(status){return '<span class="status '+(status?"status-green":"status-red")+'">'+(status?"Ativo":"Bloqueado")+'</span>';}
function eButton(text,action,src="",id="",variant="btn-muted"){return '<button type="button" class="btn '+variant+'" data-user-action="'+action+'" data-source="'+safe(src)+'" data-id="'+safe(id)+'">'+safe(text)+'</button>';}
function roles(value){return Object.entries(ROLES).map(([k,v])=>'<option value="'+k+'" '+(k===value?"selected":"")+'>'+v+'</option>').join("");}
function selectAreas(value){return AREAS.map(v=>'<option '+(value===v?"selected":"")+' value="'+v+'">'+v+'</option>').join("");}
function field(label,key,type="text",value="",attr=""){return '<div class="form-field"><label>'+safe(label)+'</label><input name="'+key+'" type="'+type+'" value="'+safe(value)+'" '+attr+'></div>';}
function usersTable(){
 const f=normalize(state.filter);
 const invite=state.invites.filter(u=>!f||[u.nome,u.email,u.perfil,u.setor].join(" ").toLowerCase().includes(f));
 const legacy=state.legacy.filter(u=>!f||[u.email,u.nome,u.id,u.perfil].join(" ").toLowerCase().includes(f));
 const rows=invite.map(u=>'<tr><td><strong>'+safe(u.nome||u.email)+'</strong><small>'+safe(u.email)+'</small></td><td>'+safe(labelRole(u.perfil))+'</td><td>'+safe(u.setor||"—")+'</td><td>'+marker(u.ativo===true)+'</td><td><small>'+(u.colaboradorId?"Vinculado ao colaborador":"Sem vínculo")+'</small></td><td><div class="um-actions">'+eButton("Editar","edit","invite",u.id)+eButton(u.ativo?"Bloquear":"Ativar","toggle","invite",u.id,u.ativo?"btn-danger":"btn-muted")+'</div></td></tr>').join("");
 const old=legacy.map(u=>'<tr><td><strong>'+safe(u.nome||u.email||"Conta legada")+'</strong><small>UID: '+safe(u.id)+'</small></td><td>'+safe(labelRole(u.perfil))+'</td><td>'+safe(u.setor||"—")+'</td><td>'+marker(u.ativo===true)+'</td><td><small>Cadastro antigo por UID</small></td><td><div class="um-actions">'+eButton("Editar","edit","legacy",u.id)+eButton(u.ativo?"Bloquear":"Ativar","toggle","legacy",u.id,u.ativo?"btn-danger":"btn-muted")+'</div></td></tr>').join("");
 return rows+old||'<tr><td colspan="6"><div class="um-empty">Nenhum usuário cadastrado nesta lista. Clique em <b>Novo acesso</b> para começar.</div></td></tr>';
}
function updateTable(){
 if($("#um-body"))$("#um-body").innerHTML=usersTable();
 if($("#um-count"))$("#um-count").textContent=String(state.invites.length+state.legacy.length);
 if($("#um-active"))$("#um-active").textContent=String([...state.invites,...state.legacy].filter(x=>x.ativo===true).length);
 if($("#um-pending"))$("#um-pending").textContent=String(state.invites.filter(x=>!x.colaboradorId).length);
}
export function renderUserAdmin(){
 if(!isAdmin())return '<div class="card section-card"><h2>Acesso restrito</h2><p>Somente administradores autorizados podem gerenciar usuários.</p></div>';
 const load=state.loading?'<p class="um-feedback">Carregando contas autorizadas...</p>':state.error?'<p class="um-error">'+safe(state.error)+'</p>':"";
 return '<section class="page-intro"><div><span class="eyebrow">ADMINISTRAÇÃO · TECHNET SST</span><h1>Gestão de usuários</h1><p class="subtitle">Autorize contas Google, vincule colaboradores e controle os perfis de acesso.</p></div><div class="page-actions">'+eButton("Atualizar","refresh")+eButton("+ Novo acesso","new","","","btn-primary")+'</div></section>'+
 '<div class="um-infotip"><span>🔐</span><div><b>Acesso sem senha manual</b><p>Cadastre o e-mail Google do colaborador. Ele poderá entrar com esse mesmo e-mail pela tela de login do TECHNET SST. O sistema não envia convite por e-mail automaticamente.</p></div></div>'+
 '<div class="um-summary"><div class="card"><b id="um-count">'+(state.invites.length+state.legacy.length)+'</b><span>Contas cadastradas</span></div><div class="card"><b id="um-active">'+[...state.invites,...state.legacy].filter(u=>u.ativo).length+'</b><span>Acessos ativos</span></div><div class="card"><b id="um-pending">'+state.invites.filter(u=>!u.colaboradorId).length+'</b><span>Sem colaborador vinculado</span></div></div>'+
 '<section class="card um-card"><div class="um-heading"><div><h2>Contas e permissões</h2><p class="subtitle">As alterações são aplicadas nas regras do Firebase em cada consulta.</p></div><label class="um-search"><span>⌕</span><input id="um-filter" value="'+safe(state.filter)+'" placeholder="Buscar nome, e-mail ou perfil" aria-label="Filtrar contas"></label></div>'+load+
 '<div class="table-scroll"><table class="data-table um-table"><thead><tr><th>Usuário</th><th>Perfil</th><th>Setor</th><th>Situação</th><th>Colaborador</th><th>Ações</th></tr></thead><tbody id="um-body">'+usersTable()+'</tbody></table></div></section>'+
 '<div class="um-roles"><div><strong>Administrador</strong><p>Controla acessos e todos os módulos.</p></div><div><strong>Supervisor</strong><p>Cadastra, edita e consulta registros SST.</p></div><div><strong>Equipe SST</strong><p>Cadastra, edita e consulta registros SST.</p></div><div><strong>Somente leitura</strong><p>Consulta os registros sem alterar dados.</p></div></div>';
}
export async function loadUserAdmin(){
 if(!isAdmin()||!services)return;
 state.loading=true;state.error="";
 try{
  const [inv,old]=await Promise.all([getDocs(collection(services.db,"convites")),getDocs(collection(services.db,"usuarios"))]);
  state.invites=inv.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.nome||a.email||"").localeCompare(b.nome||b.email||"","pt-BR"));
  state.legacy=old.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.nome||a.email||"").localeCompare(b.nome||b.email||"","pt-BR"));
  state.ready=true;
 }catch(err){console.error("users load",err);state.error="Não foi possível consultar os usuários. Confira as permissões e tente novamente.";}
 finally{state.loading=false;}
}
export function resetUserAdmin(){state={invites:[],legacy:[],loading:false,error:"",ready:false,saving:false,filter:""};}
function showModal(source,id){
 if(!isAdmin())return;
 const existing=source==="invite"?state.invites.find(x=>x.id===id):source==="legacy"?state.legacy.find(x=>x.id===id):null;
 const legacy=source==="legacy";
 $("#um-dialog-title").textContent=legacy?"Editar conta existente":existing?"Editar autorização":"Novo acesso";
 const assoc=existing?(existing.colaboradorId||"nenhum"):"novo";
 const opts='<option value="novo" '+(assoc==="novo"?"selected":"")+'>Criar colaborador com estes dados</option>'+
  '<option value="nenhum">Autorizar sem cadastrar colaborador</option>'+
  allCollaborators().map(u=>'<option value="'+safe(u.id)+'" '+(assoc===u.id?"selected":"")+'>'+safe(u.titulo||"Colaborador")+' · '+safe(u.responsavel||"")+'</option>').join("");
 $("#um-fields").innerHTML=legacy?
  '<p class="um-note">Conta cadastrada anteriormente pelo UID do Firebase. A edição não altera o e-mail de login.</p><div class="form-field"><label>Identificador da conta</label><input value="'+safe(id)+'" disabled></div><div class="form-field"><label>Perfil</label><select name="perfil">'+roles(existing?.perfil||"leitura")+'</select></div><label class="um-check"><input type="checkbox" name="ativo" '+(existing?.ativo?"checked":"")+'> Acesso autorizado</label>':
  field("E-mail Google *","email","email",existing?.email||'','required maxlength="254" '+(existing?"readonly":""))+
  field("Nome completo *","nome","text",existing?.nome||"",'required maxlength="150"')+
  '<div class="form-field"><label>Perfil de acesso</label><select name="perfil">'+roles(existing?.perfil||"leitura")+'</select></div>'+
  '<div class="form-field"><label>Colaborador</label><select name="colaboradorId" id="um-colab-select">'+opts+'</select></div>'+
  '<div id="um-new-colab" class="um-subform">'+
  '<div class="form-field"><label>Função</label><select name="tipo">'+["Técnico","Supervisor","Técnico de SST","Coordenador","Gestor","Outro"].map(v=>'<option '+(v===existing?.tipo?"selected":"")+'>'+v+'</option>').join("")+'</select></div>'+
  '<div class="form-field"><label>Setor</label><select name="setor">'+selectAreas(existing?.setor||"SST")+'</select></div>'+
  field("Matrícula (opcional)","matricula","text",existing?.matricula||"",'maxlength="45"')+
  '</div><label class="um-check"><input type="checkbox" name="ativo" '+(!existing||existing.ativo?"checked":"")+'> Autorizar acesso ao sistema</label>';
 $("#um-form").dataset.source=source||"invite";$("#um-form").dataset.id=id||"";
 $("#um-submit").disabled=false;
 $("#um-dialog").showModal();
 syncColabSelect();
}
function syncColabSelect(){
 const el=$("#um-colab-select");
 const sub=$("#um-new-colab");
 if(el&&sub)sub.hidden=el.value!=="novo";
}
async function saveForm(ev){
 ev.preventDefault();
 if(!isAdmin()||state.saving)return;
 const form=ev.currentTarget,source=form.dataset.source,id=form.dataset.id,fd=new FormData(form);
 const isLegacy=source==="legacy",profile=fd.get("perfil"),active=fd.get("ativo")==="on";
 if(!(profile in ROLES))return services.toast("Perfil inválido.",true);
 let email="",nome="",selected="",employeeDoc=null,invite=null;
 if(!isLegacy){
  email=normalize(fd.get("email"));
  nome=String(fd.get("nome")||"").trim();
  selected=String(fd.get("colaboradorId")||"nenhum");
  if(!emailOk(email)||!nome)return services.toast("Informe um e-mail válido e o nome completo.",true);
  if(email===OWNER)return services.toast("A conta proprietária já possui acesso permanente.",true);
  if(email===normalize(services.auth.currentUser?.email)&&!active)return services.toast("Você não pode desativar o próprio acesso.",true);
  if(!id && state.invites.some(x=>x.email===email))return services.toast("Este e-mail já possui autorização. Edite o registro existente.",true);
  if(!id && state.legacy.some(x=>normalize(x.email)===email))return services.toast("Este e-mail tem cadastro legado: edite essa conta para alterar o acesso.",true);
  if(selected!=="novo"&&selected!=="nenhum"&&!allCollaborators().some(x=>x.id===selected))return services.toast("Colaborador selecionado não encontrado.",true);
 }
 state.saving=true;$("#um-submit").disabled=true;
 try{
  const batch=writeBatch(services.db);
  if(isLegacy){
   const previous=state.legacy.find(u=>u.id===id);
   if(!previous)throw Error("Conta não encontrada.");
   if(id===services.auth.currentUser?.uid&&!active)throw Error("Você não pode desativar a própria conta.");
   batch.update(doc(services.db,"usuarios",id),{perfil:profile,ativo:active,atualizadoEm:new Date().toISOString()});
  }else{
   const original=state.invites.find(u=>u.id===id);
   let employeeId=selected==="novo"?"":selected==="nenhum"?"":selected;
   const linked=allCollaborators().find(c=>c.id===selected);
   const sector=selected==="novo"?String(fd.get("setor")||"SST"):String(linked?.setor||original?.setor||"");
   const kind=selected==="novo"?String(fd.get("tipo")||"Técnico"):String(linked?.tipo||original?.tipo||"");
   const matricula=selected==="novo"?String(fd.get("matricula")||"").trim():String(linked?.responsavel||original?.matricula||"");
   if(selected==="novo"){
    employeeDoc=doc(collection(services.db,"colaboradores"));
    employeeId=employeeDoc.id;
    batch.set(employeeDoc,{titulo:nome,tipo:kind,setor:sector,responsavel:matricula,data:new Date().toISOString().slice(0,10),status:"Ativo",criadoEm:new Date().toISOString(),atualizadoEm:new Date().toISOString()});
   }
   invite={email,nome,perfil:profile,ativo:active,colaboradorId:employeeId,setor:sector,tipo:kind,matricula,criadoEm:original?.criadoEm||new Date().toISOString(),atualizadoEm:new Date().toISOString(),criadoPor:original?.criadoPor||services.auth.currentUser.uid};
   batch.set(doc(services.db,"convites",email),invite);
  }
  await batch.commit();
  await loadUserAdmin();
  if(employeeDoc&&services.reloadCollaborators)await services.reloadCollaborators();
  $("#um-dialog").close();services.toast("Acesso salvo no Firebase. A conta entra com seu e-mail Google.");
  services.rerender();
 }catch(err){console.error("user save",err);services.toast("Não foi possível salvar a autorização. Confira a conexão e as regras do Firebase.",true);}
 finally{state.saving=false;$("#um-submit").disabled=false;}
}
async function toggleUser(source,id){
 if(!isAdmin())return;
 const record=source==="legacy"?state.legacy.find(x=>x.id===id):state.invites.find(x=>x.id===id);
 if(!record)return;
 if(record.email===services.auth.currentUser?.email||record.email===OWNER)return services.toast("Não é possível bloquear a própria conta ou o proprietário.",true);
 const newStatus=record.ativo!==true;
 if(!confirm((newStatus?"Ativar":"Bloquear")+" acesso de "+(record.nome||record.email||record.id)+"?"))return;
 try{
  await updateDoc(doc(services.db,source==="legacy"?"usuarios":"convites",id),{ativo:newStatus,atualizadoEm:new Date().toISOString()});
  await loadUserAdmin();services.rerender();services.toast(newStatus?"Usuário autorizado.":"Acesso bloqueado nas regras do Firebase.");
 }catch(err){console.error(err);services.toast("Falha ao atualizar permissão.",true);}
}
function click(ev){
 const el=ev.target.closest("[data-user-action]");
 if(!el)return;
 const action=el.dataset.userAction;
 if(action==="new")return showModal("invite","");
 if(action==="edit")return showModal(el.dataset.source,el.dataset.id);
 if(action==="toggle")return toggleUser(el.dataset.source,el.dataset.id);
 if(action==="refresh")loadUserAdmin().then(()=>services.rerender());
}
export function setupUserAdmin(opts){
 services=opts;
 const dialog=document.createElement("dialog");
 dialog.id="um-dialog";dialog.className="dialog um-dialog";
 dialog.innerHTML='<form id="um-form" method="dialog"><div class="dialog-head"><div><span class="eyebrow">TECHNET SST · ACESSOS</span><h2 id="um-dialog-title">Novo acesso</h2></div><button type="button" class="icon-button" id="um-close" aria-label="Fechar">×</button></div><div id="um-fields" class="um-fields"></div><div class="dialog-footer"><button type="button" class="btn btn-muted" id="um-cancel">Cancelar</button><button type="submit" class="btn btn-primary" id="um-submit">Salvar acesso</button></div></form>';
 document.body.appendChild(dialog);
 $("#um-close").addEventListener("click",()=>dialog.close());$("#um-cancel").addEventListener("click",()=>dialog.close());
 $("#um-form").addEventListener("submit",saveForm);
 document.addEventListener("click",click);
 document.addEventListener("change",ev=>{if(ev.target.id==="um-colab-select")syncColabSelect();});
 document.addEventListener("input",ev=>{if(ev.target.id==="um-filter"){state.filter=ev.target.value;updateTable();}});
}
