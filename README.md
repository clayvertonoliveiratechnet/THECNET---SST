# TECHNET SST

Dashboard web de Segurança e Saúde do Trabalho da TECHNET para operações de telecomunicações.

## Recursos

- Dashboard com indicadores e gráficos de inspeções, ocorrências e pendências;
- Cadastro, edição, exclusão, busca e filtros de incidentes, inspeções, EPIs, treinamentos, ações corretivas e colaboradores;
- Exportação CSV de cada módulo e backup JSON;
- Interface responsiva com temas claro/escuro;
- Autenticação Google obrigatória, sem modo demonstração e sem dados fictícios;
- Firebase Authentication com login pelo Google;
- Cloud Firestore com permissões por perfil e proteção de leitura e escrita.

## Ambiente implantado

- Firebase: technet-sst-2026
- Site: https://technet-sst-2026.web.app
- Repositório: https://github.com/clayvertonoliveiratechnet/THECNET---SST
- Firebase Hosting: ativo, limitado à pasta public
- Cloud Firestore (default): ativo na região southamerica-east1
- Authentication Google: habilitado
- Regras Firestore: implantadas

## Controles de acesso

A conta administradora inicial definida em firestore.rules é clayvertonoliveira@gmail.com. Outras contas somente terão acesso ao banco se forem cadastradas por essa conta na coleção usuarios, em documento cujo ID é o UID da conta Firebase, contendo:

- ativo: true
- perfil: supervisor, sst ou leitura

Apenas a conta inicial pode cadastrar ou editar permissões de usuários. Um supervisor ou SST pode criar, editar e excluir registros; leitura só visualiza dados.

## Publicação

Na raiz do repositório:
firebase deploy --project technet-sst-2026

O site é estático e não exige instalação de pacotes, mas importa os módulos oficiais do Firebase e as fontes pela internet. Para acessar, abra a URL do Hosting e clique em Entrar com Google. Apenas contas autorizadas carregam informações reais do Firestore.

## Limitações e proteção de dados

O login é obrigatório: a interface principal não aparece até a validação da conta e o carregamento bem-sucedido do Firestore. Em caso de erro, a aplicação mostra somente a tela de acesso e oferece uma nova tentativa, sem recorrer a dados fictícios.

As operações interativas de login, leitura e escrita ainda precisam de teste com as contas operacionais autorizadas. Os documentos vinculados ao Google Drive permanecem sujeitos às permissões do próprio Drive.

O sistema é uma ferramenta de controle interno e não substitui a documentação legal obrigatória de SST. Defina uma política de retenção, verificação de documentação e backup antes da entrada em produção com dados de trabalhadores.


## Evidências, documentos e Cloud Storage

- Evidências: listas de presença, fichas de EPI, checklists de inspeção, IVM (Forms), certificados, fotografias e outros documentos.
- Programas e laudos: PGR, PCMSO, LTCAT e laudo de periculosidade, com versões, unidade, emissão, responsável e revisão planejada.
- Links externos HTTPS para Forms e Google Drive ficam registrados no Cloud Firestore e já funcionam com a conta autorizada. As permissões dos links externos são determinadas no serviço de origem (Drive/Forms).
- Upload de PDF, imagens, Word, Excel, CSV e OpenDocument com limite de 20 MB está programado para Cloud Storage, com regras de acesso em storage.rules.
- O projeto não tem bucket de Cloud Storage provisionado. Desde fevereiro de 2026 o Firebase exige o plano Blaze para usar Storage. O upload direto será liberado após o proprietário habilitar cobrança e criar o bucket technet-sst-2026.firebasestorage.app. Não habilite cobrança sem autorização.
- Depois que o bucket existir, execute firebase deploy --only storage --project technet-sst-2026 para publicar as regras de acesso. O upload não deve ser disponibilizado sem essas regras.
- Documentos gerais do PCMSO podem ser cadastrados. Não armazenar prontuários, ASOs individuais, exames ou dados médicos sem uma arquitetura específica de acesso por necessidade e retenção definida.
- Cada registro é vinculado opcionalmente a uma matrícula, OS, placa ou inspeção. O link IVM do Forms deve ser informado pela equipe, pois não está disponível neste projeto.


## Versão de produção (2026-10-23)

- Modo de demonstração desativado; dados locais fictícios do navegador são descartados automaticamente.
- Menu e dashboard visíveis apenas depois de autenticação/autorização e carregamento do banco.
- Falhas no Firestore não provocam retorno a conteúdo fictício; exibem aviso e botão para tentar novamente.
- Os onze registros reais de PGR (9 versões e 2 controles) já estão no Firestore, vinculados ao Drive.
- A conta proprietária definida nas regras é clayvertonoliveira@gmail.com; demais contas precisam ser aprovadas na coleção usuarios.
- O upload binário ainda depende do bucket Cloud Storage (Blaze). Links do Google Drive estão suportados.

