# TECHNET SST

Dashboard web de Segurança e Saúde do Trabalho da TECHNET para operações de telecomunicações.

## Recursos

- Dashboard com indicadores e gráficos de inspeções, ocorrências e pendências;
- Cadastro, edição, exclusão, busca e filtros de incidentes, inspeções, EPIs, treinamentos, ações corretivas e colaboradores;
- Exportação CSV de cada módulo e backup JSON;
- Interface responsiva com temas claro/escuro;
- Demonstração com dados estritamente fictícios no navegador;
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

O site é estático e não exige instalação de pacotes, mas importa os módulos oficiais do Firebase e as fontes pela internet. Para testes, abra a URL do Hosting e clique em Conectar para entrar com o Google.

## Limitações e proteção de dados

O login interativo Google e as operações de escrita de usuários reais exigem testes operacionais. O modo demonstração NÃO envia registros ao Firestore. Nunca insira dados pessoais reais nesse modo.

O sistema é uma ferramenta de controle interno e não substitui a documentação legal obrigatória de SST. Defina uma política de retenção, verificação de documentação e backup antes da entrada em produção com dados de trabalhadores.
