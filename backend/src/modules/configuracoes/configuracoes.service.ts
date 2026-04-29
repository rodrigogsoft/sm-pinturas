import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Configuracao, TipoConfiguracaoEnum } from './entities/configuracao.entity';
import { UpdateConfiguracaoDto } from './dto/update-configuracao.dto';

/** Configurações padrão que são criadas automaticamente se não existirem */
const CONFIGURACOES_PADRAO: Omit<Configuracao, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    chave: 'max_alocacoes_simultaneas_colaborador',
    valor: '2',
    tipo: TipoConfiguracaoEnum.INTEGER,
    descricao:
      'Número máximo de alocações simultâneas permitidas por colaborador. Use 0 para ilimitado.',
    ativo: true,
  },
];

@Injectable()
export class ConfiguracoesService implements OnModuleInit {
  constructor(
    @InjectRepository(Configuracao)
    private readonly configRepo: Repository<Configuracao>,
  ) {}

  /** Garante que as configurações padrão existam no banco ao inicializar */
  async onModuleInit() {
    for (const padrao of CONFIGURACOES_PADRAO) {
      const existente = await this.configRepo.findOne({ where: { chave: padrao.chave } });
      if (!existente) {
        await this.configRepo.save(this.configRepo.create(padrao));
      }
    }
  }

  async findAll(): Promise<Configuracao[]> {
    return this.configRepo.find({ order: { chave: 'ASC' } });
  }

  async findByChave(chave: string): Promise<Configuracao | null> {
    return this.configRepo.findOne({ where: { chave } });
  }

  /**
   * Lê o valor inteiro de uma configuração.
   * Retorna o fallback se a configuração não existir ou estiver inativa.
   */
  async getIntValue(chave: string, fallback: number): Promise<number> {
    const config = await this.configRepo.findOne({ where: { chave, ativo: true } });
    if (!config) return fallback;
    const valor = parseInt(config.valor, 10);
    return isNaN(valor) ? fallback : valor;
  }

  async update(chave: string, dto: UpdateConfiguracaoDto): Promise<Configuracao> {
    const config = await this.configRepo.findOne({ where: { chave } });
    if (!config) {
      throw new NotFoundException(`Configuração '${chave}' não encontrada`);
    }
    Object.assign(config, dto);
    return this.configRepo.save(config);
  }
}
