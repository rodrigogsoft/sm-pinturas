import { SetMetadata } from '@nestjs/common';
import { PerfilEnum } from '../enums';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: PerfilEnum[]) => SetMetadata(ROLES_KEY, roles);
