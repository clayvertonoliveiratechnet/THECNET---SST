# SST TECHNET — Identidade visual v2

Revisão premium baseada na referência dos círculos concêntricos e na prancha visual validada no projeto.

## Marca
- **Símbolo:** órbitas de monitoramento e proteção, com três nós de conexão; traços segmentados e centro vazado
- **Assinatura:** SST TECHNET — Saúde e Segurança do Trabalho
- **Conceito:** Segurança em cada camada
- **Fonte de interface e assinatura:** Sora (fallback Arial)

## Paleta
- Vermelho institucional: `#B51222`; vermelho vivo: `#E10D1D`
- Grafite principal: `#17212B`; superfície escura: `#1B2A38`
- Fundo da aplicação: `#F5F7F9`; cartões: `#FFFFFF`

## Aplicação
- `public/brand/orbita.svg`: símbolo standalone sem fundo
- `public/brand/logo-horizontal.svg`: logo para fundo claro
- `public/brand/logo-horizontal-escuro.svg`: logo para fundo escuro
- `public/brand/app-icon.svg`: ícone do app
- `public/favicon.svg`: favicon
- `public/brand.css`: tokens, telas de acesso, sidebar, dashboard, cartões, responsividade e modo escuro

O redesign preserva os IDs de elementos, eventos de autenticação, rotas internas, regras de Firebase e tratamento de dados. A autenticação continua obrigatória; exemplos na prancha visual não representam dados reais nem foram inseridos no sistema.

## Publicação
`firebase deploy --only hosting --project technet-sst-2026`
