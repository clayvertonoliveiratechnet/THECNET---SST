# Identidade visual SST TECHNET — Órbita de Proteção

Direção: saúde e segurança do trabalho, com oito órbitas vermelhas evocando camadas de prevenção e controle. Assinatura: **Segurança em cada camada.**

## Arquivos
- `public/brand/logo-horizontal.svg`: assinatura horizontal em fundo claro.
- `public/brand/logo-horizontal-escuro.svg`: assinatura horizontal em fundo escuro.
- `public/brand/orbita.svg`: símbolo vetorial, transparente.
- `public/brand/app-icon.svg`: ícone para telas de acesso, barra lateral e aplicativo.
- `public/favicon.svg`: versão simplificada para abas.
- `public/brand.css`: personalização visual carregada após `styles.css`.

## Cores
- Primário: `#B51222` (botões e ações).
- Órbita: `#E10D1D` (símbolo e acentos).
- Texto: `#17212B`; grafite: `#1B2A38`.
- Superfície: `#FFFFFF`; fundo: `#F7F8FA`; bordas: `#D7DEE5`.
- Contraste alto no escuro: `#FF7888` para texto/ênfase; ações mantém vermelho escuro e texto branco.

## Integração
O layout existente continua estático no Firebase Hosting; nenhuma regra, rotina Firebase, ação JS, formulário ou fonte de dados foi modificada. `brand.css` altera somente aparência. Os temas claro e escuro continuam funcionando.

Publicação é uma etapa separada: após aprovar/mesclar, execute `firebase deploy --only hosting --project technet-sst-2026` de um ambiente autenticado.
