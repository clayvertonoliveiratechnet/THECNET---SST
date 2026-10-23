// Mapa anatômico demonstrativo com contagens APENAS de acidentes registrados.
// Documentos PGR não alimentam contagens de acidentes.
export const BODY_AREAS=[
 ["cabeca","Cabeça"],["olhos","Olhos / face"],["pescoco","Pescoço"],
 ["ombro","Ombros"],["torax","Tórax"],["abdomen","Abdômen"],
 ["costas","Costas"],["coluna","Coluna"],["braco","Braços"],
 ["antebraco","Antebraços"],["mao","Mãos"],["quadril","Quadril"],
 ["coxa","Coxas"],["joelho","Joelhos"],["perna","Pernas"],["pe","Pés"]
];
const nameById=Object.fromEntries(BODY_AREAS);
const L=(str)=>String(str??"").trim().toLocaleLowerCase("pt-BR");
const sanitize=str=>String(str??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const state={view:"frente",period:"todos",unit:"todas",region:""};
let records=[];
export function accidentOnly(r){const type=L(r.tipo);return type==="acidente"||type==="acidente do trabalho"||type==="acidente de trabalho";}
export function regionsOf(r){if(!r)return [];if(Array.isArray(r.partesCorpo))return [...new Set(r.partesCorpo)].filter(v=>nameById[v]);const raw=r.parteCorpo||r.partesCorpo||"";return String(raw).split(/[,;]/).map(v=>v.trim()).filter(v=>nameById[v]);}
function filtered(){
 const after=state.period==="todos"?0:new Date().setMonth(new Date().getMonth()-Number(state.period));
 return records.filter(r=>{
  if(!accidentOnly(r))return false;
  if(state.unit!=="todas"&&r.unidade!==state.unit)return false;
  if(after){const dt=new Date((r.data||"")+"T12:00:00");if(!Number.isFinite(dt.valueOf())||dt.valueOf()<after)return false;}
  return true;
 });
}
function bucket(n,max){return n===0?0:Math.max(1,Math.ceil(n/Math.max(1,max)*4));}
function zone(name,shape,counts,max){const num=counts[name]||0,level=bucket(num,max);return '<g tabindex="0" role="button" aria-label="'+sanitize(nameById[name])+': '+num+' acidentes" data-body-region="'+name+'" class="body-zone zone-'+level+(state.region===name?' is-selected':'')+'"><title>'+sanitize(nameById[name])+': '+num+' acidente(s)</title>'+shape+'</g>';}
function svg(counts){
 const max=Math.max(1,...Object.values(counts));
 const z=(n,shape)=>zone(n,shape,counts,max);
 const front=state.view==="frente";
 return '<svg class="body-figure" viewBox="0 0 280 380" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="Mapa anatômico '+(front?"vista frontal":"vista posterior")+' — selecione uma região">'+
 '<path d="M140 8Q119 7 119 32Q120 52 131 57V67H149V57Q161 52 161 32Q161 7 140 8Z" class="body-outline"/>'+
 z("cabeca",'<ellipse cx="140" cy="32" rx="22" ry="28"/>')+
 (front?z("olhos",'<rect x="125" y="24" width="30" height="12" rx="6"/>'):"")+
 z("pescoco",'<rect x="130" y="57" width="20" height="16" rx="6"/>')+
 z("ombro",'<path d="M130 69L108 72Q90 73 88 86L108 105L126 92Z"/><path d="M150 69L172 72Q190 73 192 86L172 105L154 92Z"/>')+
 (front?z("torax",'<path d="M124 79L156 79L172 103L164 136L116 136L108 103Z"/>')+
 z("abdomen",'<path d="M116 139H164L169 174L157 189H123L111 174Z"/>')
 :z("costas",'<path d="M116 80H164L173 127L159 150H121L107 127Z"/>')+
 z("coluna",'<rect x="135" y="80" width="10" height="110" rx="5"/>')+
 z("abdomen",'<path d="M120 153H160L159 188H121Z"/>'))+
 z("braco",'<path d="M89 86L109 105L99 150L79 143Z"/><path d="M191 86L171 105L181 150L201 143Z"/>')+
 z("antebraco",'<path d="M79 147L99 153L86 206L65 198Z"/><path d="M201 147L181 153L194 206L215 198Z"/>')+
 z("mao",'<ellipse cx="65" cy="218" rx="12" ry="22" transform="rotate(13 65 218)"/><ellipse cx="215" cy="218" rx="12" ry="22" transform="rotate(-13 215 218)"/>')+
 z("quadril",'<path d="M116 184H164L172 218L145 227H135L108 218Z"/>')+
 z("coxa",'<path d="M113 219L137 229L136 286H109L103 250Z"/><path d="M167 219L143 229L144 286H171L177 250Z"/>')+
 z("joelho",'<ellipse cx="122" cy="294" rx="14" ry="14"/><ellipse cx="158" cy="294" rx="14" ry="14"/>')+
 z("perna",'<path d="M110 307H136L130 350H110L105 328Z"/><path d="M144 307H170L175 328L170 350H150Z"/>')+
 z("pe",'<path d="M109 350H129L135 367H98Q96 358 109 350Z"/><path d="M151 350H171Q184 358 182 367H145Z"/>')+
 '<text x="140" y="378" class="body-svg-caption" text-anchor="middle">'+(front?"VISTA FRONTAL":"VISTA POSTERIOR")+'</text></svg>';
}
function percent(n,total){return total?Math.round(n/total*100)+"%":"—";}
export function renderBodyMap(items){
 records=items||[];
 const list=filtered(),zoneCount={},covered=list.filter(r=>regionsOf(r).length).length;
 for(const [id] of BODY_AREAS)zoneCount[id]=0;
 for(const record of list)for(const id of regionsOf(record))zoneCount[id]++;
 const unitChoices=[...new Set(records.map(x=>x.unidade).filter(Boolean))].sort();
 if(state.unit!=="todas"&&!unitChoices.includes(state.unit))state.unit="todas";
 const total=list.length;
 const withLeave=list.filter(r=>L(r.houveAfastamento)==="sim").length;
 const days=list.reduce((n,r)=>n+(Number.isFinite(+r.diasPerdidos)&&+r.diasPerdidos>0?+r.diasPerdidos:0),0);
 const rank=Object.entries(zoneCount).filter(([,n])=>n).sort((a,b)=>b[1]-a[1]);
 const focus=state.region&&nameById[state.region]?state.region:null;
 const filteredRank=focus?rank.filter(([id])=>id===focus):rank.slice(0,6);
 return '<section class="card body-panel" id="body-dashboard"><div class="body-panel-header"><div><span class="eyebrow">ACIDENTES REGISTRADOS · INDICADORES REAIS</span><h2>Mapa corporal de acidentes</h2><p>Selecione uma região para detalhar as ocorrências. Um acidente pode afetar mais de uma parte do corpo.</p></div><a class="btn btn-muted" href="#incidentes">Ver acidentes →</a></div>'+
 '<div class="body-toolbar"><label>Período <select id="body-period"><option value="todos" '+(state.period==="todos"?"selected":"")+'>Todo o histórico</option><option value="12" '+(state.period==="12"?"selected":"")+'>Últimos 12 meses</option><option value="6" '+(state.period==="6"?"selected":"")+'>Últimos 6 meses</option></select></label>'+
 '<label>Unidade <select id="body-unit"><option value="todas">Todas as unidades</option>'+unitChoices.map(u=>'<option value="'+sanitize(u)+'" '+(state.unit===u?"selected":"")+'>'+sanitize(u)+'</option>').join("")+'</select></label>'+
 '<div class="body-toggle" role="group" aria-label="Vista do corpo"><button type="button" class="'+(state.view==="frente"?"active":"")+'" data-body-view="frente">Frente</button><button type="button" class="'+(state.view==="costas"?"active":"")+'" data-body-view="costas">Costas</button></div></div>'+
 '<div class="body-stats"><div><b>'+total+'</b><span>Acidentes registrados</span></div><div><b>'+withLeave+'</b><span>Com afastamento</span></div><div><b>'+days+'</b><span>Dias perdidos informados</span></div><div><b>'+covered+'/'+total+'</b><span>Com região preenchida</span></div></div>'+
 '<div class="body-content"><div class="body-visual">'+svg(zoneCount)+'<div class="body-legend"><span>Sem registro</span><i class="zone-0"></i><i class="zone-1"></i><i class="zone-2"></i><i class="zone-3"></i><i class="zone-4"></i><span>Mais registros</span></div></div>'+
 '<div class="body-ranking"><div class="body-ranking-heading"><h3>'+(focus?"Região: "+sanitize(nameById[focus]):"Regiões mais atingidas")+'</h3>'+(focus?'<button type="button" data-body-clear>Limpar filtro</button>':'')+'</div>'+
 (!total?'<div class="body-empty">Ainda não existem acidentes cadastrados para este filtro. O mapa não considera riscos previstos nos PGRs como se fossem lesões ocorridas.</div>':!rank.length?'<div class="body-empty">Há '+total+' acidente(s) cadastrado(s), mas nenhum possui região corporal informada. Complete os registros para alimentar o mapa.</div>':(filteredRank.length?filteredRank.map(([id,n])=>'<button type="button" class="body-rank-row" data-body-region="'+id+'"><span>'+sanitize(nameById[id])+'</span><div class="body-rank-track"><span style="width:'+Math.max(5,Math.round(n/Math.max(...Object.values(zoneCount))*100))+'%"></span></div><strong>'+n+'</strong></button>').join(""):'<div class="body-empty">Nenhum acidente registrado na região selecionada.</div>'))+
 '<p class="body-footnote">Base: acidentes efetivamente cadastrados, não os perigos ou efetivos informados nos PGRs. Taxas de frequência e gravidade não são calculadas sem horas trabalhadas e critérios de apuração.</p></div></div></section>';
}
export function setupBodyMap(){
 document.addEventListener("click",e=>{
  const view=e.target.closest("[data-body-view]"),region=e.target.closest("[data-body-region]"),clear=e.target.closest("[data-body-clear]");
  if(view)state.view=view.dataset.bodyView;
  else if(region)state.region=state.region===region.dataset.bodyRegion?"":region.dataset.bodyRegion;
  else if(clear)state.region="";
  else return;
  rerender();
 });
 document.addEventListener("keydown",e=>{
  const region=e.target.closest("[data-body-region]");
  if(region&&(e.key==="Enter"||e.key===" ")){e.preventDefault();state.region=state.region===region.dataset.bodyRegion?"":region.dataset.bodyRegion;rerender();}
 });
 document.addEventListener("change",e=>{
  if(e.target.id==="body-period")state.period=e.target.value;
  else if(e.target.id==="body-unit")state.unit=e.target.value;
  else return;
  state.region="";rerender();
 });
}
function rerender(){
 const panel=document.getElementById("body-dashboard");
 if(panel)panel.outerHTML=renderBodyMap(records);
}
export function bodyFields(old={}){
 old=old||{};
 const selected=regionsOf(old);
 const box='<div class="form-field wide body-entry"><span class="body-form-caption">Regiões corporais atingidas (pode marcar mais de uma)</span><div class="body-checkboxes">'+BODY_AREAS.map(([key,title])=>'<label><input type="checkbox" name="partesCorpo" value="'+key+'" '+(selected.includes(key)?"checked":"")+'><span>'+sanitize(title)+'</span></label>').join("")+'</div><small>Para acidentes sem lesão corporal, deixe todas as regiões desmarcadas.</small></div>';
 const input=(text,name,type="text",value="",attr="")=>'<div class="form-field"><label>'+text+'</label><input type="'+type+'" name="'+name+'" value="'+sanitize(value)+'" '+attr+'></div>';
 const select=(text,name,choices,value)=>'<div class="form-field"><label>'+text+'</label><select name="'+name+'"><option value="">Não informado</option>'+choices.map(c=>'<option value="'+c+'" '+(c===value?"selected":"")+'>'+c+'</option>').join("")+'</select></div>';
 return '<div class="form-field wide body-entry-title">Informações para indicadores de acidentes</div>'+
 input("Empresa", "empresa", "text", old.empresa||"",'maxlength="110"')+
 input("Unidade / estabelecimento", "unidade", "text", old.unidade||"",'maxlength="130"')+
 select("Natureza da lesão","naturezaLesao",["Corte","Contusão","Fratura","Luxação","Entorse","Queimadura","Escoriação","Distensão","Outra","Sem lesão"],old.naturezaLesao)+
 select("Houve afastamento?","houveAfastamento",["Sim","Não"],old.houveAfastamento)+
 input("Dias perdidos (confirmados)","diasPerdidos","number",old.diasPerdidos??"",'min="0" max="100000" step="1"')+
 select("CAT emitida?","catEmitida",["Sim","Não","Em análise"],old.catEmitida)+box;
}
