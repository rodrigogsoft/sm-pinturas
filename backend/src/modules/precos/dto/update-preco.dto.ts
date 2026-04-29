import { PartialType } from '@nestjs/swagger';
import { CreatePrecoDto } from './create-preco.dto';

export class UpdatePrecoDto extends PartialType(CreatePrecoDto) {}
