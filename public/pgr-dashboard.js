import {collection,getDocs} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
// Dados consolidados da planilha entregue; não são acidentes nem efetivo auditado.
let source=[];
const clean=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const numeric=x=>Number.isFinite(Number(x))?Number(x):0;
export async function loadPgrIndicators(db){
 const docs=await getDocs(collection(db,"pgrIndicadores"));
 source=docs.docs.map(d=>({id:d.id,...d.data()}));
}
export function clearPgrIndicators(){source=[];}
export function summaryCounts(){return {unidades:source.length,somaInformada:source.reduce((n,x)=>n+numeric(x.postosDeclarados),0),altura:source.reduce((n,x)=>n+numeric(x.expostosAlturaIndicados),0),moto:source.reduce((n,x)=>n+numeric(x.usoMotocicletaIndicado),0)};}
const disclaimer='Quantitativos extraídos das planilhas de atualização de PGR, sem validação como efetivo atual ou exposição efetivamente medida. Não se referem a acidentes registrados.';
export function renderPgrDashboard(programs=[]){
 const pgr=programs.filter(p=>p.tipo==="PGR");
 const current=pgr.filter(p=>p.status==="Vigente");
 const historic=pgr.filter(p=>p.status==="Substituído");
 const c=summaryCounts();
 const rows=[...source].sort((a,b)=>String(a.titulo).localeCompare(String(b.titulo),"pt-BR"));
 const alerts=rows.flatMap(r=>(r.alertas||[]).map(a=>({unit:r.titulo,desc:a})));
 const published=source.length>0;
 return '<section class="card pgr-dash" id="pgr-dashboard"><div class="pgr-dash-head"><div><span class="eyebrow">BASE DOCUMENTAL · ZIP PGR 2026</span><h2>Painel de PGR por estabelecimento</h2><p>Informações organizadas por CNPJ, revisão, função e atividades assinaladas nas planilhas.</p></div><a href="#programas" class="btn btn-muted">Ver todos os documentos →</a></div>'+
 '<div class="pgr-dash-kpis"><div><b>'+current.length+'</b><span>PGRs cadastrados como vigentes</span></div><div><b>'+historic.length+'</b><span>Revisões históricas</span></div><div><b>'+c.somaInformada+'</b><span>Quantitativos declarados nas abas</span></div><div><b>'+c.altura+'</b><span>Em funções com altura = SIM</span></div><div><b>'+c.moto+'</b><span>Em funções com moto = SIM</span></div></div>'+
 (published?'<div class="pgr-table-scroll"><table class="pgr-dash-table"><thead><tr><th>Estabelecimento</th><th>QT declarada</th><th>Soma por função</th><th>Altura: SIM</th><th>Moto: SIM</th><th>QT no controle PGR</th><th>Conferência</th></tr></thead><tbody>'+
 rows.map(r=>{const mismatch=r.postosDeclarados!==r.somaQuantitativos||r.postosDeclarados!==r.quantidadeControle;return '<tr data-pgr-id="'+clean(r.id)+'"><td><strong>'+clean(r.titulo)+'</strong><small>CNPJ '+clean(r.cnpj)+'</small></td><td>'+numeric(r.postosDeclarados)+'</td><td>'+numeric(r.somaQuantitativos)+'</td><td>'+numeric(r.expostosAlturaIndicados)+'</td><td>'+numeric(r.usoMotocicletaIndicado)+'</td><td>'+(r.quantidadeControle==null?'—':numeric(r.quantidadeControle))+'</td><td><span class="pgr-check '+(mismatch||r.alertas?.length?'pgr-warning':'pgr-ok')+'">'+(mismatch||r.alertas?.length?"Verificar":"Conferido")+'</span></td></tr>';}).join("")+
 '</tbody></table></div>':'<div class="pgr-empty">Nenhum resumo de PGR importado. Os documentos individuais continuam na biblioteca.</div>')+
 '<div class="pgr-notices"><div><h3>Documentos incluídos</h3><p>O ZIP contém 17 arquivos: 10 PDFs (um deles duplicado), 5 Word e 2 planilhas. Os PDFs, Word e planilhas únicos estão vinculados à biblioteca; o ZIP original está arquivado.</p><p>Não foi localizado um arquivo PGR para Mossoró no pacote recebido.</p></div><div><h3>Pontos a conferir</h3>'+
 (alerts.length?'<ul>'+alerts.slice(0,7).map(a=>'<li><strong>'+clean(a.unit)+':</strong> '+clean(a.desc)+'</li>').join("")+'</ul>':'<p>Nenhuma divergência anotada nesta importação.</p>')+'</div></div>'+
 '<p class="pgr-disclaimer">'+clean(disclaimer)+' Compare fontes e datas antes de utilizar os números em relatórios oficiais. A expressão “vigente” reflete o status cadastrado, não certificação jurídica do documento.</p></section>';
}
