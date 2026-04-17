import { PartialType } from '@nestjs/mapped-types';
import { CreateServicoCatalogoDto } from './create-servico-catalogo.dto';

export class UpdateServicoCatalogoDto extends PartialType(CreateServicoCatalogoDto) {}
