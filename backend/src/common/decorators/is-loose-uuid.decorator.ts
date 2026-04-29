import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

/**
 * UUID permissivo: aceita qualquer string no formato 8-4-4-4-12 hex,
 * sem exigir nibble de versão/variante RFC 4122.
 * Necessário porque os dados seed usam UUIDs no padrão simplificado
 * (ex: 30000000-0000-0000-0000-000000000001) que o validator.js 13.x
 * rejeita no @IsUUID('all').
 */
const LOOSE_UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function IsLooseUuid(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isLooseUuid',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && LOOSE_UUID_REGEX.test(value);
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a UUID`;
        },
      },
    });
  };
}
