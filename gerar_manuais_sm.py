# -*- coding: utf-8 -*-
"""
Gera dois manuais do usuário para o SM Pinturas ERP:
  - SM_Pinturas_Manual_Encarregado.pdf
  - SM_Pinturas_Manual_Gestor_Financeiro.pdf
"""
from fpdf import FPDF
from fpdf.enums import XPos, YPos

# ── Paleta ────────────────────────────────────────────────────────────────────
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
LARANJA_CLARO = (255, 235, 210)

FONT_DIR = "C:/Windows/Fonts/"


# ══════════════════════════════════════════════════════════════════════════════
# BASE PDF
# ══════════════════════════════════════════════════════════════════════════════
class ManualPDF(FPDF):
    _capitulo_atual = ""
    _cor_perfil     = AZUL          # cor tema do manual
    _subtitulo_doc  = ""

    def __init__(self, cor_perfil=None, subtitulo=""):
        super().__init__()
        self.add_font("Arial", "",   FONT_DIR + "arial.ttf")
        self.add_font("Arial", "B",  FONT_DIR + "arialbd.ttf")
        self.add_font("Arial", "I",  FONT_DIR + "ariali.ttf")
        self.add_font("Arial", "BI", FONT_DIR + "arialbi.ttf")
        if cor_perfil:
            self._cor_perfil = cor_perfil
        self._subtitulo_doc = subtitulo

    def header(self):
        if self.page_no() == 1:
            return
        self.set_fill_color(*self._cor_perfil)
        self.rect(0, 0, 210, 14, "F")
        self.set_font("Arial", "B", 8)
        self.set_text_color(*BRANCO)
        self.set_xy(10, 3)
        self.cell(95, 8, f"SM Pinturas ERP  —  {self._subtitulo_doc}", align="L")
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
        self.cell(0, 5,
                  f"Página {self.page_no()}  —  SM Pinturas ERP  —  {self._subtitulo_doc}  —  Abril/2026  —  Uso interno",
                  align="C")

    # ── helpers ───────────────────────────────────────────────────────────────

    def capitulo(self, numero, titulo):
        self._capitulo_atual = f"Cap. {numero}: {titulo}"
        self.add_page()
        self.set_fill_color(*self._cor_perfil)
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
        self.set_draw_color(*self._cor_perfil)
        self.set_font("Arial", "B", 11)
        self.set_text_color(*self._cor_perfil)
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
        cor = cor_bala or self._cor_perfil
        self.set_x(13)
        self.set_fill_color(*cor)
        self.set_font("Arial", "", 9.5)
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
            "info":   (AZUL_CLARO,     AZUL_MEDIO),
            "ok":     (VERDE_CLARO,    VERDE),
            "aviso":  (AMARELO_CLARO,  AMARELO),
            "perigo": (VERMELHO_CLARO, VERMELHO),
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
        self.set_fill_color(*self._cor_perfil)
        self.set_font("Arial", "B", 9)
        self.set_text_color(*BRANCO)
        self.set_x(12)
        self.cell(7, 7, str(numero), fill=True, align="C")
        self.set_fill_color(*AZUL_CLARO)
        self.set_text_color(*self._cor_perfil)
        self.cell(0, 7, f"  {titulo}", fill=True,
                  new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        if descricao:
            self.set_x(20)
            self.set_font("Arial", "", 9.5)
            self.set_text_color(*CINZA_ESCURO)
            self.multi_cell(0, 5.5, descricao)
        self.ln(2)

    def tabela(self, cabecalhos, larguras, linhas, col_bold=None):
        self.set_fill_color(*self._cor_perfil)
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
                est = "B" if col_bold is not None and i == col_bold else ""
                self.set_font("Arial", est, 8.5)
                self.cell(larguras[i], 6.5, str(cel), border=1, fill=True)
            self.ln()
        self.ln(2)

    def caixa_regra(self, codigo, titulo, texto, tipo="info"):
        cores = {
            "info":   (AZUL_CLARO,     AZUL_MEDIO),
            "aviso":  (AMARELO_CLARO,  AMARELO),
            "perigo": (VERMELHO_CLARO, VERMELHO),
            "ok":     (VERDE_CLARO,    VERDE),
        }
        bg, borda = cores[tipo]
        self.set_fill_color(*bg)
        self.set_draw_color(*borda)
        self.set_font("Arial", "B", 9)
        self.set_text_color(*borda)
        self.cell(0, 7, f"  {codigo}  —  {titulo}", border="TLR", fill=True,
                  new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_font("Arial", "", 9)
        self.set_text_color(*CINZA_ESCURO)
        self.multi_cell(0, 5.5, texto, border="BLR", fill=True)
        self.set_draw_color(*CINZA_LINHA)
        self.ln(3)

    def fluxo_seta(self, etapas):
        n = len(etapas)
        w_etapa = 160 / n
        x0 = 13
        y0 = self.get_y()
        for i, (label, sub) in enumerate(etapas):
            x = x0 + i * (w_etapa + 4)
            self.set_fill_color(*self._cor_perfil)
            self.set_draw_color(*self._cor_perfil)
            self.set_font("Arial", "B", 7.5)
            self.set_text_color(*BRANCO)
            self.set_xy(x, y0)
            self.cell(w_etapa, 8, label, border=1, fill=True, align="C")
            if sub:
                self.set_font("Arial", "", 7)
                self.set_text_color(*self._cor_perfil)
                self.set_xy(x, y0 + 8)
                self.cell(w_etapa, 5, sub, align="C")
            if i < n - 1:
                self.set_font("Arial", "B", 9)
                self.set_text_color(*self._cor_perfil)
                self.set_xy(x + w_etapa, y0 + 1)
                self.cell(4, 6, ">", align="C")
        self.set_text_color(*CINZA_ESCURO)
        self.ln(16)

    def faq_item(self, pergunta, resposta):
        self.ln(2)
        self.set_fill_color(*AZUL_CLARO)
        self.set_draw_color(*self._cor_perfil)
        self.set_font("Arial", "B", 9.5)
        self.set_text_color(*self._cor_perfil)
        self.cell(0, 7, f"  P:  {pergunta}", border="TLR", fill=True,
                  new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_fill_color(*CINZA_BG)
        self.set_font("Arial", "", 9)
        self.set_text_color(*CINZA_ESCURO)
        self.multi_cell(0, 5.5, "  R:  " + resposta, border="BLR", fill=True)
        self.set_draw_color(*CINZA_LINHA)
        self.ln(1)

    def capa(self, titulo_perfil, subtitulo, cor_destaque):
        # fundo superior
        self.set_fill_color(*self._cor_perfil)
        self.rect(0, 0, 210, 120, "F")
        # nome do sistema
        self.set_font("Arial", "B", 38)
        self.set_text_color(*BRANCO)
        self.set_xy(0, 28)
        self.cell(210, 16, "SM PINTURAS", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_font("Arial", "", 15)
        self.set_xy(0, 48)
        self.cell(210, 8, "ERP de Gestão de Obras", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        # bandeira do perfil
        self.set_fill_color(*cor_destaque)
        self.rect(25, 66, 160, 18, "F")
        self.set_font("Arial", "B", 14)
        self.set_xy(25, 69)
        self.cell(160, 12, titulo_perfil, align="C")
        self.set_font("Arial", "", 9)
        self.set_text_color(200, 220, 255)
        self.set_xy(0, 90)
        self.cell(210, 6, subtitulo, align="C")
        self.set_xy(0, 97)
        self.cell(210, 6, "Versão 1.0  —  Abril/2026", align="C")
        # fundo branco inferior
        self.set_fill_color(*BRANCO)
        self.rect(0, 120, 210, 177, "F")

    def contracapa(self):
        self.add_page()
        self.set_fill_color(*self._cor_perfil)
        self.rect(0, 0, 210, 297, "F")
        self.set_font("Arial", "B", 18)
        self.set_text_color(*BRANCO)
        self.set_xy(0, 110)
        self.cell(210, 10, "SM Pinturas ERP", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_font("Arial", "", 11)
        self.set_xy(0, 124)
        self.cell(210, 7, self._subtitulo_doc + "  —  Versão 1.0", align="C")
        self.set_fill_color(*AZUL_MEDIO)
        self.rect(40, 138, 130, 1, "F")
        self.set_font("Arial", "", 8.5)
        self.set_text_color(180, 200, 240)
        self.set_xy(0, 145)
        self.cell(210, 6, "Documento de uso interno — Não distribuir externamente", align="C")
        self.set_xy(0, 152)
        self.cell(210, 6, "Para suporte, contate o Administrador do sistema", align="C")
        self.set_xy(0, 159)
        self.cell(210, 6, "© 2026 SM Pinturas — Todos os direitos reservados", align="C")


# ══════════════════════════════════════════════════════════════════════════════
# MANUAL DO ENCARREGADO
# ══════════════════════════════════════════════════════════════════════════════
def gerar_manual_encarregado():
    pdf = ManualPDF(cor_perfil=AZUL, subtitulo="Manual do Encarregado")
    pdf.set_margins(12, 18, 12)
    pdf.set_auto_page_break(True, margin=16)

    # ── CAPA ─────────────────────────────────────────────────────────────────
    pdf.add_page()
    pdf.capa(
        "MANUAL DO ENCARREGADO",
        "Guia de operação de campo: obras, O.S., alocações e medições",
        AZUL_MEDIO,
    )
    capitulos = [
        ("1", "Acesso ao Sistema"),
        ("2", "O que o Encarregado pode fazer"),
        ("3", "Regras importantes que o sistema aplica automaticamente"),
        ("4", "Fluxo 1 — Estruturando uma obra"),
        ("5", "Fluxo 2 — Operando por Ordem de Serviço (O.S.)"),
        ("6", "Medições e Excedentes"),
        ("7", "Notificações"),
        ("8", "Perguntas Frequentes"),
    ]
    pdf.set_text_color(*CINZA_ESCURO)
    for i, (num, titulo) in enumerate(capitulos):
        y = 134 + i * 11
        pdf.set_fill_color(*AZUL)
        pdf.set_font("Arial", "B", 9)
        pdf.set_text_color(*BRANCO)
        pdf.set_xy(20, y)
        pdf.cell(8, 8, num, fill=True, align="C")
        pdf.set_font("Arial", "", 9.5)
        pdf.set_text_color(*CINZA_ESCURO)
        pdf.set_xy(30, y)
        pdf.cell(0, 8, titulo)

    # ── CAP 1 — ACESSO ───────────────────────────────────────────────────────
    pdf.capitulo(1, "Acesso ao Sistema")

    pdf.p(
        "O SM Pinturas ERP é usado pelo Encarregado principalmente pelo celular, "
        "através do aplicativo mobile. O painel web também está disponível para "
        "situações em que um computador for mais prático."
    )

    pdf.secao("Pelo celular (App Mobile)")
    pdf.passo(1, "Instale o aplicativo", "Baixe o app SM Pinturas disponibilizado pelo administrador.")
    pdf.passo(2, "Faça login", "Abra o app, informe seu e-mail e senha e toque em Entrar.")
    pdf.passo(3, "Funcionamento offline",
              "O app funciona mesmo sem internet. Todos os dados registrados ficam salvos "
              "no celular e são enviados automaticamente ao servidor quando a conexão retornar.")

    pdf.alerta(
        "Indicador de sincronização:\n"
        "• 'Sincronizado há X min' — dados enviados ao servidor com sucesso.\n"
        "• 'Offline — X pendências' — dados salvos no celular aguardando envio.\n\n"
        "Sempre verifique o indicador antes de encerrar uma O.S. para garantir que "
        "tudo foi sincronizado.",
        "aviso"
    )

    pdf.secao("Pelo computador (Painel Web)")
    pdf.item("Abra o navegador e acesse o endereço fornecido pelo administrador.")
    pdf.item("Informe e-mail e senha e clique em Entrar.")
    pdf.item("Na primeira vez, o sistema pode pedir um código de 6 dígitos do aplicativo autenticador (MFA).")

    # ── CAP 2 — PERFIL ───────────────────────────────────────────────────────
    pdf.capitulo(2, "O que o Encarregado pode fazer")

    pdf.p(
        "O perfil Encarregado é focado na operação de campo. "
        "Você tem acesso a tudo que é necessário para organizar e registrar o trabalho na obra."
    )

    pdf.secao("O que você PODE fazer")
    pdf.item("Criar e editar obras.", VERDE)
    pdf.item("Cadastrar pavimentos, ambientes e elementos de serviço dentro de cada obra.", VERDE)
    pdf.item("Criar Ordens de Serviço (O.S.) e alocar colaboradores.", VERDE)
    pdf.item("Definir o serviço e o preço de custo por elemento de serviço.", VERDE)
    pdf.item("Lançar medições de produção.", VERDE)
    pdf.item("Registrar excedentes com justificativa e foto.", VERDE)
    pdf.item("Encerrar a O.S. ao concluir o trabalho.", VERDE)

    pdf.ln(2)
    pdf.secao("O que você NÃO pode fazer")
    pdf.alerta(
        "IMPORTANTE — Cegueira Financeira (regra RN01):\n"
        "O Encarregado nunca visualiza preço de venda, margens de lucro ou dados "
        "financeiros sensíveis. Essa restrição é aplicada automaticamente pelo sistema "
        "e não pode ser desativada por nenhum usuário.",
        "perigo"
    )
    pdf.item("Ver ou editar preços de venda.", VERMELHO)
    pdf.item("Acessar o módulo financeiro (pagamentos, vales, relatórios de margem).", VERMELHO)
    pdf.item("Aprovar preços ou fechar lotes de pagamento.", VERMELHO)

    # ── CAP 3 — REGRAS ───────────────────────────────────────────────────────
    pdf.capitulo(3, "Regras que o sistema aplica automaticamente")

    pdf.p(
        "Algumas ações são bloqueadas ou exigem informações extras. "
        "Não é necessário memorizar essas regras — o sistema avisará quando necessário."
    )

    pdf.caixa_regra(
        "RN03", "Um colaborador por ambiente",
        "Cada ambiente só pode ter um colaborador ativo ao mesmo tempo.\n\n"
        "Se você tentar alocar um segundo colaborador em um ambiente já ocupado, "
        "o sistema exibe:\n\n"
        "    \"Ambiente em uso por [Nome]. Encerre a tarefa anterior primeiro.\"\n\n"
        "Para liberar o ambiente: acesse a alocação atual > clique em Concluir ou Pausar.",
        "aviso"
    )

    pdf.caixa_regra(
        "EXCEDENTE", "Medição acima da área cadastrada",
        "Se a quantidade medida ultrapassar a área cadastrada do ambiente, o sistema "
        "detecta automaticamente um excedente e exige:\n\n"
        "1. Justificativa textual explicando o motivo.\n"
        "2. Foto como evidência (obrigatória).\n\n"
        "Sem esses dois itens o registro não pode ser concluído.",
        "aviso"
    )

    pdf.caixa_regra(
        "STATUS ATIVA", "Obra precisa estar ATIVA para operar",
        "Só é possível criar O.S. e alocar colaboradores em obras com status ATIVA. "
        "Certifique-se de mudar o status da obra de PLANEJAMENTO para ATIVA após "
        "finalizar o cadastro da estrutura (pavimentos, ambientes, elementos).",
        "info"
    )

    # ── CAP 4 — FLUXO 1 ──────────────────────────────────────────────────────
    pdf.capitulo(4, "Fluxo 1 — Estruturando uma Obra")

    pdf.p(
        "Este fluxo é feito uma única vez por obra. "
        "Ele monta a estrutura que será usada em todas as Ordens de Serviço."
    )

    pdf.secao("Hierarquia de dados")
    niveis = [
        ("OBRA",                "Ex: Condomínio Tereza Aires"),
        ("PAVIMENTO",           "Ex: Térreo, 1º Andar, 2º Andar..."),
        ("AMBIENTE",            "Ex: Apartamento 101, Hall, Escada de Incêndio"),
        ("ELEMENTO DE SERVIÇO", "Ex: Parede, Piso, Teto, Sacada, Corrimão"),
    ]
    recuos = [12, 20, 28, 36]
    cores_nivel = [AZUL, AZUL_MEDIO, (80, 140, 210), VERDE]
    for i, (nivel, exemplo) in enumerate(niveis):
        pdf.set_x(recuos[i])
        pdf.set_fill_color(*cores_nivel[i])
        pdf.set_font("Arial", "B", 9)
        pdf.set_text_color(*BRANCO)
        largura = 186 - recuos[i]
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

    pdf.secao("Passo a Passo")

    pdf.fluxo_seta([
        ("1. Criar Obra",   "Dados gerais"),
        ("2. Pavimentos",   "Andares/seções"),
        ("3. Ambientes",    "Por pavimento"),
        ("4. Elementos",    "Por ambiente"),
    ])

    pdf.passo(1, "Criar a Obra",
              "Acesse Obras > Nova Obra e preencha:\n"
              "• Nome da obra\n"
              "• Endereço completo\n"
              "• Data de início e previsão de término\n"
              "• Cliente (deve estar cadastrado pelo setor Financeiro)\n\n"
              "Exemplo: 'Condomínio Tereza Aires'  |  'Rua das Flores, 100'")

    pdf.passo(2, "Cadastrar os Pavimentos",
              "Dentro da obra, acesse Pavimentos > Novo Pavimento.\n"
              "Cadastre um pavimento para cada andar ou seção.\n\n"
              "Exemplo — Condomínio Tereza Aires:\n"
              "Térreo  |  1º Andar  |  2º Andar  |  3º Andar  |  4º Andar")

    pdf.passo(3, "Cadastrar os Ambientes",
              "Dentro de cada pavimento, acesse Ambientes > Novo Ambiente.\n"
              "Informe o nome e a área em m².\n\n"
              "Exemplo — Térreo:\n"
              "Apt 101  |  Apt 102  |  Apt 103  |  Apt 104  |  Hall  |  Escada de Incêndio")

    pdf.passo(4, "Cadastrar os Elementos de Serviço",
              "Dentro de cada ambiente, adicione os Elementos de Serviço — "
              "as partes físicas que serão pintadas ou tratadas.\n\n"
              "Exemplos:\n"
              "Apartamento: Parede, Piso, Teto, Sacada\n"
              "Hall:         Parede, Quadro de Água, Quadro de Energia\n"
              "Escada:       Parede, Corrimão")

    pdf.passo(5, "Ativar a Obra",
              "Após finalizar toda a estrutura, altere o status da obra para ATIVA.\n"
              "Só obras ATIVAS permitem criar Ordens de Serviço.")

    pdf.alerta(
        "Dica: você pode cadastrar pavimentos e ambientes com a obra ainda em status "
        "PLANEJAMENTO. Só mude para ATIVA quando a estrutura estiver completa.",
        "info"
    )

    # exemplo visual
    pdf.secao("Exemplo completo — Condomínio Tereza Aires")
    pdf.set_fill_color(245, 248, 255)
    pdf.set_draw_color(*AZUL_CLARO)
    linhas = [
        ("Obra",              "Condomínio Tereza Aires"),
        ("Pavimentos (5)",    "Térreo, 1º Andar, 2º Andar, 3º Andar, 4º Andar"),
        ("Ambientes/andar",   "Apt 101, Apt 102, Apt 103, Apt 104, Hall, Escada de Incêndio"),
        ("Elementos — Apt",   "Parede, Piso, Teto, Sacada"),
        ("Elementos — Hall",  "Parede, Quadro de Água, Quadro de Energia"),
        ("Elementos — Escada","Parede, Corrimão"),
    ]
    for rotulo, valor in linhas:
        pdf.set_font("Arial", "B", 8.5)
        pdf.set_x(13)
        pdf.cell(45, 5.5, rotulo + ":", border="B", fill=True)
        pdf.set_font("Arial", "", 8.5)
        pdf.cell(0, 5.5, valor, border="B", fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_draw_color(*CINZA_LINHA)
    pdf.ln(3)

    # ── CAP 5 — FLUXO 2 ──────────────────────────────────────────────────────
    pdf.capitulo(5, "Fluxo 2 — Operando por Ordem de Serviço (O.S.)")

    pdf.p(
        "A Ordem de Serviço (O.S.) é o documento que registra o trabalho executado. "
        "Abra uma O.S. para cada conjunto de serviços, aloque os colaboradores "
        "nos elementos, registre as medições e encerre quando o trabalho estiver pronto."
    )

    pdf.fluxo_seta([
        ("1. Criar O.S.",    "Obra ativa"),
        ("2. Alocar",        "Colaborador + elemento"),
        ("3. Medições",      "Quantidade executada"),
        ("4. Encerrar O.S.", "Confirmar e fechar"),
    ])

    pdf.passo(1, "Criar a Ordem de Serviço",
              "Acesse O.S. > Nova O.S. dentro da obra desejada.\n"
              "Informe a data e uma observação se necessário.\n\n"
              "Exemplo: O.S. #001 — Pintura Térreo — Condomínio Tereza Aires")

    pdf.passo(2, "Alocar o Colaborador",
              "Dentro da O.S., clique em Adicionar Colaborador e preencha:\n"
              "• Colaborador: profissional que vai executar\n"
              "• Pavimento: onde será o trabalho\n"
              "• Ambiente: local específico dentro do pavimento\n"
              "• Elemento de Serviço: parte do ambiente (Parede, Piso...)\n"
              "• Serviço: tipo do catálogo (ex: Pintura em Esmalte)\n"
              "• Preço de Custo: valor por unidade pago ao colaborador (ex: R$ 10,00/m²)\n\n"
              "Exemplo real:\n"
              "Colaborador: João  |  Pavimento: Térreo  |  Ambiente: Apt 101\n"
              "Elemento: Parede  |  Serviço: Pintura em Esmalte  |  Custo: R$ 10,00/m²")

    pdf.alerta(
        "Se o ambiente já tiver um colaborador ativo, o sistema bloqueará a alocação "
        "e exibirá quem está no local. Encerre ou pause a tarefa atual antes de alocar outro.",
        "aviso"
    )

    pdf.passo(3, "Lançar as Medições",
              "À medida que o trabalho avança, registre a produção:\n"
              "• Selecione a alocação dentro da O.S.\n"
              "• Informe a quantidade executada (m², ml, un etc.)\n"
              "• Use os botões + e - para precisão\n\n"
              "Se a medição ultrapassar a área do elemento, o sistema pedirá "
              "justificativa e foto obrigatoriamente (veja Capítulo 6).")

    pdf.passo(4, "Encerrar a O.S.",
              "Quando o trabalho estiver concluído, acesse a O.S. > Encerrar.\n"
              "O sistema registra data/hora e consolida todas as medições.\n"
              "Após encerrar, a O.S. não pode mais ser editada sem autorização do Gestor.")

    # ── CAP 6 — MEDICOES ─────────────────────────────────────────────────────
    pdf.capitulo(6, "Medições e Excedentes")

    pdf.p(
        "A medição é o registro de quanto de cada serviço foi produzido. "
        "É ela que determina o pagamento do colaborador e alimenta os relatórios da empresa."
    )

    pdf.secao("Registrando uma medição normal")
    pdf.item("Abra a O.S. e selecione a alocação do colaborador.")
    pdf.item("Selecione o elemento de serviço e o serviço executado.")
    pdf.item("Informe a quantidade produzida usando os botões + e - ou digitando.")
    pdf.item("Toque em Salvar. A medição é registrada com data, hora e nome do colaborador.")

    pdf.secao("O que é um Excedente?")
    pdf.p(
        "Excedente é quando a quantidade medida ultrapassa a área cadastrada do elemento. "
        "Exemplo: o elemento Parede do Apt 101 tem 15 m² cadastrados, mas foram pintados 17 m²."
    )
    pdf.alerta(
        "Quando o sistema detecta um excedente, ele NÃO cancela o registro. "
        "Em vez disso, exige obrigatoriamente:\n\n"
        "1. Justificativa textual — explique o motivo do excedente.\n"
        "2. Foto como evidência — tire a foto diretamente pelo app.\n\n"
        "Sem os dois itens, o excedente não pode ser salvo.",
        "aviso"
    )

    pdf.subsecao("Como registrar um excedente")
    pdf.item("Informe a quantidade. O sistema detecta o excedente automaticamente.")
    pdf.item("A tela de Excedente é exibida — preencha a justificativa.")
    pdf.item("Toque em Tirar Foto e fotografe a evidência.")
    pdf.item("Toque em Confirmar. O registro é salvo com a foto e a justificativa.")

    pdf.alerta(
        "Dica: excedentes recorrentes no mesmo elemento indicam que a área cadastrada "
        "pode estar incorreta. Comunique ao Administrador para corrigir o cadastro.",
        "info"
    )

    # ── CAP 7 — NOTIFICACOES ─────────────────────────────────────────────────
    pdf.capitulo(7, "Notificações")

    pdf.p("O sistema envia notificações automáticas para alertar sobre situações importantes.")

    pdf.tabela(
        ["Notificação", "Quando dispara"],
        [100, 86],
        [
            ["Colaborador sem produção há 2 dias",
             "Colaborador alocado sem medição recente"],
            ["O.S. aberta sem encerramento no prazo",
             "O.S. ficou aberta além do esperado"],
            ["Sincronização pendente",
             "Dados offline há mais de X horas"],
        ],
    )

    pdf.subsecao("Gerenciar preferências")
    pdf.item("Acesse o menu > seu nome > Preferências de Notificação.")
    pdf.item("É possível ativar ou desativar cada tipo individualmente.")

    # ── CAP 8 — FAQ ──────────────────────────────────────────────────────────
    pdf.capitulo(8, "Perguntas Frequentes")

    pdf.faq_item(
        "Não consigo alocar um colaborador — o sistema diz que o ambiente está ocupado.",
        "Isso significa que outro colaborador já está ativo naquele ambiente (regra RN03). "
        "Para liberar:\n"
        "1. Identifique o colaborador atual na tela de alocação da O.S.\n"
        "2. Abra a tarefa dele e clique em Concluir ou Pausar.\n"
        "3. O ambiente estará disponível para nova alocação."
    )

    pdf.faq_item(
        "O app está mostrando 'Offline — X pendências'. Os dados foram perdidos?",
        "Não. Os dados estão salvos no celular e serão enviados automaticamente "
        "quando a conexão com a internet retornar. "
        "Verifique o indicador antes de encerrar a O.S. para confirmar o envio."
    )

    pdf.faq_item(
        "Registrei uma medição errada. Como corrigir?",
        "Enquanto a O.S. não estiver encerrada, você pode editar a medição: "
        "acesse a O.S. > alocação > medição > Editar.\n"
        "Após o encerramento da O.S., somente o Gestor ou Administrador pode corrigir, "
        "com registro obrigatório no log de auditoria."
    )

    pdf.faq_item(
        "Não consigo criar uma O.S. na obra. O que pode ser?",
        "Verifique se a obra está com status ATIVA. "
        "Obras em status PLANEJAMENTO, SUSPENSA ou CONCLUÍDA não permitem novas O.S. "
        "Altere o status da obra para ATIVA no cadastro da obra."
    )

    pdf.faq_item(
        "Não vejo o campo 'Preço de Venda'. É um erro?",
        "Não é um erro. O perfil Encarregado não tem acesso a preços de venda — "
        "essa é uma restrição de segurança do sistema (RN01) e não pode ser alterada. "
        "Se precisar de informações financeiras, contate o setor Financeiro ou o Gestor."
    )

    pdf.faq_item(
        "Como adicionar um novo colaborador?",
        "Acesse o menu Colaboradores > Novo Colaborador. "
        "Preencha: nome completo e CPF (único no sistema). "
        "O colaborador não possui login — ele é cadastrado apenas para alocação e pagamento."
    )

    pdf.contracapa()

    saida = "c:/Users/kbca_/develop/jb_pinturas/SM_Pinturas_Manual_Encarregado.pdf"
    pdf.output(saida)
    print(f"Gerado: {saida}")


# ══════════════════════════════════════════════════════════════════════════════
# MANUAL DO GESTOR / FINANCEIRO
# ══════════════════════════════════════════════════════════════════════════════
def gerar_manual_gestor_financeiro():
    pdf = ManualPDF(cor_perfil=VERDE, subtitulo="Manual do Gestor e Financeiro")
    pdf.set_margins(12, 18, 12)
    pdf.set_auto_page_break(True, margin=16)

    # ── CAPA ─────────────────────────────────────────────────────────────────
    pdf.add_page()
    pdf.capa(
        "MANUAL DO GESTOR E FINANCEIRO",
        "Precificação, aprovações, pagamentos, relatórios e dashboard",
        VERDE,
    )
    capitulos = [
        ("1", "Acesso ao Sistema"),
        ("2", "Perfis: Gestor e Financeiro"),
        ("3", "Regras de Negócio — o que o sistema garante"),
        ("4", "Precificação — Custo e Venda"),
        ("5", "Workflow de Aprovação de Preço"),
        ("6", "Pagamentos e Vales de Adiantamento"),
        ("7", "Relatórios e Dashboard"),
        ("8", "Notificações"),
        ("9", "Perguntas Frequentes"),
    ]
    pdf.set_text_color(*CINZA_ESCURO)
    for i, (num, titulo) in enumerate(capitulos):
        y = 134 + i * 11
        pdf.set_fill_color(*VERDE)
        pdf.set_font("Arial", "B", 9)
        pdf.set_text_color(*BRANCO)
        pdf.set_xy(20, y)
        pdf.cell(8, 8, num, fill=True, align="C")
        pdf.set_font("Arial", "", 9.5)
        pdf.set_text_color(*CINZA_ESCURO)
        pdf.set_xy(30, y)
        pdf.cell(0, 8, titulo)

    # ── CAP 1 — ACESSO ───────────────────────────────────────────────────────
    pdf.capitulo(1, "Acesso ao Sistema")

    pdf.p(
        "O SM Pinturas ERP é acessado pelo Gestor e Financeiro principalmente pelo "
        "painel web em um computador. O app mobile também está disponível para "
        "consultas rápidas em campo."
    )

    pdf.secao("Pelo computador (Painel Web)")
    pdf.passo(1, "Acesse o sistema",
              "Abra o navegador e acesse o endereço fornecido pelo administrador.")
    pdf.passo(2, "Faça login",
              "Informe seu e-mail e senha e clique em Entrar.\n"
              "Na primeira vez ou quando solicitado, confirme o código MFA de 6 dígitos "
              "gerado pelo aplicativo autenticador (Google Authenticator ou similar).")
    pdf.passo(3, "Navegação",
              "O menu lateral esquerdo dá acesso a todos os módulos do sistema. "
              "Você verá apenas as opções permitidas para o seu perfil.")

    pdf.alerta(
        "Segurança: nunca compartilhe sua senha ou código MFA com outras pessoas. "
        "Todas as ações realizadas com suas credenciais são registradas no log de auditoria "
        "com seu nome, data e hora.",
        "aviso"
    )

    # ── CAP 2 — PERFIS ───────────────────────────────────────────────────────
    pdf.capitulo(2, "Perfis: Gestor e Financeiro")

    pdf.p(
        "O sistema possui dois perfis com acesso a dados financeiros: Gestor e Financeiro. "
        "Cada um tem responsabilidades distintas e complementares."
    )

    pdf.secao("GESTOR")
    pdf.p("Responsável pelas decisões estratégicas e aprovações.")
    pdf.item("Aprovar ou rejeitar preços de venda cadastrados pelo Financeiro.", VERDE)
    pdf.item("Visualizar a margem de lucro calculada automaticamente (Venda - Custo).", VERDE)
    pdf.item("Validar medições técnicas antes do fechamento.", VERDE)
    pdf.item("Acessar todos os relatórios: produtividade, margem, apropriações.", VERDE)
    pdf.item("Ver dados bancários de clientes sem máscara.", VERDE)
    pdf.item("Reverter medições encerradas (com registro em auditoria).", VERDE)

    pdf.ln(2)
    pdf.secao("FINANCEIRO")
    pdf.p("Responsável pela operação financeira do dia a dia.")
    pdf.item("Cadastrar e editar clientes (CNPJ, dados bancários).", VERDE)
    pdf.item("Inserir preços de venda — ficam pendentes até aprovação do Gestor.", VERDE)
    pdf.item("Editar preços de custo.", VERDE)
    pdf.item("Gerar lotes de pagamento e processar pagamentos.", VERDE)
    pdf.item("Registrar e gerenciar vales de adiantamento.", VERDE)
    pdf.item("Acessar relatórios financeiros.", VERDE)

    pdf.tabela(
        ["Ação", "Gestor", "Financeiro"],
        [120, 30, 36],
        [
            ["Aprovar preço de venda",            "Sim", "Não"],
            ["Cadastrar preço de venda",           "Não", "Sim"],
            ["Ver margem de lucro",                "Sim", "Não"],
            ["Gerar lote de pagamento",            "Não", "Sim"],
            ["Ver dados bancários sem máscara",    "Sim", "Sim"],
            ["Validar medições",                   "Sim", "Não"],
            ["Reverter medição encerrada",         "Sim", "Não"],
            ["Cadastrar clientes",                 "Não", "Sim"],
            ["Acessar log de auditoria",           "Não", "Não (só Admin)"],
        ],
    )

    # ── CAP 3 — REGRAS ───────────────────────────────────────────────────────
    pdf.capitulo(3, "Regras de Negócio")

    pdf.caixa_regra(
        "RN01", "Cegueira Financeira do Encarregado",
        "O perfil Encarregado nunca visualiza preços de venda, margens ou dados financeiros. "
        "Essa restrição protege informações estratégicas e é aplicada automaticamente — "
        "nenhum usuário pode desativá-la.",
        "info"
    )

    pdf.caixa_regra(
        "RN02", "Bloqueio de Medição com Preço Pendente",
        "Enquanto um serviço tiver preço de venda com status PENDENTE, o sistema bloqueia "
        "a geração de medições para a obra afetada.\n\n"
        "Objetivo: garantir que nenhuma medição seja fechada com valor de venda indefinido, "
        "evitando prejuízo ou distorção no relatório de margem.\n\n"
        "Exceção: o Administrador pode forçar a geração com justificativa obrigatória "
        "registrada no log de auditoria.",
        "aviso"
    )

    pdf.caixa_regra(
        "RN03", "Um Colaborador por Ambiente",
        "Cada ambiente só pode ter um colaborador ativo ao mesmo tempo. "
        "Garantido por restrição no banco de dados — não é possível contornar pelo sistema.",
        "info"
    )

    pdf.caixa_regra(
        "RN04", "Proteção de Dados Sensíveis",
        "• Dados bancários: exibidos mascarados na interface para perfis sem permissão.\n"
        "• Criptografia AES-256 para dados sensíveis armazenados no banco.\n"
        "• Comunicação obrigatoriamente criptografada via TLS 1.2+.\n\n"
        "Conformidade com LGPD e política interna de segurança da informação.",
        "info"
    )

    pdf.caixa_regra(
        "AUDIT", "Auditoria Imutável",
        "Todas as ações importantes são registradas em log imutável: aprovações, rejeições, "
        "medições forçadas, alterações de preço, reversões. O log mostra quem fez, o que fez "
        "e quando. Apenas o Administrador tem acesso ao log completo.",
        "ok"
    )

    # ── CAP 4 — PRECIFICACAO ──────────────────────────────────────────────────
    pdf.capitulo(4, "Precificação — Custo e Venda")

    pdf.p(
        "O sistema mantém dois preços para cada serviço do catálogo. "
        "Eles são independentes e atendem a finalidades distintas."
    )

    pdf.tabela(
        ["Tipo", "O que representa", "Quem vê", "Quem edita"],
        [28, 65, 52, 41],
        [
            ["Preço de\nCusto",
             "Valor pago ao colaborador pelo serviço executado",
             "Encarregado, Financeiro, Gestor, Admin",
             "Encarregado, Financeiro"],
            ["Preço de\nVenda",
             "Valor cobrado do cliente pelo serviço",
             "Financeiro, Gestor, Admin APENAS",
             "Financeiro (requer aprovação do Gestor)"],
        ],
    )

    pdf.secao("Margem de Lucro")
    pdf.p(
        "A margem é calculada automaticamente pelo sistema:\n\n"
        "    Margem (R$) = Preço de Venda - Preço de Custo\n"
        "    Margem (%) = (Margem R$ / Preço de Venda) x 100\n\n"
        "O Gestor vê essa margem ao analisar um preço de venda pendente, "
        "o que permite tomar a decisão de aprovação com base na política de margem mínima da empresa."
    )

    pdf.alerta(
        "Atenção: uma margem negativa significa que o preço de venda está abaixo do custo — "
        "a empresa estaria pagando para executar o serviço. Rejeite e solicite revisão ao Financeiro.",
        "perigo"
    )

    pdf.secao("Cadastrando o Preço de Venda (Financeiro)")
    pdf.passo(1, "Acesse a tabela de preços",
              "Vá em Preços > Tabela de Preços. Localize o serviço desejado.")
    pdf.passo(2, "Edite o preço de venda",
              "Clique em Editar > campo Preço de Venda > informe o valor > Salvar.\n"
              "O preço fica automaticamente com status PENDENTE até o Gestor aprovar.")
    pdf.passo(3, "Aguarde a aprovação",
              "O Gestor recebe uma notificação. Você será notificado quando ele aprovar ou rejeitar.")

    # ── CAP 5 — WORKFLOW ──────────────────────────────────────────────────────
    pdf.capitulo(5, "Workflow de Aprovação de Preço")

    pdf.fluxo_seta([
        ("Financeiro cadastra", "Status: PENDENTE"),
        ("Gestor analisa",      "Margem calculada"),
        ("Aprovado/Rejeitado",  "Decisão do Gestor"),
        ("Medições liberadas",  "Se aprovado"),
    ])

    pdf.secao("Passo a Passo — Gestor aprovando um preço")

    pdf.passo(1, "Acesse as aprovações pendentes",
              "Vá em Preços > Aprovações Pendentes.\n"
              "A lista mostra todos os serviços com preço de venda aguardando decisão.")

    pdf.passo(2, "Analise a margem",
              "Para cada item, o sistema exibe:\n"
              "• Preço de Custo atual\n"
              "• Preço de Venda proposto pelo Financeiro\n"
              "• Margem calculada em R$ e em %\n\n"
              "Avalie se a margem atende à política mínima da empresa.")

    pdf.passo(3, "Aprovar ou Rejeitar",
              "• Aprovar: o preço passa a valer imediatamente.\n"
              "  As medições bloqueadas por esse preço são desbloqueadas automaticamente.\n\n"
              "• Rejeitar: informe o motivo (campo obrigatório).\n"
              "  O Financeiro recebe notificação com o motivo e pode cadastrar um novo valor.")

    pdf.alerta(
        "Enquanto houver qualquer preço com status PENDENTE, o sistema bloqueia a geração "
        "de medições para a obra afetada (RN02). Aprove ou rejeite os preços pendentes "
        "o mais rápido possível para não travar a operação.",
        "aviso"
    )

    # ── CAP 6 — PAGAMENTOS ────────────────────────────────────────────────────
    pdf.capitulo(6, "Pagamentos e Vales de Adiantamento")

    pdf.secao("Gerando um Lote de Pagamento")
    pdf.p(
        "O lote de pagamento agrupa todas as medições aprovadas de um período "
        "para gerar a folha de pagamento dos colaboradores."
    )

    pdf.passo(1, "Acesse Financeiro > Lotes de Pagamento > Novo Lote",
              "Selecione o período (quinzena ou mês) e a obra.")
    pdf.passo(2, "Revise o lote",
              "O sistema exibe: colaborador, serviço, elemento, quantidade, preço de custo e total.\n"
              "Verifique se há valores inconsistentes antes de confirmar.")
    pdf.passo(3, "Confirmar e processar",
              "Clique em Processar Pagamento. O lote é fechado.\n"
              "Gere o comprovante em PDF para cada colaborador.")

    pdf.alerta(
        "Verifique se há preços PENDENTES antes de gerar o lote. "
        "O sistema bloqueia a geração enquanto houver preços não aprovados (RN02).",
        "aviso"
    )

    pdf.secao("Vales de Adiantamento")

    pdf.subsecao("Registrar um vale")
    pdf.item("Acesse Financeiro > Vales de Adiantamento > Novo Vale.")
    pdf.item("Informe o colaborador, o valor total e o número de parcelas (se parcelado).")
    pdf.item("Salve. O vale fica registrado como pendente de desconto.")

    pdf.subsecao("Desconto automático no pagamento")
    pdf.item("Na geração do próximo lote de pagamento, os vales em aberto aparecem como desconto.")
    pdf.item("O sistema abate automaticamente a parcela do vale do valor a receber.")
    pdf.item("Na tela do vale, você acompanha quais parcelas foram descontadas e quais estão em aberto.")

    # ── CAP 7 — RELATORIOS ────────────────────────────────────────────────────
    pdf.capitulo(7, "Relatórios e Dashboard")

    pdf.secao("Dashboard Principal")
    pdf.p("Disponível para Gestor e Financeiro. Exibe em tempo real:")
    pdf.item("Total de obras ativas e status de cada uma.")
    pdf.item("Receita prevista vs. custo acumulado.")
    pdf.item("Margem de lucro por obra (gráfico de barras).")
    pdf.item("Medições do período atual e comparativo com o anterior.")
    pdf.item("Alertas de faturamento próximos.")

    pdf.secao("Relatórios disponíveis")
    pdf.tabela(
        ["Relatório", "O que mostra", "Gestor", "Financeiro"],
        [52, 88, 20, 26],
        [
            ["Margem de Lucro",      "Custo vs. Venda por serviço e por obra",         "Sim", "Não"],
            ["Produtividade",        "Quantidade produzida por colaborador e período",  "Sim", "Sim"],
            ["Medições Detalhadas",  "Todas as medições por ambiente e colaborador",    "Sim", "Sim"],
            ["Contas a Pagar",       "Pagamentos pendentes aos colaboradores",          "Não", "Sim"],
            ["Contas a Receber",     "Faturamento pendente dos clientes",               "Sim", "Sim"],
            ["Apropriação de Custos","Custo detalhado por serviço na obra",             "Sim", "Sim"],
            ["Folha Individual",     "Resumo de pagamento de um colaborador",           "Não", "Sim"],
        ],
    )

    pdf.alerta(
        "Para exportar: clique no botão PDF ou Excel no canto superior direito de qualquer relatório. "
        "O arquivo é baixado automaticamente.",
        "info"
    )

    # ── CAP 8 — NOTIFICACOES ─────────────────────────────────────────────────
    pdf.capitulo(8, "Notificações")

    pdf.tabela(
        ["Notificação", "Perfil que recebe", "Quando dispara"],
        [70, 42, 74],
        [
            ["Preço de venda aguardando aprovação",  "GESTOR",              "Financeiro cadastra novo preço de venda"],
            ["Preço aprovado ou rejeitado",          "FINANCEIRO",          "Gestor toma decisão sobre o preço"],
            ["Medição pendente de validação",        "GESTOR",              "Encarregado registra medição"],
            ["Alerta de faturamento próximo",        "FINANCEIRO, GESTOR",  "Data de corte do cliente se aproxima"],
        ],
    )

    pdf.subsecao("Gerenciar preferências")
    pdf.item("Acesse o menu > seu nome > Preferências de Notificação.")
    pdf.item("É possível ativar ou desativar cada tipo individualmente.")

    # ── CAP 9 — FAQ ──────────────────────────────────────────────────────────
    pdf.capitulo(9, "Perguntas Frequentes")

    pdf.faq_item(
        "Por que não consigo gerar o lote de pagamento?",
        "Há um ou mais preços com status PENDENTE na obra (RN02). "
        "Acesse Preços > Aprovações Pendentes, analise e aprove ou rejeite todos os preços pendentes. "
        "O lote será desbloqueado automaticamente após a regularização.\n\n"
        "Alternativa: o Administrador pode forçar a geração com justificativa registrada em auditoria."
    )

    pdf.faq_item(
        "Como ver a margem de lucro de uma obra?",
        "Acesse Relatórios > Margem de Lucro. Selecione a obra e o período desejado. "
        "O relatório exibe custo total, receita total e margem em R$ e em %. "
        "Esse relatório é visível apenas para o perfil Gestor e Admin."
    )

    pdf.faq_item(
        "Um colaborador recebeu um vale e quer parcelar. Como configurar?",
        "Acesse Financeiro > Vales de Adiantamento > Novo Vale. "
        "Informe o valor total e o número de parcelas desejado. "
        "O sistema divide automaticamente e desconta uma parcela por período de pagamento."
    )

    pdf.faq_item(
        "O Encarregado diz que não consegue criar uma O.S. O que pode ser?",
        "Verifique o status da obra. Acesse Obras > selecione a obra > veja o campo Status. "
        "Se estiver em PLANEJAMENTO, altere para ATIVA. "
        "Somente obras ATIVAS permitem a criação de Ordens de Serviço."
    )

    pdf.faq_item(
        "Como reverter uma medição já encerrada pelo Encarregado?",
        "Somente o Gestor ou o Administrador podem reverter medições encerradas. "
        "Acesse a O.S. correspondente > selecione a medição > clique em Reverter. "
        "O sistema exige uma justificativa e registra a ação no log de auditoria "
        "com nome, data e hora."
    )

    pdf.faq_item(
        "Como cadastrar um novo cliente?",
        "Acesse Clientes > Novo Cliente (disponível apenas para o perfil Financeiro). "
        "Preencha: razão social, CNPJ (único), dados de contato, dados bancários e data de corte. "
        "Os dados bancários são armazenados com criptografia e exibidos mascarados na interface."
    )

    pdf.faq_item(
        "Posso ver o que o Encarregado faz no sistema?",
        "Sim. O Gestor tem acesso ao relatório de Medições Detalhadas, que mostra todas as "
        "medições lançadas por cada colaborador, com data, hora, obra, ambiente e elemento. "
        "Para o histórico completo de ações (login, exclusões, aprovações), "
        "solicite ao Administrador acesso ao log de auditoria."
    )

    pdf.contracapa()

    saida = "c:/Users/kbca_/develop/jb_pinturas/SM_Pinturas_Manual_Gestor_Financeiro.pdf"
    pdf.output(saida)
    print(f"Gerado: {saida}")


# ══════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    gerar_manual_encarregado()
    gerar_manual_gestor_financeiro()
    print("Concluido.")
