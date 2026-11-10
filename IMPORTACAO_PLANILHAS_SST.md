# Importação por aba — TECHNET SST

## Abrangência
O botão **Importar planilha** está disponível para administradores nas páginas:
- Colaboradores (coleção colaboradores)
- Controle de EPIs (epis)
- Inspeções (inspecoes)
- Treinamentos (treinamentos)
- Ações corretivas (acoes)
- Incidentes comuns (incidentes)
- Evidências documentais (evidencias; metadados e links HTTPS)
- Programas e laudos (programasSst; catálogo e links HTTPS)

Dashboard e Relatórios exibem o botão **Importar dados**, que abre uma central com as oito abas de origem. Dados calculados nos relatórios não devem ser duplicados em uma fonte separada.

Em Assinaturas eletrônicas, a importação de participantes em Excel/CSV permanece no fluxo **Criar lista / importar Excel**. Listas de DDS/IS devem ser vinculadas à atividade coletiva correspondente, pelo formulário de Evidências.

### Como usar
1. Entre com conta de perfil admin.
2. Abra a aba desejada e clique **Importar planilha**.
3. Baixe o **modelo Excel da própria aba** e preencha a guia Dados.
4. Use preferencialmente uma coluna **ID na planilha** estável em cada linha para futuras atualizações.
5. Selecione o Excel/CSV (até 8 MB). Escolha a guia de dados se necessário.
6. Revise novos, alterados, sem mudanças e inconsistências.
7. Confirme explicitamente; o app grava dados e auditoria em uma única operação.
8. Clique **Histórico de importações** para ver as últimas importações dessa aba.

### Proteções
- Somente administradores, pois cada importação grava auditoria imutável na coleção importacoesPlanilhas.
- Não há exclusão automática; células vazias não substituem dados já preenchidos.
- O ID original, matrícula ou chave composta específica do módulo evita duplicações.
- Linhas incompletas, planilhas incompatíveis e campos ambíguos são bloqueados.
- Máximo de 80 registros por lote e limite adicional no tamanho do histórico.
- O histórico registra antes/depois, nome do arquivo, SHA-256, autor e horário.
- Fórmulas iniciadas com =, + ou @ são rejeitadas.
- O arquivo original não é enviado ao repositório público.

### Exceções
- **Indicadores de acidentes com HHT/TF/TG:** a planilha INDICADORES_DE_ACIDENTES-SST.xlsx, com abas Registros e Horas Trabalhadas, deve passar exclusivamente pelo botão Incidentes → Importar / atualizar Excel. O importador genérico identifica esse formato e o bloqueia para preservar a metodologia de indicadores.
- **PGR, PCMSO, LTCAT, periculosidade e evidências:** os metadados e links HTTPS são importáveis; uma planilha não envia arquivos PDF/Word/binários. O bucket Cloud Storage depende de configuração.
- **DDS, Instruções de Segurança e assinaturas:** importação das listas de participantes dentro da atividade ou lista de assinaturas, não como evidências individuais soltas.
- **Planilhas de fornecedor com outras colunas:** usar modelo padrão ou preparar mapeamento específico. Não há interpretação automática de qualquer formato arbitrário.
- **Sincronização automática:** o upload depende de confirmação. O acompanhamento temporário de arquivo local existe somente no importador especializado de indicadores enquanto a sessão estiver aberta em navegador compatível.
- **Backend atual:** Firebase Hosting, Firestore e Authentication. Migração para Supabase não realizada.

### Validações efetuadas
No ambiente de QA simulado, sem tocar na produção: inclusão de dois colaboradores com matrículas com zeros à esquerda, reimportação idêntica sem duplicação, atualização de um cargo mantendo valor anterior na auditoria; importação de EPIs, catálogo PGR e evidências com links HTTPS; rejeição de evidências sem link, abas incompatíveis e planilha especial de HHT no módulo genérico. Verificado também no viewport móvel.
