import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PerfilEnum } from '../enums';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  private normalizePerfilId(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      return String(value);
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }

      // Aceita valor numérico em string (ex: "4")
      if (!Number.isNaN(Number(trimmed))) {
        return String(Number(trimmed));
      }

      // Aceita nome do enum (ex: "ENCARREGADO")
      const enumValue =
        (PerfilEnum as Record<string, unknown>)[trimmed.toUpperCase()];
      if (typeof enumValue === 'number') {
        return String(enumValue);
      }

      return null;
    }

    return null;
  }

  private normalizePerfilName(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      const enumName = (PerfilEnum as Record<number, unknown>)[value];
      return typeof enumName === 'string' ? enumName.toUpperCase() : null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }

      if (!Number.isNaN(Number(trimmed))) {
        const enumName = (PerfilEnum as Record<number, unknown>)[Number(trimmed)];
        return typeof enumName === 'string' ? enumName.toUpperCase() : null;
      }

      const upper = trimmed.toUpperCase();
      const enumValue = (PerfilEnum as Record<string, unknown>)[upper];
      if (typeof enumValue === 'number') {
        return upper;
      }

      return upper;
    }

    return null;
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<PerfilEnum[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false;
    }

    const requiredRoleIds = requiredRoles
      .map((role) => this.normalizePerfilId(role))
      .filter((role): role is string => role !== null);

    const requiredRoleNames = requiredRoles
      .map((role) => this.normalizePerfilName(role))
      .filter((role): role is string => role !== null);

    const userRoleIds = [user.perfil, user.id_perfil]
      .map((role) => this.normalizePerfilId(role))
      .filter((role): role is string => role !== null);

    const userRoleNames = [user.perfil_nome, user.perfil, user.id_perfil]
      .map((role) => this.normalizePerfilName(role))
      .filter((role): role is string => role !== null);

    const hasRoleIdMatch = userRoleIds.some((role) =>
      requiredRoleIds.includes(role),
    );
    if (hasRoleIdMatch) {
      return true;
    }

    return userRoleNames.some((role) => requiredRoleNames.includes(role));
  }
}
