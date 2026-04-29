import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Colaborador } from './entities/colaborador.entity';
import { CreateColaboradorDto } from './dto/create-colaborador.dto';
import { UpdateColaboradorDto } from './dto/update-colaborador.dto';
import { CryptoService } from '../../common/crypto/crypto.service';

@Injectable()
export class ColaboradoresService {
  constructor(
    @InjectRepository(Colaborador)
    private colaboradorRepository: Repository<Colaborador>,
    private cryptoService: CryptoService,
  ) {}

  async create(
    createColaboradorDto: CreateColaboradorDto,
  ): Promise<Colaborador> {
    // Verificar se CPF já existe
    const existing = await this.colaboradorRepository.findOne({
      where: { cpf_nif: createColaboradorDto.cpf_nif, deletado: false },
    });

    if (existing) {
      throw new ConflictException('CPF/NIF já cadastrado');
    }

    const colaborador = this.colaboradorRepository.create(createColaboradorDto);

    // RN04: Criptografar dados bancários
    if (colaborador.dados_bancarios) {
      colaborador.dados_bancarios_enc = this.cryptoService.encrypt(
        JSON.stringify(colaborador.dados_bancarios),
      );
      // Limpar campo plano para não armazenar em plaintext
      colaborador.dados_bancarios = null;
    }

    const savedColaborador = await this.colaboradorRepository.save(colaborador);

    // Descriptografar para retorno
    return this.decryptColaborador(savedColaborador) as Colaborador;
  }

  async findAll(apenasAtivos: boolean = false): Promise<Colaborador[]> {
    const where: any = { deletado: false };
    if (apenasAtivos) {
      where.ativo = true;
    }

    const colaboradores = await this.colaboradorRepository.find({
      where,
      order: { nome_completo: 'ASC' },
    });

    // RN04: Descriptografar dados bancários
    return colaboradores.map((col) => this.decryptColaborador(col)).filter(Boolean) as Colaborador[];
  }

  async findOne(id: string): Promise<Colaborador> {
    const colaborador = await this.colaboradorRepository.findOne({
      where: { id, deletado: false },
    });

    if (!colaborador) {
      throw new NotFoundException(
        `Colaborador com ID ${id} não encontrado`,
      );
    }

    // RN04: Descriptografar dados bancários
    return this.decryptColaborador(colaborador) as Colaborador;
  }

  async update(
    id: string,
    updateColaboradorDto: UpdateColaboradorDto,
  ): Promise<Colaborador> {
    const colaborador = await this.colaboradorRepository.findOne({
      where: { id, deletado: false },
    });

    if (!colaborador) {
      throw new NotFoundException(`Colaborador com ID ${id} não encontrado`);
    }

    // Se alterando CPF, verificar duplicação
    if (
      updateColaboradorDto.cpf_nif &&
      updateColaboradorDto.cpf_nif !== colaborador.cpf_nif
    ) {
      const existing = await this.colaboradorRepository.findOne({
        where: { cpf_nif: updateColaboradorDto.cpf_nif, deletado: false },
      });

      if (existing) {
        throw new ConflictException('CPF/NIF já cadastrado');
      }
    }

    Object.assign(colaborador, updateColaboradorDto);

    // RN04: Encriptar dados bancários se fornecidos
    if (updateColaboradorDto.dados_bancarios) {
      colaborador.dados_bancarios_enc = this.cryptoService.encrypt(
        JSON.stringify(updateColaboradorDto.dados_bancarios),
      );
      // Limpar campo plano
      colaborador.dados_bancarios = null;
    }

    const savedColaborador = await this.colaboradorRepository.save(colaborador);

    // Descriptografar para retorno
    return this.decryptColaborador(savedColaborador) as Colaborador;
  }

  async remove(id: string): Promise<void> {
    const colaborador = await this.colaboradorRepository.findOne({
      where: { id, deletado: false },
    });

    if (!colaborador) {
      throw new NotFoundException(`Colaborador com ID ${id} não encontrado`);
    }

    colaborador.deletado = true;
    await this.colaboradorRepository.save(colaborador);
  }

  /**
   * Descriptografa dados bancários de um colaborador
   * RN04: Dados bancários são armazenados criptografados no banco
   */
  private decryptColaborador(colaborador: Colaborador | null): Colaborador | null {
    if (!colaborador) {
      return null;
    }

    const result: Colaborador = { ...colaborador };

    // Se houver dados criptografados, descriptografar
    if (result.dados_bancarios_enc) {
      try {
        const decrypted = this.cryptoService.decrypt(result.dados_bancarios_enc);
        result.dados_bancarios = JSON.parse(decrypted);
      } catch (error) {
        console.error(`Erro ao descriptografar dados bancários do colaborador ${result.id}:`, error);
        // Não falhar, apenas deixar vazio
        result.dados_bancarios = null;
      }
    }

    return result;
  }
}
