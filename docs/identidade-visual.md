# TECHNET — identidade oficial aplicada ao SST

Fonte visual: `TECHNET - LOGO COMPLETA-1.pdf` (material recebido em 10/11/2026).
A página 3 apresenta o símbolo de círculos concêntricos e o logotipo **technet** em minúsculas. O vermelho do vetor é `#E20612` e o cinza grafite é `#4D4D4D`.

Arquivos de identidade:
- `public/brand/logo-horizontal.svg`: símbolo oficial + logotipo vetorial extraído da arte, assinatura para fundo claro
- `public/brand/logo-horizontal-escuro.svg`: composição em branco para fundo escuro
- `public/brand/orbita.svg`: anéis concêntricos como símbolo independente
- `public/brand/app-icon.svg`: símbolo adaptado para aplicativos
- `public/favicon.svg`: versão simplificada para a aba
- `public/brand.css`: aplicação da paleta e dos elementos visuais nos temas claro/escuro

Não foram incluídos os logotipos de parceiros (Claro) que aparecem nas aplicações da marca. Esta atualização não modifica autenticação, perfis, regras Firebase, Firestore, módulos de SST nem dados.

O logotipo original tem letras desenhadas em vetores; as curvas de "technet" foram preservadas. Os círculos concêntricos foram redesenhados com base nas dimensões observadas na mesma página do PDF, para uso responsivo e legível.

## Deploy
A publicação da versão no Firebase Hosting deve ser executada separadamente após a mesclagem: `firebase deploy --only hosting --project technet-sst-2026`.
