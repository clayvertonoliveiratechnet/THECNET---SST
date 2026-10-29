# Validacao dos pedidos do tecnico SST - 29/10/2026

## Evidencias coletivas
- Dialogo de Seguranca (DDS), Instrucao de Seguranca (IS), treinamento/capacitacao e listas de presenca.
- Modalidade Coletiva ou Individual; para atividade coletiva: tema, data, setor, ministrante e duracao.
- Vincular varios colaboradores ou importar nomes de planilha Excel/CSV.
- Modelo CSV: Nome; Matricula; Funcao; Setor.
- Sem certificado obrigatorio para DDS e IS: comprovante principal e a lista de presenca assinada.
- Usar URL HTTPS privada para o arquivo original (PDF, lista assinada etc.).
- Manter matricula, placa, OS e ID para registros individuais.
- Dados estruturados sao salvos em Firestore/evidencias, respeitando perfis de SST.

## Atualizacao de Excel
- Em Incidentes, apenas admins veem "Importar / atualizar Excel".
- Le o arquivo INDICADORES_DE_ACIDENTES-SST.xlsx com abas Registros e Horas Trabalhadas.
- Compara o ID de origem, mostra inclusoes, alteracoes e linhas sem mudanca, e exige confirmacao.
- Calcula HHT, TF e TG a partir das competencias preenchidas; descarta valores-modelo 38.
- Preserva dias perdidos vazios como nulo e sinaliza ambiguidades na regiao corporal.
- Grava em batch e salva historico imutavel no Firestore/importacoesPlanilhas, com campos anteriores/novos, hash e autor.
- Botao "Ver historico das importacoes" mostra os ultimos registros.
- No Chrome/Edge, "Vincular arquivo local" detecta mudancas periodicamente enquanto o app estiver aberto.
- Mudancas nao sao gravadas sem nova conferencia e confirmacao.
- Para atualizar manualmente basta selecionar novamente o arquivo revisado.

## Limitacoes operacionais
- O backend atual permanece Firebase Hosting, Authentication e Firestore.
- Sem bucket Firebase Storage, anexos originais devem ser vinculados por URLs HTTPS privadas.
- O Excel original nao e armazenado no Firestore; ficam dados estruturados, resumo e hash.
- Nao existe sincronizacao automatica com Excel fechado.
- Nao existe migracao concluida para Supabase.
- Necessario validar as permissoes e o fluxo com contas e listas reais.

## Testes recomendados
1. Evidencias > Nova evidencia > DDS; selecionar 2 colaboradores e importar mais 2 nomes.
2. Informar link privado da lista assinada e salvar; editar e conferir participantes.
3. Cadastrar uma Ficha de EPI Individual com matricula, confirmando campos individuais.
4. Importar Excel atualizado em Incidentes, revisar a comparacao, cancelar uma vez sem salvar.
5. Confirmar uma alteracao, consultar historico e testar reimportacao sem duplicatas.
6. Vincular Excel no Chrome, alterar no computador e validar aviso e nova previa.
