# Assinaturas eletronicas de listas SST - 05/11/2026

## Fluxo
1. Abrir TECHNET SST > Assinaturas eletronicas (Google autorizado, perfil SST/supervisor/admin).
2. Clicar em Criar lista de assinaturas.
3. Informar titulo, tema, data, unidade, responsavel e referencia.
4. Colar os participantes ("Nome; Funcao", um por linha), importar Excel/CSV ou carregar de uma evidencia coletiva.
5. Opcionalmente selecionar o PDF original na criacao; apenas seu SHA-256 e nome sao salvos, nao o arquivo.
6. Criar links individuais. Entregar cada link ao destinatario correto, pessoalmente ou em mensagem privada.
7. O participante confere os detalhes, declara identidade/participacao, concorda com o uso da assinatura eletronica simples, desenha no celular ou computador e confirma.
8. A assinatura e o horario de servidor sao gravados no Firestore; o convite nao pode ser assinado novamente.
9. Em Gerenciar, consultar assinados e pendentes. Gerar PDF consolidado. Se houver PDF original vinculado, seleciona-lo novamente para carimbar assinaturas no modelo TECHNET NR01 de 2 paginas (ate 30 participantes).
10. Arquivar o PDF final e sua documentacao conforme o procedimento documental da empresa.

## Arquitetura e privacidade
- Backend atual: Firebase Authentication, Cloud Firestore e Firebase Hosting.
- Colecoes: assinaturaSessoes (lista/atividade) e assinaturaConvites (um token aleatorio de 192 bits por participante).
- Convidados podem consultar somente o seu documento pelo token; nao podem listar outros convites.
- A escrita publica altera exclusivamente representacao grafica, nome do signatario fixado no convite, aceite, hash e horario do servidor; somente uma vez.
- Convites assinados sao imutaveis pelas regras do cliente; backups administrativos e exclucoes privilegiadas de plataforma devem seguir politica de retencao.
- O token na URL e um segredo de acesso: distribuicao por canal privado; um terceiro com acesso ao link pode assinar indevidamente. A identificacao e autodeclarada e o responsavel deve conferir o signatario.
- Nao ha SMS/OTP, biometria, selo ICP-Brasil, carimbo de tempo de autoridade certificadora ou assinatura criptografica do PDF final.
- O SHA-256 da imagem e do PDF original permite detectar divergencias em auditoria, mas NAO prova a autoria nem assina criptograficamente o PDF.
- Assinaturas e links nao entram no repositorio publico. Dados pessoais e imagem de assinatura sao armazenados em colecao privada, visiveis a usuarios autorizados e ao possuidor do convite.
- Os PDFs finais sao gerados localmente pelo navegador e baixados. Eles nao sao automaticamente armazenados: o projeto nao possui bucket de Storage configurado.
- Para documentos de SST que exijam ICP-Brasil ou assinatura avancada, integrar provedor especializado e revisar a base normativa. Nao tratar este MVP como assinatura qualificada.

## PDF fornecido como exemplo
O documento "LISTA_DE_TREINAMENTO_NR01-ASSEDIO MORAL-05-11-26.pdf", duas paginas, contem 17 nomes e espacos em branco de assinatura. Nele ha DIVERGENCIA editorial: a pauta do treinamento e "Assedio Moral e Sexual", mas o subtitulo da lista de presenca na pagina 1 menciona "Cuidados no trabalho externo - calcado, protetor solar, bone e uso do celular". Corrigir o arquivo com o tecnico antes de coletar assinaturas e vincular sua versao final ao novo registro.

## Teste
- Criar uma lista ficticia com duas pessoas e conferir a geracao de dois links diferentes.
- Abrir o link da primeira pessoa sem login, assinar por mouse/toque, confirmar duas caixas e verificar status.
- Tentar reenviar a mesma assinatura; deve ser negado.
- Verificar que o outro convite continua pendente e que pessoas nao autenticadas nao conseguem enumerar a lista.
- Baixar PDF consolidado e verificar assinatura, horario do servidor e nomes.
- Testar celular (420px) e desktop, e geracao do PDF original apenas quando o hash corresponde.
