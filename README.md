# TECHNET SST

Painel web de Segurança e Saúde do Trabalho para operações de telecomunicações da TECHNET.

## Módulos
- Indicadores de incidentes e inspeções;
- Cadastros de incidentes, inspeções, EPIs, treinamentos, ações corretivas e colaboradores;
- Busca, filtros, criação, edição e exclusão de registros;
- Exportações em CSV e JSON;
- Layout responsivo com modo claro e escuro;
- Demonstração fictícia para uso sem autenticação;
- Persistência no Firebase Authentication (Google) e Cloud Firestore;
- Regras de acesso baseadas em perfis.

## Infraestrutura
- Projeto: technet-sst-2026
- Hospedagem: https://technet-sst-2026.web.app
- App web: 1:276807543932:web:adca9a2ab35b8644e22df9
- Repositório: https://github.com/clayvertonoliveiratechnet/THECNET---SST

## Configuração inicial

1. Ative a API Cloud Firestore e crie o banco (default) na região southamerica-east1.
2. Publique as regras: firebase deploy --only firestore --project technet-sst-2026
3. Em Firebase Console > Authentication > Sign-in method, habilite Google e configure o email de suporte.
4. Confira o domínio technet-sst-2026.web.app em Authentication > Settings > Authorized domains.
5. A conta administradora inicial definida nas regras é clayvertonoliveira@gmail.com.

Outros usuários são incluídos pela conta administradora na coleção usuarios:
documento ID = UID do Firebase Authentication;
campos: ativo=true e perfil=sst, supervisor ou leitura.

## Implantação
Site estático, sem dependências de instalação nem compilação.
Na raiz do repositório:
firebase deploy --only hosting --project technet-sst-2026

## Segurança
O modo de demonstração armazena apenas dados fictícios no localStorage. Não insira dados pessoais reais nesse modo. Somente o modo conectado ao Firebase efetua operações de produção. Antes da adoção operacional, revise acesso, retenção e backup de dados conforme LGPD e políticas internas.
