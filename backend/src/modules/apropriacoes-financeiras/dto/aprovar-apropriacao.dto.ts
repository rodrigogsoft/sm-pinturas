import { IsOptional, IsString } from 'class-validator';

export class AprovarApropriacaoDto {
  @IsString()
  @IsOptional()
  justificativa_rejeicao?: string;
}
