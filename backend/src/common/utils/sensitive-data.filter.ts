import { PerfilEnum } from '../enums';

/**
 * Utilitário para filtrar dados sensíveis baseado no perfil do usuário
 * Implementa RN01: Encarregado nunca vê preços de venda
 */
export class SensitiveDataFilter {
  /**
   * Remove dados sensíveis de preços conforme o perfil
   * Encarregado: Não vê preco_venda
   */
  static filterPrecoForPerfil(preco: any, perfil: PerfilEnum): any {
    if (!preco) return preco;

    const filtered = { ...preco };

    // RN01: Encarregado não vê preco_venda, margem_percentual e status_aprovacao
    if (perfil === PerfilEnum.ENCARREGADO) {
      delete filtered.preco_venda;
      delete filtered.margem_percentual;
      delete filtered.status_aprovacao;
      delete filtered.id_usuario_aprovador;
      delete filtered.data_aprovacao;
    }

    return filtered;
  }

  /**
   * Filtra array de preços
   */
  static filterPrecosForPerfil(precos: any[], perfil: PerfilEnum): any[] {
    return precos.map((preco) => this.filterPrecoForPerfil(preco, perfil));
  }

  /**
   * Remove dados bancários sensíveis (mascarar com ***)
   * Aplicável para ENCARREGADO ver apenas os últimos 4 dígitos
   */
  static filterDadosBancarios(colaborador: any, perfil: PerfilEnum): any {
    if (!colaborador || !colaborador.dados_bancarios_enc) return colaborador;

    const filtered = { ...colaborador };

    // Se não é FINANCEIRO ou GESTOR, mascarar dados bancários
    if (
      perfil !== PerfilEnum.FINANCEIRO &&
      perfil !== PerfilEnum.GESTOR &&
      perfil !== PerfilEnum.ADMIN
    ) {
      // Mascarar: mostrar apenas últimos 4 caracteres
      const original = filtered.dados_bancarios_enc;
      const last4 = original?.slice(-4) || '';
      filtered.dados_bancarios_enc = `***...${last4}`;
    }

    return filtered;
  }

  /**
   * Filtra array de colaboradores
   */
  static filterColaboradoresForPerfil(colaboradores: any[], perfil: PerfilEnum): any[] {
    return colaboradores.map((colab) => this.filterDadosBancarios(colab, perfil));
  }
}
