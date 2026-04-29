import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditoriaService } from '../../modules/auditoria/auditoria.service';
import { AcaoAuditoriaEnum } from '../../modules/auditoria/entities/audit-log.entity';
import { AUDIT_KEY } from '../decorators/audit.decorator';

/**
 * Interceptor para auditoria automática de requisições
 * Registra automaticamente ações nos endpoints críticos
 * 
 * Pode usar decorador @Audit ou detecção automática
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditoriaService: AuditoriaService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (process.env.NODE_ENV === 'test') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { method, url, user, body, ip, headers, params } = request;

    // Verificar se o handler/controller tem decorador @Audit
    const auditMetadata = this.reflector.get(AUDIT_KEY, context.getHandler());

    // Se não há decorador, usar detecção automática
    let tabela: string | null = null;
    let acao: AcaoAuditoriaEnum | null = null;
    let descricao: string | null = null;

    if (auditMetadata) {
      // Usar decorador @Audit
      tabela = auditMetadata.tabela;
      acao = auditMetadata.acao;
      descricao = auditMetadata.descricao;
    } else {
      // Detecção automática (fallback)
      const tabelaMap: Record<string, string> = {
        '/usuarios': 'tb_usuarios',
        '/clientes': 'tb_clientes',
        '/colaboradores': 'tb_colaboradores',
        '/obras': 'tb_obras',
        '/precos': 'tb_tabela_precos',
        '/financeiro/lotes': 'tb_lotes_pagamento',
        '/medicoes': 'tb_medicoes',
        '/sessoes': 'tb_sessoes_diarias',
        '/alocacoes': 'tb_alocacoes_tarefa',
      };

      const acaoMap: Record<string, AcaoAuditoriaEnum> = {
        POST: AcaoAuditoriaEnum.INSERT,
        PUT: AcaoAuditoriaEnum.UPDATE,
        PATCH: AcaoAuditoriaEnum.UPDATE,
        DELETE: AcaoAuditoriaEnum.DELETE,
      };

      // Detectar ações especiais
      if (url.includes('/aprovar')) {
        acao = AcaoAuditoriaEnum.APPROVE;
      } else if (url.includes('/rejeitar')) {
        acao = AcaoAuditoriaEnum.REJECT;
      } else {
        acao = acaoMap[method] || null;
      }

      // Identificar tabela do endpoint
      for (const [path, tbl] of Object.entries(tabelaMap)) {
        if (url.includes(path)) {
          tabela = tbl;
          break;
        }
      }
    }

    // Só auditar ações relevantes
    const shouldAudit = acao && tabela && user?.id;

    // Capturar estado anterior (para UPDATE/DELETE)
    let payloadAntes: any = null;
    if ((acao === AcaoAuditoriaEnum.UPDATE || acao === AcaoAuditoriaEnum.DELETE) && params?.id) {
      // Será preenchido na resposta se disponível
      payloadAntes = null;
    }

    return next.handle().pipe(
      tap(async (response) => {
        if (!shouldAudit) return;

        try {
          // Capturar ID do registro
          const id_registro = 
            response?.id || 
            params?.id || 
            body?.id || 
            response?.data?.id || 
            null;

          await this.auditoriaService.create({
            id_usuario: user.id,
            tabela_afetada: tabela!,
            id_registro,
            acao: acao!,
            dados_antes: payloadAntes,
            dados_depois: 
              acao === AcaoAuditoriaEnum.INSERT || acao === AcaoAuditoriaEnum.UPDATE || acao === AcaoAuditoriaEnum.APPROVE
                ? response
                : null,
            ip_origem: ip || (headers['x-forwarded-for'] as string),
            user_agent: headers['user-agent'] as string,
            justificativa: descricao || undefined,
          });
        } catch (error) {
          // Não falhar a requisição se auditoria falhar
          console.error('Erro ao registrar auditoria:', error);
        }
      }),
    );
  }
}
