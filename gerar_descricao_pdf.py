# -*- coding: utf-8 -*-
from fpdf import FPDF
from fpdf.enums import XPos, YPos

AZUL = (30, 80, 160)
AZUL_CLARO = (220, 230, 245)
CINZA_ESCURO = (50, 50, 50)
CINZA_LINHA = (200, 200, 200)
BRANCO = (255, 255, 255)
VERDE = (34, 139, 34)
LARANJA = (180, 90, 0)


FONT_DIR = "C:/Windows/Fonts/"


class PDF(FPDF):
    def __init__(self):
        super().__init__()
        self.add_font("Arial", "", FONT_DIR + "arial.ttf")
        self.add_font("Arial", "B", FONT_DIR + "arialbd.ttf")
        self.add_font("Arial", "I", FONT_DIR + "ariali.ttf")
        self.add_font("Arial", "BI", FONT_DIR + "arialbi.ttf")

    def header(self):
        self.set_fill_color(*AZUL)
        self.rect(0, 0, 210, 18, "F")
        self.set_font("Arial", "B", 10)
        self.set_text_color(*BRANCO)
        self.set_xy(10, 5)
        self.cell(0, 8, "JB Pinturas — ERP de Gestão de Obras  |  Descrição Geral do Sistema", align="L")
        self.set_text_color(*CINZA_ESCURO)
        self.ln(14)

    def footer(self):
        self.set_y(-12)
        self.set_font("Arial", "", 8)
        self.set_text_color(130, 130, 130)
        self.cell(0, 6, f"Página {self.page_no()} — Documento gerado em Abril/2026 — Confidencial", align="C")

    def secao(self, numero, titulo):
        self.ln(4)
        self.set_fill_color(*AZUL)
        self.set_text_color(*BRANCO)
        self.set_font("Arial", "B", 12)
        self.cell(0, 9, f"  {numero}. {titulo}", new_x=XPos.LMARGIN, new_y=YPos.NEXT, fill=True)
        self.set_text_color(*CINZA_ESCURO)
        self.ln(2)

    def subsecao(self, titulo):
        self.ln(3)
        self.set_font("Arial", "B", 10)
        self.set_text_color(*AZUL)
        self.cell(0, 7, titulo, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_draw_color(*AZUL_CLARO)
        x = self.get_x()
        y = self.get_y()
        self.line(x, y, x + 190, y)
        self.set_text_color(*CINZA_ESCURO)
        self.ln(2)

    def paragrafo(self, texto):
        self.set_font("Arial", "", 9.5)
        self.multi_cell(0, 5.5, texto)
        self.ln(1)

    def item(self, texto, negrito_prefixo=""):
        self.set_x(14)
        if negrito_prefixo:
            self.set_font("Arial", "B", 9.5)
            self.cell(self.get_string_width(negrito_prefixo) + 1, 5.5, negrito_prefixo)
            self.set_font("Arial", "", 9.5)
            self.multi_cell(0, 5.5, texto)
        else:
            self.set_font("Arial", "", 9.5)
            self.multi_cell(0, 5.5, f"•  {texto}")
        self.ln(0.5)

    def caixa_destaque(self, texto):
        self.set_fill_color(*AZUL_CLARO)
        self.set_draw_color(*AZUL)
        self.set_font("Arial", "I", 9)
        self.multi_cell(0, 5.5, texto, border=1, fill=True)
        self.set_draw_color(*CINZA_LINHA)
        self.ln(2)

    def tabela(self, cabecalhos, larguras, linhas):
        # cabeçalho
        self.set_fill_color(*AZUL)
        self.set_text_color(*BRANCO)
        self.set_font("Arial", "B", 9)
        for i, cab in enumerate(cabecalhos):
            self.cell(larguras[i], 7, cab, border=1, fill=True)
        self.ln()
        # linhas alternadas
        self.set_text_color(*CINZA_ESCURO)
        for idx, linha in enumerate(linhas):
            if idx % 2 == 0:
                self.set_fill_color(245, 248, 255)
            else:
                self.set_fill_color(*BRANCO)
            self.set_font("Arial", "", 8.5)
            # calcula altura necessária
            altura = 6
            for i, cel in enumerate(linha):
                self.cell(larguras[i], altura, str(cel), border=1, fill=True)
            self.ln()
        self.ln(2)

    def bloco_codigo(self, codigo):
        self.set_fill_color(240, 240, 240)
        self.set_draw_color(*CINZA_LINHA)
        self.set_font("Arial", "", 8)
        self.multi_cell(0, 5, codigo, border=1, fill=True)
        self.set_font("Arial", "", 9.5)
        self.set_draw_color(*CINZA_LINHA)
        self.ln(2)


def gerar_pdf():
    pdf = PDF()
    pdf.set_margins(10, 20, 10)
    pdf.set_auto_page_break(True, margin=15)
    pdf.add_page()

    # ── CAPA ──────────────────────────────────────────────────────────────────
    pdf.set_fill_color(*AZUL)
    pdf.rect(0, 18, 210, 60, "F")
    pdf.set_font("Arial", "B", 26)
    pdf.set_text_color(*BRANCO)
    pdf.set_xy(10, 30)
    pdf.cell(0, 12, "JB Pinturas ERP", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Arial", "", 14)
    pdf.set_xy(10, 48)
    pdf.cell(0, 8, "Descrição Geral do Sistema", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Arial", "", 10)
    pdf.set_xy(10, 62)
    pdf.cell(0, 6, "Sistema ERP para Gestão de Obras de Pintura  —  Abril/2026", align="C")

    pdf.set_text_color(*CINZA_ESCURO)
    pdf.set_y(85)

    # ── 1. VISÃO GERAL ────────────────────────────────────────────────────────
    pdf.secao(1, "Visão Geral e Contexto de Negócio")
    pdf.paragrafo(
        "O JB Pinturas ERP é um sistema de gestão empresarial desenvolvido para a empresa JB Pinturas, "
        "especializada em execução de obras de pintura predial e civil. O sistema substitui processos manuais "
        "baseados em planilhas e Registros Diários de Obra (RDOs) físicos em papel."
    )

    pdf.subsecao("Problema resolvido")
    pdf.item("Falta de rastreabilidade de quem executou cada serviço e quando.")
    pdf.item("Fechamento lento de medições quinzenais de produção.")
    pdf.item("Ausência de visão em tempo real de lucratividade (Custo vs. Receita).")
    pdf.item("Erros de comunicação entre o canteiro de obras e o escritório administrativo.")

    pdf.subsecao("Solução entregue")
    pdf.item("Digitalização completa do fluxo operacional e financeiro.")
    pdf.item("App móvel para uso dos encarregados no campo, com funcionamento offline.")
    pdf.item("Dashboard financeiro com cálculo automático de margem de lucro por serviço e por obra.")
    pdf.item("Auditoria imutável de todas as ações realizadas no sistema.")

    # ── 2. ARQUITETURA ────────────────────────────────────────────────────────
    pdf.secao(2, "Arquitetura do Sistema")
    pdf.paragrafo("O projeto é um monorepo com três aplicações integradas:")

    pdf.bloco_codigo(
        "jb_pinturas/\n"
        "  backend/    # API REST — NestJS 10, TypeORM 0.3, PostgreSQL, Redis, BullMQ\n"
        "  frontend/   # Painel web — React 18, Vite, Material UI 5, Redux Toolkit\n"
        "  mobile/     # App de campo — React Native 0.74, Expo"
    )

    pdf.subsecao("Comunicação entre camadas")
    pdf.item("Frontend e Mobile consomem a API REST do Backend via HTTPS.")
    pdf.item("Prefixo da API: /api/v1  |  Documentação: Swagger em /api/docs")
    pdf.item("Autenticação: JWT (access token + refresh token).")
    pdf.item("Notificações em tempo real: Firebase Cloud Messaging (FCM).")
    pdf.item("Backend roda na porta 3006; Frontend na porta 3001 (desenvolvimento).")

    # ── 3. PERFIS DE USUÁRIO ──────────────────────────────────────────────────
    pdf.secao(3, "Perfis de Usuário e Controle de Acesso (RBAC)")
    pdf.tabela(
        ["Perfil", "Nível", "Acesso principal"],
        [30, 30, 130],
        [
            ["ADMIN", "Sistema", "Gestão de usuários, auditoria, configurações; força faturamento com justificativa"],
            ["GESTOR", "Decisão", "Aprova preços de venda e margens, valida medições, vê dados financeiros completos"],
            ["FINANCEIRO", "Financeiro", "Cadastra clientes e preços de venda, realiza pagamentos, acessa dados sensíveis"],
            ["ENCARREGADO", "Campo", "Cria obras, aloca colaboradores, lança produção; NUNCA vê preços de venda"],
        ],
    )
    pdf.caixa_destaque(
        "O Colaborador não possui login — é uma entidade passiva usada para alocação e pagamento.\n"
        "Implementação: JwtAuthGuard + RolesGuard com @Roles(PerfilEnum.X) em todos os endpoints."
    )

    # ── 4. DOMÍNIO ────────────────────────────────────────────────────────────
    pdf.secao(4, "Domínio de Negócio — Entidades Principais")

    pdf.subsecao("4.1 Hierarquia de Obras")
    pdf.bloco_codigo(
        "Obra\n"
        "  └── Pavimento  (ex: '5º Andar', 'Térreo')\n"
        "        └── Ambiente  (ex: 'Apto 3401', 'Escadaria Norte')"
    )
    pdf.item("Obra vinculada a um Cliente. Status: PLANEJAMENTO → ATIVA → SUSPENSA → CONCLUÍDA.")
    pdf.item("Pavimento organiza os ambientes por andar ou seção.")
    pdf.item("Ambiente é a unidade mínima de trabalho; pode ser bloqueado para impedir intervenção.")

    pdf.subsecao("4.2 Catálogo de Serviços")
    pdf.paragrafo(
        "Base global de serviços com unidades de medida: M², ML, UN, VB. "
        "Cada serviço possui flag 'permite_decimal' para indicar se a quantidade pode ser fracionada."
    )

    pdf.subsecao("4.3 Precificação Dual (RF04)")
    pdf.item("Preço de Custo: valor pago ao colaborador. Visível para Encarregado e Financeiro.")
    pdf.item("Preço de Venda: valor cobrado do cliente. Visível apenas para Gestor e Financeiro.")
    pdf.ln(2)
    pdf.paragrafo("Workflow de aprovação:")
    pdf.item("1. Financeiro insere preço de venda → status PENDENTE.")
    pdf.item("2. Gestor analisa margem calculada automaticamente (venda − custo).")
    pdf.item("3. Gestor aprova → APROVADO; rejeita → REJEITADO.")
    pdf.item("4. Enquanto há preço PENDENTE, o sistema bloqueia a geração de medições (RN02).")

    pdf.subsecao("4.4 Alocação de Colaboradores (RF07 — RN03)")
    pdf.paragrafo(
        "Cada colaborador é alocado a um ambiente para executar uma lista de serviços. "
        "Um ambiente só pode ter um colaborador ativo por vez, garantido por constraint única no banco:"
    )
    pdf.bloco_codigo(
        "CREATE UNIQUE INDEX unique_ambiente_ativo\n"
        "ON tb_alocacoes_tarefa (id_ambiente, status)\n"
        "WHERE status = 'EM_ANDAMENTO' AND deletado = FALSE;"
    )

    pdf.subsecao("4.5 Medições de Produção (RF08)")
    pdf.item("Registro da quantidade produzida por colaborador em cada serviço.")
    pdf.item("Excedente: quando a medição supera a área do ambiente, exige justificativa + foto obrigatória.")
    pdf.item("Medições vinculadas a: Alocação → Ambiente → Pavimento → Obra.")

    pdf.subsecao("4.6 RDO Digital — Sessão Diária (RF06)")
    pdf.item("Abertura com geolocalização do encarregado.")
    pdf.item("Máximo de 1 sessão ativa por encarregado por dia.")
    pdf.item("Encerramento com assinatura digital do cliente ou responsável.")
    pdf.item("Cálculo automático da duração da jornada.")

    pdf.subsecao("4.7 Módulo Financeiro")
    pdf.item("Lotes de pagamento: agrupamento de medições para gerar folha de pagamento.")
    pdf.item("Vales de adiantamento: registro e parcelamento de valores pagos antecipadamente.")
    pdf.item("Alertas de faturamento (RF10): notificação automática quando data de corte do cliente se aproxima.")
    pdf.item("Relatórios: margem de lucro por obra, produtividade, contas a pagar/receber, apropriação de custos.")

    # ── 5. REGRAS DE NEGÓCIO ──────────────────────────────────────────────────
    pdf.secao(5, "Regras de Negócio Centrais")
    pdf.tabela(
        ["Código", "Regra"],
        [20, 170],
        [
            ["RN01", "Encarregado nunca vê preço de venda (cegueira financeira). Aplicada no backend e na UI."],
            ["RN02", "Sistema bloqueia medições enquanto existir preço com status PENDENTE. Exceção: Admin com justificativa registrada em auditoria."],
            ["RN03", "Um ambiente só pode ter um colaborador ativo simultaneamente (constraint UNIQUE no banco)."],
            ["RN04", "Dados bancários exibidos mascarados (***) na interface. AES-256 em repouso. TLS 1.2+ obrigatório em trânsito."],
        ],
    )

    # ── 6. SEGURANÇA ──────────────────────────────────────────────────────────
    pdf.secao(6, "Segurança")
    pdf.item("Autenticação: JWT com access token de curta duração + refresh token.")
    pdf.item("MFA: autenticação de dois fatores via TOTP (Time-based One-Time Password) com otplib.")
    pdf.item("Senhas: hash com Bcrypt.")
    pdf.item("Criptografia em repouso: AES-256 para campos sensíveis (dados bancários).")
    pdf.item("Auditoria imutável: tabela tb_audit_logs com constraint APPEND-ONLY — nenhum registro pode ser alterado ou excluído.")
    pdf.item("Soft Delete universal: coluna 'deletado: boolean' em todas as tabelas; dados nunca removidos fisicamente.")

    # ── 7. BACKEND ────────────────────────────────────────────────────────────
    pdf.secao(7, "Backend — Módulos Implementados")
    pdf.paragrafo(
        "Organizado em módulos verticais em backend/src/modules/{modulo}/. "
        "Cada módulo contém controller, service, entities e DTOs."
    )
    pdf.tabela(
        ["Módulo", "Responsabilidade"],
        [45, 145],
        [
            ["auth", "Login, logout, refresh token, MFA, reset de senha"],
            ["usuarios", "CRUD de usuários com RBAC"],
            ["obras", "CRUD de obras com status e vínculo a clientes"],
            ["pavimentos", "Setorização das obras por andar/seção"],
            ["ambientes", "Unidades de trabalho; bloqueio de ambiente"],
            ["clientes", "Cadastro de clientes com CNPJ único e dados bancários criptografados"],
            ["colaboradores", "Cadastro de colaboradores com CPF único"],
            ["servicos", "Catálogo global de serviços"],
            ["precos", "Tabela de preços dual com workflow de aprovação"],
            ["alocacoes", "Alocação de colaborador por ambiente (constraint 1:1)"],
            ["alocacoes-itens", "Itens de serviço dentro de uma alocação"],
            ["medicoes", "Medições de produção com flag de excedente"],
            ["medicoes-colaborador", "Medição individual por colaborador"],
            ["sessoes", "RDO Digital com geolocalização e assinatura"],
            ["financeiro", "Lotes de pagamento, contas, dashboard financeiro"],
            ["vale-adiantamento", "Vales com parcelamento"],
            ["relatorios", "Agregações para dashboards e exportações"],
            ["notificacoes / push", "Firebase Cloud Messaging, templates, regras de disparo"],
            ["uploads", "Integração com AWS S3, presigned URLs"],
            ["auditoria", "Logs imutáveis de ações"],
            ["configuracoes", "Parâmetros globais do sistema"],
            ["Jobs (BullMQ/Redis)", "Alertas de faturamento, medições pendentes, consolidação de dashboard"],
        ],
    )
    pdf.caixa_destaque(
        "ValidationPipe global: whitelist: true, forbidNonWhitelisted: true, transform: true.\n"
        "Stack: NestJS 10  |  TypeORM 0.3  |  PostgreSQL  |  Redis  |  BullMQ  |  Firebase Admin  |  AWS S3"
    )

    # ── 8. BANCO DE DADOS ─────────────────────────────────────────────────────
    pdf.secao(8, "Banco de Dados")
    pdf.paragrafo("Engine: PostgreSQL 15+")

    pdf.subsecao("Convenções globais")
    pdf.item("UUID v4 como chave primária em todas as tabelas (exceto tb_servicos_catalogo: serial int).")
    pdf.item("created_at e updated_at (UTC) em todas as tabelas para delta sync com o mobile.")
    pdf.item("deletado: boolean em todas as tabelas — soft delete universal.")
    pdf.item("DATABASE_SYNCHRONIZE=false — schema gerenciado exclusivamente por migrations SQL manuais.")

    pdf.subsecao("Tabelas principais (30 entidades)")
    pdf.bloco_codigo(
        "tb_perfis                          tb_usuarios\n"
        "tb_obras                           tb_clientes\n"
        "tb_pavimentos                      tb_ambientes\n"
        "tb_colaboradores                   tb_servicos_catalogo\n"
        "tb_tabela_precos                   tb_alocacoes_tarefa\n"
        "tb_alocacoes_itens                 tb_medicoes\n"
        "tb_medicoes_colaborador            tb_sessoes_diarias\n"
        "tb_rdo                             tb_vales_adiantamento\n"
        "tb_vales_adiantamento_parcelas     tb_lotes_pagamento\n"
        "tb_notification_events             tb_notification_templates\n"
        "tb_notification_rules              tb_notification_delivery\n"
        "tb_user_notification_preferences   tb_audit_logs\n"
        "tb_uploads                         tb_os_finalizacao\n"
        "tb_apropriacoes_financeiras        tb_itens_ambiente\n"
        "tb_auth_sessions                   tb_configuracoes"
    )

    # ── 9. FRONTEND ───────────────────────────────────────────────────────────
    pdf.secao(9, "Frontend Web")
    pdf.paragrafo("Stack: React 18  |  Vite  |  Material UI 5  |  Redux Toolkit  |  Axios  |  Recharts  |  jsPDF  |  xlsx")

    pdf.subsecao("Páginas implementadas (28 rotas)")
    pdf.item("Autenticação: login com JWT e renovação automática via interceptor Axios (401).")
    pdf.item("Dashboard: KPIs em tempo real, gráficos com Recharts.")
    pdf.item("CRUD completo: Obras, Clientes, Colaboradores, Serviços, Usuários.")
    pdf.item("Módulo financeiro: contas a pagar/receber, folha individual, vales, apropriação, relatórios.")
    pdf.item("Workflow de aprovação de preços de venda.")
    pdf.item("Alocação visual de colaboradores por ambiente.")
    pdf.item("Medições com flag de excedente e upload de foto.")
    pdf.item("RDO Digital (abertura e encerramento de sessões).")
    pdf.item("Logs de auditoria e administração de permissões.")

    pdf.subsecao("Funcionalidades especiais")
    pdf.item("Modo Alto Contraste (useHighContrastTheme) para uso sob luz solar na obra — WCAG 2.1 AA.")
    pdf.item("Exportação de relatórios em PDF (jspdf) e Excel (xlsx).")
    pdf.item("Dados bancários exibidos mascarados na interface.")
    pdf.item("Redux slices: authSlice, obrasSlice, clientesSlice, colaboradoresSlice, uiSlice.")

    # ── 10. MOBILE ────────────────────────────────────────────────────────────
    pdf.secao(10, "App Mobile (React Native)")
    pdf.paragrafo(
        "Stack: React Native 0.74  |  React Navigation  |  Redux Toolkit  |  React Native Paper"
    )

    pdf.subsecao("Telas principais")
    pdf.item("Login, Dashboard de obras, listagem de Obras, Clientes, Colaboradores.")
    pdf.item("Alocação visual de colaboradores por ambiente.")
    pdf.item("Formulário de RDO com geolocalização GPS.")
    pdf.item("Medições com contagem por steppers (botões grandes para uso com luvas).")
    pdf.item("Relatórios e financeiro (visualização).")
    pdf.item("Push notifications via Firebase Cloud Messaging.")

    pdf.subsecao("Características offline-first")
    pdf.item("UUID gerado no cliente para evitar colisão ao sincronizar com o servidor.")
    pdf.item("Delta sync com servidor via campos created_at / updated_at.")
    pdf.item("Indicador visual de status: 'Sincronizado há 2 min' vs 'Offline — 5 pendências'.")

    # ── 11. INTEGRAÇÕES ───────────────────────────────────────────────────────
    pdf.secao(11, "Integrações Externas")
    pdf.tabela(
        ["Serviço", "Finalidade"],
        [60, 130],
        [
            ["Firebase Cloud Messaging", "Push notifications para o app mobile"],
            ["AWS S3", "Armazenamento de fotos de excedentes e documentos"],
            ["Redis", "Cache e fila de jobs assíncronos (BullMQ)"],
            ["PostgreSQL 15+", "Banco de dados principal"],
        ],
    )

    # ── 12. GLOSSÁRIO ─────────────────────────────────────────────────────────
    pdf.secao(12, "Glossário do Domínio")
    pdf.tabela(
        ["Termo", "Definição"],
        [45, 145],
        [
            ["Obra", "Projeto de pintura em andamento em um endereço específico"],
            ["Pavimento", "Subdivisão de uma obra por andar ou seção"],
            ["Ambiente", "Unidade mínima de trabalho (ex: apartamento, escadaria)"],
            ["Alocação", "Vínculo entre um colaborador e um ambiente para execução de serviços"],
            ["Medição", "Registro da quantidade de serviço executada por um colaborador"],
            ["Excedente", "Medição que supera a área cadastrada; exige justificativa e foto"],
            ["RDO", "Registro Diário de Obra — sessão com GPS e assinatura digital"],
            ["Preço de Custo", "Valor unitário pago ao colaborador pelo serviço"],
            ["Preço de Venda", "Valor unitário cobrado do cliente; oculto para Encarregado"],
            ["Margem", "Diferença entre preço de venda e preço de custo"],
            ["Lote de Pagamento", "Agrupamento de medições aprovadas para gerar pagamento"],
            ["Vale de Adiantamento", "Pagamento antecipado ao colaborador, descontado na folha"],
            ["Cegueira Financeira", "Restrição que impede o Encarregado de visualizar preços de venda"],
            ["Soft Delete", "Exclusão lógica via campo deletado=true; dados nunca removidos fisicamente"],
        ],
    )

    caminho = "c:/Users/kbca_/develop/jb_pinturas/JB_Pinturas_ERP_Descricao_Geral.pdf"
    pdf.output(caminho)
    print(f"PDF gerado: {caminho}")


if __name__ == "__main__":
    gerar_pdf()
