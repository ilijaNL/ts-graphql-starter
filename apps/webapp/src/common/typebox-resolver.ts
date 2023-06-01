import { Static, TObject, FormatRegistry } from '@sinclair/typebox';
import type { Resolver } from 'react-hook-form';
import { TypeCompiler } from '@sinclair/typebox/compiler';

const EMAIL =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
const UUID = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

/**
 * RegExps.
 * A URL must match #1 and then at least one of #2/#3.
 * Use two levels of REs to avoid REDOS.
 */

const protocolAndDomainRE = /^(?:\w+:)?\/\/(\S+)$/;

const localhostDomainRE = /^localhost[\:?\d]*(?:[^\:?\d]\S*)?$/;
const nonLocalhostDomainRE = /^[^\s\.]+\.\S{2,}$/;

/**
 * Loosely validate a URL `string`.
 */
function isUrl(string: string) {
  if (typeof string !== 'string') {
    return false;
  }

  var match = string.match(protocolAndDomainRE);
  if (!match) {
    return false;
  }

  var everythingAfterProtocol = match[1];
  if (!everythingAfterProtocol) {
    return false;
  }

  if (localhostDomainRE.test(everythingAfterProtocol) || nonLocalhostDomainRE.test(everythingAfterProtocol)) {
    return true;
  }

  return false;
}

FormatRegistry.Set('email', (value) => EMAIL.test(value));
FormatRegistry.Set('uuid', (value) => UUID.test(value));
FormatRegistry.Set('uri', isUrl);

export function createFormResolver<TInput extends TObject>(input: TInput): Resolver<Static<TInput>> {
  const check = TypeCompiler.Compile(input);

  return (values, _ctx, _options) => {
    if (check.Check(values)) {
      return {
        values: values,
        errors: {},
      };
    }

    const _errors = Array.from(check.Errors(values));

    const errors = _errors.reduce((errorResult, error) => {
      // `/deepObject/data` -> `deepObject.data`
      const path = error.path.substring(1).replace(/\//g, '.');
      errorResult[path] = error;
      return errorResult;
    }, {} as any);

    return {
      values: {},
      errors: errors,
    };
  };
}