## Gestão de usuários

- Administração > Gestão de usuários aparece somente para contas com perfil admin.
- O administrador cadastra e-mail Google, nome, perfil (admin, supervisor, sst, leitura), status ativo/bloqueado e vínculo opcional com colaboradores.
- Ao criar colaborador, o registro de pessoal e a autorização são gravados juntos em um batch do Firestore.
- A coleção convites usa e-mail em minúsculas como ID. A coleção usuarios (ID UID) permanece compatível com as contas antigas.
- Usuários entram com o Google associado ao e-mail autorizado. O sistema não envia e-mail automaticamente nem cria senhas.
- Bloqueio impede novas leituras e escritas nas regras do Firestore; não desfaz downloads já realizados.
- A conta proprietária clayvertonoliveira@gmail.com mantém acesso de superadministrador.
- A autorização é validada no banco, não somente pela visibilidade do menu.

## Dashboard PGR e mapa corporal — 23/10/2026

O painel agrega as duas planilhas XLSX recebidas no ZIP e as versões PGR em PDF/Word. Os 17 arquivos originais incluem um PDF de Recife duplicado. Os arquivos únicos e o ZIP original estão preservados em Drive privado, com links nos registros programasSst (9 versões) e evidencias (2 controles).

As 5 unidades em pgrIndicadores são Natal DMV, Natal RDT, Natal VNA, Recife DMV e Fortaleza DMV. Não há PGR Mossoró no ZIP.

Os quantitativos da planilha INFORMAÇOES PGR 2026.xlsx são somas de QT por função até a linha Total de funcionários. Não constituem efetivo ativo validado nem acidentes:
- Soma de totais declarados: 506; soma dos quantitativos por função: 508.
- Trabalho em altura SIM: 225; motocicleta SIM: 40, somando somente linhas explicitamente marcadas SIM.
- DMV Natal: soma 28 vs declarado 27. Fortaleza: soma 27 vs declarado 26.
- Controle PGR apresenta números diferentes em várias unidades; fontes mantidas separadas.
- VNA tem quadro da RDT depois do total VNA, excluído do cálculo VNA.
- DMV-FORTALEZA tem cabeçalho Matriz Natal, pendente de conferência.
- Controle PGR indica RDT Revisão 002 e o PDF atual do ZIP é Rev.3.

Para mapa de acidentes, o tipo precisa ser Acidente no registro de incidentes. Os campos adicionais permitem registrar regiões, natureza da lesão, afastamento, dias perdidos, CAT e unidade. Acidentes afetam o total uma vez, mas podem contribuir para várias regiões do corpo. O mapa frontal/posterior tem filtros por período e unidade. PGR não alimenta número de acidentes e não são apresentadas taxas de frequência/gravididade sem horas trabalhadas.


## Importação de indicadores de acidentes — planilha 2026

O módulo Incidentes oferece **Importar indicadores 2026** exclusivamente a administradores. A importação usa um JSON privado convertido da planilha INDICADORES_DE_ACIDENTES-SST.xlsx. Nenhum nome nem relato de acidente deve ser adicionado ao repositório GitHub público.

Procedimento:
1. Baixar o arquivo privado INDICADORES_DE_ACIDENTES_TECHNET_IMPORTACAO_PRIVADA.json gerado nesta conversa.
2. Autenticar-se como administrador no TECHNET SST.
3. Acessar Incidentes > Importar indicadores 2026.
4. Selecionar o JSON, conferir os totais e clicar em Confirmar importação.
5. Conferir os oito registros em Incidentes e o resumo HHT/TF/TG no dashboard.

A importação grava acidentes na coleção protegida incidentes, usando IDs determinísticos para evitar duplicações. Também compara data, colaborador e unidade com registros preexistentes. Os 12 registros mensais de HHT e o resumo ficam no documento protegido evidencias/indicadores-acidentes-sst-2026. Os registros já cadastrados não são substituídos automaticamente.

Critérios preservados da planilha:
- 8 acidentes (7 com afastamento, 1 sem); HHT total 272.867.
- TF = 7 × 1.000.000 / 272.867 = 25,65.
- TG = (24 dias perdidos + 24 dias debitados) × 1.000.000 / 272.867 = 175,91.
- Um registro de dias perdidos permanece nulo, e não zero.
- Costas / Coluna é exibido em duas regiões do mapa, mas continua sendo um acidente.
- Múltiplas partes permanece sem região atribuída até detalhamento.
- Tornozelo é agrupado em Pés, por não existir área própria no mapa, com observação da aproximação.

Dados pessoais permanecem somente no arquivo privado e no Firestore protegido após confirmação do administrador. Não publicar o JSON privado no GitHub.

Publicação: alterações no GitHub não são deploy automático do Firebase Hosting. Após sincronizar o código, executar firebase deploy --only hosting --project technet-sst-2026. A eventual migração futura para Supabase requer nova implementação com RLS.
