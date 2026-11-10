# SST TECHNET — visual corporativo preto

Atualização de interface em 10/11/2026, preservando a marca TECHNET oficial extraída de `TECHNET - LOGO COMPLETA-1.pdf`.

## Direção adotada
- Preto `#0B0B0B` para o fundo e grafite `#171717` para superfícies
- Bordas neutras `#363636`, texto principal `#F2F2F2`
- Vermelho institucional `#E20612` para marca e ações
- Verde/âmbar/vermelho/azul reservados para estados operacionais (semânticos)
- Tipografia DM Sans, hierarquia conservadora, cantos discretos e sem sombras decorativas
- Tela de acesso objetiva: sem painel promocional e sem ilustração grande
- Navegação com item ativo delimitado por traço vermelho, não cartão vermelho em destaque
- Os dois estados do antigo seletor de tema agora apresentam preto ou preto mais intenso

## Arquivos
- `public/black-theme.css`: camada de tema acima de `styles.css` e `brand.css`
- `public/index.html`: carrega o tema e simplifica a tela de acesso

## Escopo preservado
Não modifica autenticação, Firebase, regras, dados, PGR, bibliotecas ou rotas. Controles e IDs utilizados pelos scripts permanecem no HTML.

Para publicar separadamente: `firebase deploy --only hosting --project technet-sst-2026`.
