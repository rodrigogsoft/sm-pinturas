# -*- coding: utf-8 -*-
from fpdf import FPDF
from fpdf.enums import XPos, YPos

# Paleta de cores
AZUL          = (30, 80, 160)
AZUL_CLARO    = (220, 230, 245)
AZUL_MEDIO    = (60, 120, 200)
CINZA_ESCURO  = (50, 50, 50)
CINZA_LINHA   = (210, 210, 210)
CINZA_BG      = (248, 248, 248)
BRANCO        = (255, 255, 255)
VERDE         = (20, 130, 60)
VERDE_CLARO   = (220, 245, 230)
VERMELHO      = (180, 30, 30)
VERMELHO_CLARO= (250, 220, 220)
AMARELO_CLARO = (255, 250, 220)
AMARELO       = (180, 140, 0)
LARANJA       = (200, 100, 0)

FONT_DIR = "C:/Windows/Fonts/"


class Manual(FPDF):
    _capitulo_atual = ""

    def __init__(self):
        super().__init__()
        self.add_font("Arial", "",   FONT_DIR + "arial.ttf")
        self.add_font("Arial", "B",  FONT_DIR + "arialbd.ttf")
        self.add_font("Arial", "I",  FONT_DIR + "ariali.ttf")
        self.add_font("Arial", "BI", FONT_DIR + "arialbi.ttf")

    def header(self):
        if self.page_no() == 1:
            return
        self.set_fill_color(*AZUL)
        self.rect(0, 0, 210, 14, "F")
        self.set_font("Arial", "B", 8)
        self.set_text_color(*BRANCO)
        self.set_xy(10, 3)
        self.cell(95, 8, "JB Pinturas ERP  —  Manual do Usuário", align="L")
        self.set_xy(105, 3)
        self.cell(95, 8, self._capitulo_atual, align="R")
        self.set_text_color(*CINZA_ESCURO)
        self.ln(16)

    def footer(self):
        if self.page_no() == 1:
            return
        self.set_y(-12)
        self.set_draw_color(*CINZA_LINHA)
        self.line(10, self.get_y(), 200, self.get_y())
        self.set_font("Arial", "", 7.5)
        self.set_text_color(150, 150, 150)
        self.ln(1)
        self.cell(0, 5, f"Página {self.page_no()}  —  JB Pinturas ERP  —  Manual do Usuário  —  Abril/2026  —  Uso interno", align="C")

    # ── helpers ────────────────────────────────────────────────────────────────

    def capitulo(self, numero, titulo):
        """Cabeçalho de capítulo — ocupa largura total com fundo azul escuro."""
        self._capitulo_atual = f"Capítulo {numero}: {titulo}"
        self.add_page()
        # banner do capítulo
        self.set_fill_color(*AZUL)
        self.rect(0, 14, 210, 40, "F")
        self.set_font("Arial", "", 9)
        self.set_text_color(180, 200, 240)
        self.set_xy(12, 20)
        self.cell(0, 6, f"CAPÍTULO {numero}")
        self.set_font("Arial", "B", 20)
        self.set_text_color(*BRANCO)
        self.set_xy(12, 28)
        self.cell(0, 12, titulo)
        self.set_text_color(*CINZA_ESCURO)
        self.set_y(62)

    def secao(self, titulo):
        self.ln(4)
        self.set_fill_color(*AZUL_CLARO)
        self.set_draw_color(*AZUL_MEDIO)
        self.set_font("Arial", "B", 11)
        self.set_text_color(*AZUL)
        self.cell(0, 8, f"  {titulo}", border="L", fill=True,
                  new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_draw_color(*CINZA_LINHA)
        self.set_text_color(*CINZA_ESCURO)
        self.ln(2)

    def subsecao(self, titulo):
        self.ln(3)
        self.set_font("Arial", "B", 9.5)
        self.set_text_color(*AZUL_MEDIO)
        self.cell(0, 6, titulo, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_text_color(*CINZA_ESCURO)
        self.ln(1)

    def p(self, texto):
        self.set_font("Arial", "", 9.5)
        self.set_text_color(*CINZA_ESCURO)
        self.multi_cell(0, 5.5, texto)
        self.ln(1.5)

    def item(self, texto, cor_bala=None):
        cor = cor_bala or AZUL_MEDIO
        self.set_x(13)
        self.set_fill_color(*cor)
        self.set_font("Arial", "", 9.5)
        # bala colorida
        self.rect(self.get_x(), self.get_y() + 1.8, 2, 2, "F")
        self.set_x(17)
        self.multi_cell(0, 5.5, texto)
        self.ln(0.5)

    def item_bold(self, prefixo, texto):
        self.set_x(17)
        self.set_font("Arial", "B", 9.5)
        w = self.get_string_width(prefixo + " ")
        self.cell(w, 5.5, prefixo + " ")
        self.set_font("Arial", "", 9.5)
        self.multi_cell(0, 5.5, texto)
        self.ln(0.5)

    def alerta(self, texto, tipo="info"):
        cores = {
            "info":    (AZUL_CLARO, AZUL),
            "ok":      (VERDE_CLARO, VERDE),
            "aviso":   (AMARELO_CLARO, AMARELO),
            "perigo":  (VERMELHO_CLARO, VERMELHO),
        }
        bg, borda = cores.get(tipo, cores["info"])
        self.set_fill_color(*bg)
        self.set_draw_color(*borda)
        self.set_font("Arial", "I", 9)
        self.set_text_color(*CINZA_ESCURO)
        self.multi_cell(0, 5.5, texto, border=1, fill=True)
        self.set_draw_color(*CINZA_LINHA)
        self.set_text_color(*CINZA_ESCURO)
        self.ln(2)

    def passo(self, numero, titulo, descricao):
        self.set_fill_color(*AZUL)
        self.set_font("Arial", "B", 9)
        self.set_text_color(*BRANCO)
        self.set_x(12)
        self.cell(7, 7, str(numero), fill=True, align="C")
        self.set_fill_color(*AZUL_CLARO)
        self.set_text_color(*AZUL)
        self.cell(0, 7, f"  {titulo}", fill=True,
                  new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        if descricao:
            self.set_x(20)
            self.set_font("Arial", "", 9.5)
            self.set_text_color(*CINZA_ESCURO)
            self.multi_cell(0, 5.5, descricao)
        self.ln(2)

    def tabela(self, cabecalhos, larguras, linhas, col_bold=None):
        self.set_fill_color(*AZUL)
        self.set_text_color(*BRANCO)
        self.set_font("Arial", "B", 9)
        for i, cab in enumerate(cabecalhos):
            self.cell(larguras[i], 7, cab, border=1, fill=True)
        self.ln()
        self.set_text_color(*CINZA_ESCURO)
        for idx, linha in enumerate(linhas):
            bg = (245, 248, 255) if idx % 2 == 0 else BRANCO
            self.set_fill_color(*bg)
            for i, cel in enumerate(linha):
                estilo = "B" if col_bold is not None and i == col_bold else ""
                self.set_font("Arial", estilo, 8.5)
                self.cell(larguras[i], 6.5, str(cel), border=1, fill=True)
            self.ln()
        self.ln(2)

    def caixa_regra(self, codigo, titulo, texto, tipo="info"):
        cores = {
            "info":   (AZUL_CLARO, AZUL),
            "aviso":  (AMARELO_CLARO, AMARELO),
            "perigo": (VERMELHO_CLARO, VERMELHO),
            "ok":     (VERDE_CLARO, VERDE),
        }
        bg, borda = cores[tipo]
        self.set_fill_color(*bg)
        self.set_draw_color(*borda)
        # cabeçalho da caixa
        self.set_font("Arial", "B", 9)
        self.set_text_color(*borda)
        self.cell(0, 7, f"  {codigo}  —  {titulo}", border="TLR", fill=True,
                  new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        # corpo
        self.set_font("Arial", "", 9)
        self.set_text_color(*CINZA_ESCURO)
        self.multi_cell(0, 5.5, texto, border="BLR", fill=True)
        self.set_draw_color(*CINZA_LINHA)
        self.ln(3)

    def fluxo_seta(self, etapas):
        """Renderiza uma lista de etapas em linha horizontal com setas."""
        n = len(etapas)
        w_etapa = 160 / n
        x0 = 13
        y0 = self.get_y()
        for i, (label, sub) in enumerate(etapas):
            x = x0 + i * (w_etapa + 4)
            self.set_fill_color(*AZUL_MEDIO)
            self.set_draw_color(*AZUL)
            self.set_font("Arial", "B", 7.5)
            self.set_text_color(*BRANCO)
            self.set_xy(x, y0)
            self.cell(w_etapa, 8, label, border=1, fill=True, align="C")
            if sub:
                self.set_font("Arial", "", 7)
                self.set_text_color(*AZUL)
                self.set_xy(x, y0 + 8)
                self.cell(w_etapa, 5, sub, align="C")
            if i < n - 1:
                self.set_font("Arial", "B", 9)
                self.set_text_color(*AZUL)
                self.set_xy(x + w_etapa, y0 + 1)
                self.cell(4, 6, ">", align="C")
        self.set_text_color(*CINZA_ESCURO)
        self.ln(16)


# ══════════════════════════════════════════════════════════════════════════════
def gerar_manual():
    pdf = Manual()
    pdf.set_margins(12, 18, 12)
    pdf.set_auto_page_break(True, margin=16)

    # ══════════════════════════════════════════════════════════════════════════
    # CAPA
    # ══════════════════════════════════════════════════════════════════════════
    pdf.add_page()
    # fundo superior
    pdf.set_fill_color(*AZUL)
    pdf.rect(0, 0, 210, 130, "F")
    # título
    pdf.set_font("Arial", "B", 36)
    pdf.set_text_color(*BRANCO)
    pdf.set_xy(0, 35)
    pdf.cell(210, 16, "JB PINTURAS", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Arial", "B", 22)
    pdf.set_xy(0, 55)
    pdf.cell(210, 10, "ERP de Gestão de Obras", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    # subtítulo
    pdf.set_fill_color(*AZUL_MEDIO)
    pdf.rect(30, 72, 150, 14, "F")
    pdf.set_font("Arial", "B", 13)
    pdf.set_xy(30, 75)
    pdf.cell(150, 8, "MANUAL DO USUÁRIO", align="C")
    # versão
    pdf.set_font("Arial", "", 9)
    pdf.set_text_color(180, 200, 240)
    pdf.set_xy(0, 92)
    pdf.cell(210, 6, "Versão 1.0  —  Abril/2026", align="C")
    # fundo inferior
    pdf.set_fill_color(*BRANCO)
    pdf.rect(0, 130, 210, 167, "F")
    # índice rápido
    pdf.set_font("Arial", "B", 11)
    pdf.set_text_color(*AZUL)
    pdf.set_xy(20, 140)
    pdf.cell(0, 8, "Conteúdo deste manual")
    pdf.set_draw_color(*AZUL_CLARO)
    pdf.line(20, 150, 190, 150)
    capitulos = [
        ("1", "Introdução e Acesso ao Sistema"),
        ("2", "Perfis de Usuário e o que cada um pode fazer"),
        ("3", "Regras de Negócio — o que o sistema garante automaticamente"),
        ("4", "Fluxo Operacional — Dia a Dia no Campo"),
        ("5", "Fluxo Financeiro — Precificação e Pagamentos"),
        ("6", "Medições e Excedentes"),
        ("7", "Relatórios e Dashboard"),
        ("8", "Notificações e Alertas"),
        ("9", "Perguntas Frequentes e Situações de Erro"),
    ]
    pdf.set_text_color(*CINZA_ESCURO)
    for i, (num, titulo) in enumerate(capitulos):
        y = 154 + i * 11
        pdf.set_fill_color(*AZUL)
        pdf.set_font("Arial", "B", 9)
        pdf.set_text_color(*BRANCO)
        pdf.set_xy(20, y)
        pdf.cell(8, 8, num, fill=True, align="C")
        pdf.set_font("Arial", "", 9.5)
        pdf.set_text_color(*CINZA_ESCURO)
        pdf.set_xy(30, y)
        pdf.cell(0, 8, titulo)

    # ══════════════════════════════════════════════════════════════════════════
    # CAP 1 — INTRODUÇÃO
    # ══════════════════════════════════════════════════════════════════════════
    pdf.capitulo(1, "Introdução e Acesso ao Sistema")

    pdf.p(
        "O JB Pinturas ERP é o sistema central de gestão da empresa. Ele reúne em um único "
        "lugar todas as informações sobre obras, colaboradores, medições e financeiro — "
        "eliminando planilhas e papéis. Este manual explica, de forma prática, como cada "
        "perfil de usuário utiliza o sistema no dia a dia."
    )

    pdf.secao("Como acessar o sistema")
    pdf.subsecao("Pelo computador (Painel Web)")
    pdf.item("Abra o navegador e acesse o endereço fornecido pelo administrador.")
    pdf.item("Digite seu e-mail cadastrado e sua senha.")
    pdf.item("Clique em Entrar.")
    pdf.alerta(
        "Na primeira vez que acessar, ou sempre que o sistema solicitar, você precisará "
        "confirmar sua identidade com um código de 6 dígitos gerado pelo aplicativo autenticador "
        "(Google Authenticator ou similar). Esse recurso se chama MFA — Autenticação em Dois Fatores.",
        "info"
    )

    pdf.subsecao("Pelo celular (App Mobile)")
    pdf.item("Instale o aplicativo JB Pinturas disponibilizado pelo administrador.")
    pdf.item("Abra o app, informe e-mail e senha e toque em Entrar.")
    pdf.item("O app funciona mesmo sem internet — os dados são sincronizados quando a conexão retornar.")
    pdf.alerta(
        "Indicador de sincronização: o app exibe 'Sincronizado há X min' quando está conectado "
        "e 'Offline — X pendências' quando os dados ainda não foram enviados ao servidor.",
        "aviso"
    )

    pdf.secao("Navegação geral")
    pdf.p(
        "No painel web, o menu lateral esquerdo dá acesso a todos os módulos. "
        "No app mobile, use o menu gaveta (ícone de três linhas no canto superior esquerdo) "
        "ou as abas na parte inferior da tela."
    )
    pdf.p("Cada usuário verá apenas as opções que seu perfil permite acessar.")

    # ══════════════════════════════════════════════════════════════════════════
    # CAP 2 — PERFIS
    # ══════════════════════════════════════════════════════════════════════════
    pdf.capitulo(2, "Perfis de Usuário")

    pdf.p(
        "O sistema possui quatro perfis de acesso. Cada perfil representa uma função na empresa "
        "e determina o que o usuário pode ver e fazer. O administrador é responsável por "
        "cadastrar os usuários e atribuir os perfis corretos."
    )

    pdf.tabela(
        ["Perfil", "Quem é", "Foco principal"],
        [32, 50, 104],
        [
            ["ADMINISTRADOR", "TI / Gestão do sistema", "Configurações, usuários, auditoria e exceções"],
            ["GESTOR",        "Diretor / Gerente",       "Aprovações de preço, validação de medições, visão financeira"],
            ["FINANCEIRO",    "Setor financeiro",        "Clientes, precificação de venda, pagamentos"],
            ["ENCARREGADO",   "Líder de obra no campo",  "Estrutura de obras, Ordens de Serviço, alocações, medições"],
        ],
        col_bold=0,
    )

    pdf.alerta(
        "IMPORTANTE — Cegueira Financeira (RN01):\n"
        "O perfil ENCARREGADO nunca visualiza preços de venda nem dados financeiros sensíveis. "
        "Essa restrição é aplicada automaticamente pelo sistema — não é possível contorná-la.",
        "perigo"
    )

    pdf.secao("O que cada perfil pode fazer")

    perfis = [
        (
            "ADMINISTRADOR",
            AZUL,
            [
                "Cadastrar e editar usuários, definir perfis.",
                "Visualizar o log de auditoria completo (quem fez o quê e quando).",
                "Acessar configurações globais do sistema.",
                "Forçar geração de medição quando há preço pendente (com justificativa obrigatória registrada em auditoria).",
                "Tudo que os demais perfis podem fazer.",
            ],
            []
        ),
        (
            "GESTOR",
            AZUL_MEDIO,
            [
                "Aprovar ou rejeitar preços de venda cadastrados pelo Financeiro.",
                "Ver a margem de lucro calculada automaticamente (Venda − Custo).",
                "Validar medições técnicas antes do fechamento.",
                "Acessar relatórios de produtividade e margem.",
                "Ver dados bancários de clientes sem máscara.",
            ],
            []
        ),
        (
            "FINANCEIRO",
            VERDE,
            [
                "Cadastrar e editar clientes (CNPJ, dados bancários).",
                "Inserir preços de venda (ficam em análise até aprovação do Gestor).",
                "Editar preços de custo.",
                "Gerar lotes de pagamento e processar pagamentos.",
                "Registrar e gerenciar vales de adiantamento.",
                "Acessar relatórios financeiros.",
            ],
            []
        ),
        (
            "ENCARREGADO",
            LARANJA,
            [
                "Criar obras e cadastrar pavimentos, ambientes e elementos de serviço.",
                "Criar Ordens de Serviço (O.S.) e alocar colaboradores.",
                "Definir o serviço e o preço de custo por elemento de serviço.",
                "Lançar medições de produção dentro da O.S.",
                "Registrar excedentes com justificativa e foto.",
                "Encerrar a O.S. ao concluir o trabalho.",
            ],
            [
                "Não vê preços de venda.",
                "Não acessa o módulo financeiro.",
                "Não pode aprovar preços.",
            ]
        ),
    ]

    for nome, cor, pode, nao_pode in perfis:
        pdf.ln(2)
        pdf.set_fill_color(*cor)
        pdf.set_font("Arial", "B", 10)
        pdf.set_text_color(*BRANCO)
        pdf.cell(0, 8, f"  {nome}", fill=True,
                 new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_text_color(*CINZA_ESCURO)
        pdf.ln(1)
        for p_item in pode:
            pdf.item(p_item, VERDE)
        for n_item in nao_pode:
            pdf.item(n_item, VERMELHO)
        pdf.ln(1)

    # ══════════════════════════════════════════════════════════════════════════
    # CAP 3 — REGRAS DE NEGÓCIO
    # ══════════════════════════════════════════════════════════════════════════
    pdf.capitulo(3, "Regras de Negócio")

    pdf.p(
        "O sistema aplica automaticamente as regras de negócio da JB Pinturas. "
        "Não é necessário memorizá-las — o sistema avisará quando uma ação não for permitida. "
        "Esta seção explica o porquê de cada restrição."
    )

    pdf.caixa_regra(
        "RN01", "Cegueira Financeira do Encarregado",
        "O perfil Encarregado nunca visualiza preços de venda, margens ou dados financeiros sensíveis. "
        "Isso protege as informações estratégicas da empresa e evita que valores negociados com "
        "clientes sejam expostos no canteiro de obras.\n\n"
        "Como funciona: o sistema simplesmente não exibe esses campos para esse perfil. "
        "Não existe botão ou configuração para desativar essa restrição.",
        "perigo"
    )

    pdf.caixa_regra(
        "RN02", "Bloqueio de Medição com Preço Pendente",
        "Enquanto um serviço tiver preço de venda em análise (aguardando aprovação do Gestor), "
        "o sistema bloqueia a geração de medições para aquela obra.\n\n"
        "Objetivo: garantir que nenhuma medição seja fechada com valor de venda indefinido, "
        "evitando prejuízo ou distorção no relatório de margem.\n\n"
        "Exceção: o Administrador pode forçar a geração mediante justificativa obrigatória, "
        "que fica registrada no log de auditoria com data, hora e nome do usuário.",
        "aviso"
    )

    pdf.caixa_regra(
        "RN03", "Um Colaborador por Ambiente (Alocação 1:1)",
        "Cada ambiente só pode ter um colaborador ativo ao mesmo tempo. "
        "Se o Encarregado tentar alocar um segundo colaborador em um ambiente já ocupado, "
        "o sistema exibirá uma mensagem de erro:\n\n"
        "    \"Ambiente em uso por [Nome do Colaborador]. Encerre a tarefa anterior primeiro.\"\n\n"
        "Objetivo: evitar conflito de produção e garantir que a medição de cada ambiente "
        "seja atribuída corretamente a um único responsável.",
        "aviso"
    )

    pdf.caixa_regra(
        "RN04", "Proteção de Dados Sensíveis",
        "• Dados bancários de clientes são exibidos mascarados (ex: ***-5 dígitos) na interface. "
        "Apenas Gestor e Financeiro veem o valor completo.\n"
        "• No banco de dados, esses dados são armazenados com criptografia AES-256.\n"
        "• Toda comunicação entre o app/painel e o servidor usa protocolo seguro (TLS 1.2+).\n\n"
        "Objetivo: conformidade com a LGPD e proteção contra vazamento de dados.",
        "info"
    )

    pdf.caixa_regra(
        "AUDIT", "Auditoria Imutável",
        "Todas as ações importantes (aprovações, exclusões, forçar medição, alterações de preço) "
        "são registradas em um log de auditoria que não pode ser editado nem excluído — "
        "nem mesmo pelo Administrador.\n\n"
        "O log mostra: quem fez, o quê fez, quando (data e hora), e de qual IP/dispositivo.",
        "ok"
    )

    # ══════════════════════════════════════════════════════════════════════════
    # CAP 4 — FLUXO OPERACIONAL
    # ══════════════════════════════════════════════════════════════════════════
    pdf.capitulo(4, "Fluxo Operacional — Dia a Dia no Campo")

    pdf.p(
        "O trabalho do Encarregado no sistema se divide em dois fluxos bem distintos. "
        "O Fluxo 1 é feito uma única vez por obra — é o cadastro da estrutura. "
        "O Fluxo 2 é repetido quantas vezes for necessário — é a operação diária via Ordem de Serviço (O.S.)."
    )

    # ── HIERARQUIA VISUAL ───────────────────────────────────────────────────
    pdf.secao("Hierarquia de dados da obra")
    pdf.p("Todo o trabalho de campo é organizado em quatro níveis dentro de cada obra:")

    niveis = [
        ("OBRA",                "Ex: Condomínio Tereza Aires"),
        ("PAVIMENTO",           "Ex: Térreo, 1º Andar, 2º Andar..."),
        ("AMBIENTE",            "Ex: Apartamento 101, Hall, Escada de Incêndio"),
        ("ELEMENTO DE SERVIÇO", "Ex: Parede, Piso, Teto, Sacada, Corrimão"),
    ]
    recuos = [12, 20, 28, 36]
    for i, (nivel, exemplo) in enumerate(niveis):
        x = recuos[i]
        pdf.set_x(x)
        pdf.set_fill_color(*AZUL_MEDIO if i < 3 else VERDE)
        pdf.set_font("Arial", "B", 9)
        pdf.set_text_color(*BRANCO)
        largura = 186 - x
        pdf.cell(largura, 7, f"  {nivel}  —  {exemplo}", fill=True,
                 new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        if i < 3:
            pdf.set_x(recuos[i] + 3)
            pdf.set_font("Arial", "", 7.5)
            pdf.set_text_color(*AZUL_MEDIO)
            pdf.cell(4, 4, "|")
            pdf.ln(0)
    pdf.set_text_color(*CINZA_ESCURO)
    pdf.ln(3)

    pdf.alerta(
        "O Elemento de Serviço é a parte física de um ambiente que será pintada ou tratada. "
        "Cada ambiente pode ter vários elementos (ex: Apartamento tem Parede, Piso, Teto e Sacada). "
        "É no elemento que o serviço e o preço de custo são definidos.",
        "info"
    )

    # ── FLUXO 1 ─────────────────────────────────────────────────────────────
    pdf.secao("Fluxo 1 — Estrutura da Obra  (feito uma vez por obra)")

    pdf.fluxo_seta([
        ("1. Criar Obra",       "Dados gerais"),
        ("2. Pavimentos",       "Andares / seções"),
        ("3. Ambientes",        "Por pavimento"),
        ("4. Elementos",        "Por ambiente"),
    ])

    pdf.passo(1, "Cadastrar a Obra",
              "Acesse Obras > Nova Obra. Preencha:\n"
              "• Nome da obra  |  Endereço completo\n"
              "• Data de início e previsão de término\n"
              "• Cliente (deve estar previamente cadastrado pelo Financeiro)\n\n"
              "Exemplo: Nome = 'Condomínio Tereza Aires',  Endereço = 'Rua das Flores, 100'.")

    pdf.passo(2, "Cadastrar os Pavimentos",
              "Dentro da obra, acesse Pavimentos > Novo Pavimento.\n"
              "Cadastre um pavimento para cada andar ou seção da obra.\n\n"
              "Exemplo — Condomínio Tereza Aires:\n"
              "• Térreo\n• 1º Andar\n• 2º Andar\n• 3º Andar\n• 4º Andar")

    pdf.passo(3, "Cadastrar os Ambientes",
              "Dentro de cada pavimento, acesse Ambientes > Novo Ambiente.\n"
              "Informe o nome e a área total em m² (usada para detectar excedentes).\n\n"
              "Exemplo — Pavimento Térreo:\n"
              "• Apartamento 101  |  Apartamento 102  |  Apartamento 103  |  Apartamento 104\n"
              "• Hall do Térreo\n"
              "• Escada de Incêndio")

    pdf.passo(4, "Cadastrar os Elementos de Serviço",
              "Dentro de cada ambiente, adicione os Elementos de Serviço.\n"
              "Um elemento representa uma parte física do ambiente que será tratada/pintada.\n\n"
              "Exemplos por ambiente:\n"
              "• Apartamento 101:  Parede, Piso, Teto, Sacada\n"
              "• Hall do Térreo:   Parede, Quadro de Água, Quadro de Energia\n"
              "• Escada de Incêndio: Parede, Corrimão")

    pdf.alerta(
        "Após cadastrar toda a estrutura (pavimentos, ambientes e elementos), "
        "altere o status da obra para ATIVA. "
        "Somente obras com status ATIVA permitem criar Ordens de Serviço.",
        "info"
    )

    # ── FLUXO 2 ─────────────────────────────────────────────────────────────
    pdf.secao("Fluxo 2 — Operação por O.S.  (repetido a cada trabalho)")

    pdf.p(
        "A Ordem de Serviço (O.S.) é o documento que registra formalmente o trabalho "
        "executado por um colaborador em um elemento de serviço específico. "
        "Uma nova O.S. pode ser aberta sempre que um colaborador iniciar um trabalho."
    )

    pdf.fluxo_seta([
        ("1. Criar O.S.",       "Obra ativa"),
        ("2. Alocar",           "Colaborador + elemento"),
        ("3. Medições",         "Quantidade executada"),
        ("4. Encerrar O.S.",    "Confirmar e fechar"),
    ])

    pdf.passo(1, "Criar a Ordem de Serviço (O.S.)",
              "Acesse O.S. > Nova O.S. dentro da obra desejada.\n"
              "Informe a data e, se necessário, uma observação sobre o trabalho previsto.\n\n"
              "Exemplo: O.S. #001 — Pintura do Térreo — Condomínio Tereza Aires.")

    pdf.passo(2, "Alocar o Colaborador",
              "Dentro da O.S., clique em Adicionar Colaborador e preencha:\n"
              "• Colaborador: nome do profissional que vai executar\n"
              "• Pavimento: onde será o trabalho\n"
              "• Ambiente: o local específico dentro do pavimento\n"
              "• Elemento de Serviço: a parte do ambiente (Parede, Piso, Teto...)\n"
              "• Serviço: o tipo de serviço do catálogo (ex: Pintura em Esmalte)\n"
              "• Preço de Custo: valor unitário pago ao colaborador (ex: R$ 10,00/m²)\n\n"
              "Exemplo real:\n"
              "Colaborador: João  |  Pavimento: Térreo  |  Ambiente: Apartamento 101\n"
              "Elemento: Parede  |  Serviço: Pintura em Esmalte  |  Custo: R$ 10,00/m²")

    pdf.alerta(
        "Um mesmo ambiente não pode ter dois colaboradores ativos ao mesmo tempo (RN03). "
        "Se João já estiver alocado no Apartamento 101, não é possível alocar outro colaborador "
        "no mesmo apartamento até que a tarefa do João seja encerrada.",
        "aviso"
    )

    pdf.passo(3, "Lançar as Medições",
              "À medida que o trabalho avança, registre a produção:\n"
              "• Selecione a alocação dentro da O.S.\n"
              "• Informe a quantidade executada (m², ml, un etc.)\n"
              "• Use os botões + e – para precisão\n\n"
              "Se a medição ultrapassar a área cadastrada do elemento, o sistema exigirá "
              "justificativa e foto (excedente — veja Capítulo 6).")

    pdf.passo(4, "Encerrar a O.S.",
              "Quando o trabalho estiver concluído, acesse a O.S. > Encerrar.\n"
              "O sistema registra data e hora de encerramento e consolida todas as medições.\n"
              "A O.S. encerrada alimenta automaticamente os relatórios financeiros e de produtividade.")

    # ── EXEMPLO COMPLETO ─────────────────────────────────────────────────────
    pdf.secao("Exemplo Real Completo — Condomínio Tereza Aires")

    pdf.set_fill_color(245, 248, 255)
    pdf.set_draw_color(*AZUL_CLARO)

    # Fluxo 1 — exemplo
    pdf.set_font("Arial", "B", 9.5)
    pdf.set_text_color(*AZUL)
    pdf.cell(0, 7, "  Fluxo 1: Estruturando a obra", border=1, fill=True,
             new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_text_color(*CINZA_ESCURO)
    linhas_f1 = [
        ("Obra",                "Condomínio Tereza Aires"),
        ("Pavimentos (5)",       "Térreo, 1º Andar, 2º Andar, 3º Andar, 4º Andar"),
        ("Ambientes / andar",   "Apt 101, Apt 102, Apt 103, Apt 104, Hall, Escada de Incêndio"),
        ("Elementos — Apt",     "Parede, Piso, Teto, Sacada"),
        ("Elementos — Hall",    "Parede, Quadro de Água, Quadro de Energia"),
        ("Elementos — Escada",  "Parede, Corrimão"),
    ]
    for rotulo, valor in linhas_f1:
        pdf.set_font("Arial", "B", 8.5)
        pdf.set_x(13)
        pdf.cell(42, 5.5, rotulo + ":", border="B", fill=True)
        pdf.set_font("Arial", "", 8.5)
        pdf.cell(0, 5.5, valor, border="B", fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(3)

    # Fluxo 2 — exemplo
    pdf.set_font("Arial", "B", 9.5)
    pdf.set_text_color(*VERDE)
    pdf.cell(0, 7, "  Fluxo 2: Criando a O.S. e alocando João", border=1, fill=True,
             new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_text_color(*CINZA_ESCURO)
    linhas_f2 = [
        ("O.S.",              "O.S. #001 — Pintura Térreo"),
        ("Colaborador",       "João"),
        ("Obra",              "Condomínio Tereza Aires"),
        ("Pavimento",         "Térreo"),
        ("Ambiente",          "Apartamento 101"),
        ("Elemento",          "Parede"),
        ("Serviço",           "Pintura em Esmalte"),
        ("Preço de Custo",    "R$ 10,00 por m²"),
    ]
    for rotulo, valor in linhas_f2:
        pdf.set_font("Arial", "B", 8.5)
        pdf.set_x(13)
        pdf.cell(42, 5.5, rotulo + ":", border="B", fill=True)
        pdf.set_font("Arial", "", 8.5)
        pdf.cell(0, 5.5, valor, border="B", fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_draw_color(*CINZA_LINHA)
    pdf.ln(3)

    # ══════════════════════════════════════════════════════════════════════════
    # CAP 5 — FLUXO FINANCEIRO
    # ══════════════════════════════════════════════════════════════════════════
    pdf.capitulo(5, "Fluxo Financeiro — Precificação e Pagamentos")

    pdf.p(
        "Este capítulo explica como os preços são cadastrados e aprovados, "
        "como são gerados os pagamentos e como funcionam os vales de adiantamento."
    )

    pdf.secao("Precificação Dual — Custo e Venda")

    pdf.p(
        "O sistema mantém dois preços para cada serviço do catálogo. "
        "Eles são independentes e têm finalidades diferentes:"
    )

    pdf.tabela(
        ["Tipo de Preço", "Significado", "Quem vê", "Quem edita"],
        [35, 65, 45, 41],
        [
            ["Preço de Custo", "Valor pago ao colaborador pelo serviço",
             "Encarregado, Financeiro, Gestor, Admin", "Encarregado, Financeiro"],
            ["Preço de Venda", "Valor cobrado do cliente pelo serviço",
             "Financeiro, Gestor, Admin APENAS", "Financeiro (com aprovação do Gestor)"],
        ],
    )

    pdf.secao("Workflow de Aprovação de Preço de Venda")

    pdf.fluxo_seta([
        ("Financeiro cadastra", "Status: PENDENTE"),
        ("Gestor analisa",      "Margem calculada"),
        ("Aprovado/Rejeitado",  "APROVADO / REJEITADO"),
        ("Medições liberadas",  "Se aprovado"),
    ])

    pdf.passo(1, "Financeiro insere o preço de venda",
              "Acesse Preços > Tabela de Preços > selecione o serviço > edite o Preço de Venda.\n"
              "O preço fica com status PENDENTE até o Gestor se manifestar.")

    pdf.passo(2, "Sistema notifica o Gestor",
              "O Gestor recebe uma notificação para analisar o novo preço.\n"
              "O sistema exibe automaticamente a margem calculada: Venda − Custo.")

    pdf.passo(3, "Gestor aprova ou rejeita",
              "Acesse Preços > Aprovações Pendentes.\n"
              "• Aprovar: o preço passa a valer imediatamente.\n"
              "• Rejeitar: o Financeiro é notificado para revisar o valor.")

    pdf.alerta(
        "Enquanto houver um preço com status PENDENTE, o sistema bloqueia a geração de "
        "medições para a obra afetada (RN02). Regularize os preços pendentes para desbloquear.",
        "aviso"
    )

    pdf.secao("Geração de Pagamentos")

    pdf.passo(1, "Fechar as medições do período",
              "Após validação do Gestor, acesse Financeiro > Lotes de Pagamento > Novo Lote.\n"
              "Selecione o período (quinzena ou mês) e a obra.")

    pdf.passo(2, "Revisar o lote",
              "O sistema agrupa todas as medições aprovadas do período.\n"
              "Cada linha mostra: colaborador, serviço, quantidade, preço de custo e total a pagar.")

    pdf.passo(3, "Confirmar e processar",
              "Clique em Processar Pagamento. O lote é fechado e os valores ficam registrados.\n"
              "Gere o comprovante em PDF para o colaborador.")

    pdf.secao("Vales de Adiantamento")

    pdf.item_bold("Registrar um vale:", "Acesse Financeiro > Vales de Adiantamento > Novo Vale.\n"
                  "Informe o colaborador, o valor e, se necessário, o número de parcelas.")
    pdf.item_bold("Desconto automático:", "Na geração do próximo lote de pagamento, "
                  "os vales em aberto do colaborador aparecem como desconto.")
    pdf.item_bold("Acompanhar parcelas:", "Na tela do vale, você vê quais parcelas já foram descontadas "
                  "e quais ainda estão pendentes.")

    # ══════════════════════════════════════════════════════════════════════════
    # CAP 6 — MEDIÇÕES E EXCEDENTES
    # ══════════════════════════════════════════════════════════════════════════
    pdf.capitulo(6, "Medições e Excedentes")

    pdf.p(
        "A medição é o registro de quanto de cada serviço foi produzido por um colaborador "
        "em um ambiente. É a base para o cálculo do pagamento e da margem de lucro da obra."
    )

    pdf.secao("Como registrar uma medição")

    pdf.passo(1, "Acesse a alocação ativa",
              "No app ou no painel web, acesse a obra > selecione o ambiente > selecione a alocação em andamento.")

    pdf.passo(2, "Selecione o serviço",
              "Escolha o serviço executado na lista de itens da alocação.\n"
              "Cada item mostra a unidade de medida (m², ml, un, vb) e a quantidade já registrada.")

    pdf.passo(3, "Informe a quantidade produzida",
              "Use os botões + e – ou digite a quantidade.\n"
              "O sistema compara com a área cadastrada do ambiente automaticamente.")

    pdf.passo(4, "Salve a medição",
              "Clique em Salvar. A medição é registrada com data, hora e nome do colaborador.")

    pdf.secao("O que é um Excedente?")

    pdf.p(
        "Um excedente ocorre quando a quantidade medida ultrapassa a área ou dimensão "
        "cadastrada para o ambiente. Exemplo: o ambiente tem 20 m² cadastrados, "
        "mas o colaborador executou 23 m²."
    )

    pdf.alerta(
        "Quando o sistema detecta um excedente, ele NÃO cancela o registro. "
        "Em vez disso, exige que o Encarregado forneça:\n\n"
        "1. Uma justificativa textual explicando o motivo do excedente.\n"
        "2. Uma foto como evidência (obrigatória).\n\n"
        "Sem esses dois itens, o registro de excedente não pode ser concluído.",
        "aviso"
    )

    pdf.subsecao("Como registrar um excedente")
    pdf.item("O sistema detecta automaticamente o excedente ao salvar a medição.")
    pdf.item("Uma tela de Excedente é exibida solicitando a justificativa.")
    pdf.item("Toque em Tirar Foto para registrar a evidência fotográfica.")
    pdf.item("Digite a justificativa (mínimo recomendado: 20 palavras).")
    pdf.item("Toque em Confirmar. A foto é enviada ao servidor e o registro é concluído.")

    pdf.subsecao("Quem analisa os excedentes?")
    pdf.p(
        "O Gestor pode visualizar todos os excedentes registrados no painel web, "
        "com a justificativa e a foto. Excedentes recorrentes em um mesmo ambiente "
        "indicam que a área cadastrada pode estar incorreta e deve ser corrigida."
    )

    # ══════════════════════════════════════════════════════════════════════════
    # CAP 7 — RELATÓRIOS
    # ══════════════════════════════════════════════════════════════════════════
    pdf.capitulo(7, "Relatórios e Dashboard")

    pdf.p(
        "O sistema oferece relatórios em tempo real e exportação para PDF e Excel. "
        "O acesso a cada relatório depende do perfil do usuário."
    )

    pdf.secao("Dashboard Principal")
    pdf.p("Disponível para Gestor, Financeiro e Admin. Exibe em tempo real:")
    pdf.item("Total de obras ativas e status de cada uma.")
    pdf.item("Receita prevista vs. custo acumulado.")
    pdf.item("Margem de lucro por obra (gráfico de barras).")
    pdf.item("Medições do período atual e comparativo com o anterior.")
    pdf.item("Alertas de faturamento próximos.")

    pdf.secao("Relatórios disponíveis por perfil")

    pdf.tabela(
        ["Relatório", "Descrição", "Admin", "Gestor", "Financeiro", "Encarregado"],
        [50, 70, 14, 14, 20, 18],
        [
            ["Produtividade", "Quantidade produzida por colaborador e período", "Sim", "Sim", "Sim", ""],
            ["Margem de Lucro", "Custo vs. Venda por serviço e por obra", "Sim", "Sim", "", ""],
            ["Medições Detalhadas", "Todas as medições por ambiente e colaborador", "Sim", "Sim", "Sim", "Sim"],
            ["Contas a Pagar", "Pagamentos pendentes aos colaboradores", "Sim", "", "Sim", ""],
            ["Contas a Receber", "Faturamento pendente dos clientes", "Sim", "Sim", "Sim", ""],
            ["Apropriação de Custos", "Custo detalhado por serviço na obra", "Sim", "Sim", "Sim", ""],
            ["Folha Individual", "Resumo de pagamento de um colaborador", "Sim", "", "Sim", ""],
            ["Log de Auditoria", "Todas as ações realizadas no sistema", "Sim", "", "", ""],
        ],
    )

    pdf.alerta(
        "Para exportar um relatório: clique no botão PDF ou Excel no canto superior direito "
        "da tela do relatório. O arquivo é gerado e baixado automaticamente.",
        "info"
    )

    # ══════════════════════════════════════════════════════════════════════════
    # CAP 8 — NOTIFICAÇÕES
    # ══════════════════════════════════════════════════════════════════════════
    pdf.capitulo(8, "Notificações e Alertas")

    pdf.p(
        "O sistema envia notificações automáticas para manter todos os usuários "
        "informados sobre eventos importantes. As notificações chegam pelo app "
        "mobile (push) e aparecem no painel web."
    )

    pdf.secao("Tipos de notificação por perfil")

    pdf.tabela(
        ["Notificação", "Perfil que recebe", "Quando dispara"],
        [65, 40, 81],
        [
            ["Preço de venda aguardando aprovação", "GESTOR", "Quando Financeiro cadastra novo preço de venda"],
            ["Preço de venda aprovado/rejeitado", "FINANCEIRO", "Quando Gestor toma decisão sobre o preço"],
            ["Medição pendente de validação", "GESTOR", "Quando Encarregado registra medição"],
            ["Alerta de faturamento próximo", "FINANCEIRO, GESTOR", "Quando data de corte do cliente se aproxima"],
            ["Colaborador sem produção há 2 dias", "ENCARREGADO", "Quando colaborador alocado não tem medição recente"],
            ["Sessão aberta sem encerramento", "ENCARREGADO", "Quando RDO ficou aberto além do horário esperado"],
        ],
    )

    pdf.secao("Gerenciar preferências de notificação")
    pdf.item("Acesse o menu > seu nome > Preferências de Notificação.")
    pdf.item("É possível ativar ou desativar cada tipo de notificação individualmente.")
    pdf.item("As configurações são salvas por usuário e valem tanto no app quanto no painel web.")

    # ══════════════════════════════════════════════════════════════════════════
    # CAP 9 — FAQ
    # ══════════════════════════════════════════════════════════════════════════
    pdf.capitulo(9, "Perguntas Frequentes e Situações de Erro")

    perguntas = [
        (
            "Esqueci minha senha. O que faço?",
            "Na tela de login, clique em 'Esqueci minha senha'. Informe seu e-mail e "
            "você receberá um link para criar uma nova senha. Se não receber o e-mail, "
            "verifique a pasta de spam ou contate o Administrador do sistema."
        ),
        (
            "Não consigo alocar um colaborador em um ambiente. O sistema diz que está ocupado.",
            "Isso significa que outro colaborador já está alocado naquele ambiente com status "
            "'Em Andamento' (RN03). Para liberar o ambiente:\n"
            "1. Identifique o colaborador atual na tela de alocação.\n"
            "2. Abra a tarefa dele e clique em Concluir ou Pausar.\n"
            "3. Agora o ambiente estará disponível para nova alocação."
        ),
        (
            "Por que não consigo gerar o lote de pagamento? O sistema bloqueia.",
            "Isso ocorre quando há um ou mais preços com status PENDENTE na obra (RN02). "
            "Acesse Preços > Aprovações Pendentes e verifique se há preços aguardando decisão do Gestor. "
            "Somente após aprovação (ou rejeição) de todos os preços pendentes o lote poderá ser gerado.\n\n"
            "Alternativa: o Administrador pode forçar a geração com justificativa registrada em auditoria."
        ),
        (
            "Por que não vejo o campo 'Preço de Venda' nas tabelas de preço?",
            "Seu perfil é Encarregado, que possui restrição de acesso a dados financeiros (RN01). "
            "Isso é intencional e não pode ser alterado. Se precisar de acesso financeiro, "
            "contate o Administrador para avaliar a alteração do seu perfil."
        ),
        (
            "O app está mostrando 'Offline — X pendências'. Os dados foram perdidos?",
            "Não. Os dados registrados no app estão salvos localmente no celular. "
            "Eles serão enviados ao servidor automaticamente assim que houver conexão com a internet. "
            "Certifique-se de sincronizar o app antes de encerrar a O.S. para evitar acúmulo de pendências."
        ),
        (
            "Registrei uma medição errada. Como corrigir?",
            "Enquanto a O.S. não for encerrada e a medição não for validada pelo Gestor, "
            "o Encarregado pode editá-la acessando a O.S. > alocação > medição > editar.\n"
            "Após validação, somente o Gestor ou Administrador pode reverter uma medição, "
            "com registro obrigatório no log de auditoria."
        ),
        (
            "Como adicionar um novo colaborador ao sistema?",
            "Colaboradores são cadastrados no módulo Colaboradores pelo Encarregado, "
            "Financeiro ou Administrador. Informe: nome completo, CPF (único), e dados de contato.\n"
            "O colaborador não possui login no sistema — ele é uma entidade passiva, "
            "usada apenas para alocação e pagamento."
        ),
        (
            "O que é o log de auditoria e quem pode ver?",
            "O log de auditoria registra automaticamente todas as ações importantes: "
            "criação, edição, exclusão, aprovações, forçar medição e login/logout. "
            "Somente o Administrador tem acesso a esse log. "
            "Os registros são imutáveis — não podem ser editados nem excluídos."
        ),
    ]

    for pergunta, resposta in perguntas:
        pdf.ln(2)
        pdf.set_fill_color(*AZUL_CLARO)
        pdf.set_draw_color(*AZUL_MEDIO)
        pdf.set_font("Arial", "B", 9.5)
        pdf.set_text_color(*AZUL)
        pdf.cell(0, 7, f"  P:  {pergunta}", border="TLR", fill=True,
                 new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_fill_color(*CINZA_BG)
        pdf.set_font("Arial", "", 9)
        pdf.set_text_color(*CINZA_ESCURO)
        pdf.multi_cell(0, 5.5, "  R:  " + resposta, border="BLR", fill=True)
        pdf.set_draw_color(*CINZA_LINHA)
        pdf.ln(1)

    # ══════════════════════════════════════════════════════════════════════════
    # CONTRACAPA
    # ══════════════════════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.set_fill_color(*AZUL)
    pdf.rect(0, 0, 210, 297, "F")

    pdf.set_font("Arial", "B", 18)
    pdf.set_text_color(*BRANCO)
    pdf.set_xy(0, 80)
    pdf.cell(210, 10, "JB Pinturas ERP", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Arial", "", 12)
    pdf.set_xy(0, 96)
    pdf.cell(210, 8, "Manual do Usuário  —  Versão 1.0", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_fill_color(*AZUL_MEDIO)
    pdf.rect(40, 120, 130, 1, "F")

    pdf.set_font("Arial", "", 9)
    pdf.set_text_color(180, 200, 240)
    pdf.set_xy(0, 130)
    pdf.cell(210, 6, "Documento de uso interno — Não distribuir externamente", align="C")
    pdf.set_xy(0, 138)
    pdf.cell(210, 6, "Para suporte, contate o Administrador do sistema", align="C")
    pdf.set_xy(0, 146)
    pdf.cell(210, 6, "© 2026 JB Pinturas — Todos os direitos reservados", align="C")

    caminho = "c:/Users/kbca_/develop/jb_pinturas/JB_Pinturas_Manual_do_Usuario.pdf"
    pdf.output(caminho)
    print(f"Manual gerado: {caminho}")


if __name__ == "__main__":
    gerar_manual()
