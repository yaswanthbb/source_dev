import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * Validates that a string is a timezone the runtime's ICU data recognises,
 * e.g. `Asia/Kolkata`, `Europe/Berlin`, `UTC`.
 *
 * `Intl.DateTimeFormat` throws a RangeError on an unknown zone, which is a
 * broader compatibility bet than `Intl.supportedValuesOf` (Node 18+ only).
 * The client sends whatever `resolvedOptions().timeZone` gives it, so this
 * exists to reject anything hand-crafted rather than to second-guess browsers.
 */
export function IsIanaTimezone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isIanaTimezone',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string' || value.length === 0) return false;
          try {
            new Intl.DateTimeFormat('en-US', { timeZone: value });
            return true;
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid IANA timezone (e.g. Asia/Kolkata)`;
        },
      },
    });
  };
}
