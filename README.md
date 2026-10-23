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
