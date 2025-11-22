import { ParsedMessageResult, TemplatePrimitive, TemplateValues } from '../types/messages';

const placeholderPattern = /{{\s*([^{}]+)\s*}}/g;

export function renderTemplate(message: string, values: TemplateValues): ParsedMessageResult {
  const missingKeys = new Set<string>();
  const substitutions: Record<string, string> = {};
  const placeholders: string[] = [];

  const rendered = message.replace(placeholderPattern, (_, rawKey: string) => {
    const key = rawKey.trim();
    placeholders.push(key);
    const resolved = getValue(values, key);

    if (resolved === undefined) {
      missingKeys.add(key);
      return `{{${key}}}`;
    }

    const asString = stringify(resolved);
    substitutions[key] = asString;
    return asString;
  });

  return {
    rendered,
    missingKeys: Array.from(missingKeys),
    substitutions,
    placeholders
  };
}

function getValue(values: TemplateValues | TemplatePrimitive | undefined, path: string): TemplatePrimitive | TemplateValues | undefined {
  if (values === undefined || values === null) {
    return undefined;
  }

  if (typeof values !== 'object') {
    return values;
  }

  return path.split('.').reduce<TemplatePrimitive | TemplateValues | undefined>((current, segment) => {
    if (current === undefined || current === null) {
      return undefined;
    }

    if (typeof current !== 'object') {
      return undefined;
    }

    return (current as TemplateValues)[segment.trim()];
  }, values);
}

function stringify(value: TemplatePrimitive | TemplateValues): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}
