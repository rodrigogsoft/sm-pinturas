import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { ServicoCatalogo } from './entities/servico-catalogo.entity';
import { CreateServicoDto } from './dto/create-servico.dto';
import { UpdateServicoDto } from './dto/update-servico.dto';
import { CategoriaServicoEnum } from '../../common/enums';
import { TabelaPreco } from '../precos/entities/tabela-preco.entity';
import { Medicao } from '../medicoes/entities/medicao.entity';

@Injectable()
export class ServicosService {
  constructor(
    @InjectRepository(ServicoCatalogo)
    private servicoRepository: Repository<ServicoCatalogo>,
    @InjectRepository(TabelaPreco)
    private precoRepository: Repository<TabelaPreco>,
    @InjectRepository(Medicao)
    private medicaoRepository: Repository<Medicao>,
  ) {}

  async create(createServicoDto: CreateServicoDto): Promise<ServicoCatalogo> {
    const servico = this.servicoRepository.create(createServicoDto);
    return this.servicoRepository.save(servico);
  }

  async findAll(
    categoria?: CategoriaServicoEnum,
    unidade?: string,
    search?: string,
    orderBy?: 'nome' | 'categoria' | 'mais_usado',
  ): Promise<ServicoCatalogo[]> {
    const queryBuilder = this.servicoRepository
      .createQueryBuilder('servico')
      .where('servico.deletado = :deletado', { deletado: false });

    // Filtro por categoria
    if (categoria) {
      queryBuilder.andWhere('servico.categoria = :categoria', { categoria });
    }

    // Filtro por unidade
    if (unidade) {
      queryBuilder.andWhere('servico.unidade_medida = :unidade', { unidade });
    }

    // Busca por nome ou descrição
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(servico.nome) LIKE LOWER(:search) OR LOWER(servico.descricao) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    // Ordenação
    if (orderBy === 'mais_usado') {
      // Subconsulta para contar uso
      queryBuilder
        .leftJoin(
          (qb) =>
            qb
              .select('alocacao.id_servico_catalogo', 'id_servico')
              .addSelect('COUNT(*)', 'uso_count')
              .from('tb_alocacoes', 'alocacao')
              .groupBy('alocacao.id_servico_catalogo'),
          'uso',
          'uso.id_servico = servico.id',
        )
        .orderBy('COALESCE(uso.uso_count, 0)', 'DESC')
        .addOrderBy('servico.nome', 'ASC');
    } else if (orderBy === 'categoria') {
      queryBuilder.orderBy('servico.categoria', 'ASC').addOrderBy('servico.nome', 'ASC');
    } else {
      queryBuilder.orderBy('servico.nome', 'ASC');
    }

    return queryBuilder.getMany();
  }

  async findOne(id: number): Promise<ServicoCatalogo> {
    const servico = await this.servicoRepository.findOne({
      where: { id, deletado: false },
    });

    if (!servico) {
      throw new NotFoundException(`Serviço com ID ${id} não encontrado`);
    }

    return servico;
  }

  async getEstatisticas(id: number): Promise<{
    servico: ServicoCatalogo;
    total_obras: number;
    total_medicoes: number;
    ultima_utilizacao: Date | null;
    obras_ativas: string[];
  }> {
    const servico = await this.findOne(id);

    // Buscar preços (obras que usam o serviço)
    const precos = await this.precoRepository.find({
      where: { id_servico_catalogo: id },
      relations: ['obra'],
    });

    const obrasAtivas = precos
      .filter((p) => p.obra.status === 'ATIVA')
      .map((p) => p.obra.nome);

    // Buscar medições
    const medicoes = await this.medicaoRepository
      .createQueryBuilder('medicao')
      .leftJoin('medicao.alocacao', 'alocacao')
      .where('alocacao.id_servico_catalogo = :idServico', { idServico: id })
      .orderBy('medicao.created_at', 'DESC')
      .getMany();

    return {
      servico,
      total_obras: precos.length,
      total_medicoes: medicoes.length,
      ultima_utilizacao: medicoes.length > 0 ? medicoes[0].created_at : null,
      obras_ativas: obrasAtivas,
    };
  }

  async update(
    id: number,
    updateServicoDto: UpdateServicoDto,
  ): Promise<ServicoCatalogo> {
    const servico = await this.findOne(id);
    Object.assign(servico, updateServicoDto);
    return this.servicoRepository.save(servico);
  }

  async remove(id: number): Promise<void> {
    const servico = await this.findOne(id);
    servico.deletado = true;
    await this.servicoRepository.save(servico);
  }
}
