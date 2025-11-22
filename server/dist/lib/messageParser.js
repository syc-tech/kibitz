"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderTemplate = renderTemplate;
const placeholderPattern = /{{\s*([^{}]+)\s*}}/g;
function renderTemplate(message, values) {
    const missingKeys = new Set();
    const substitutions = {};
    const placeholders = [];
    const rendered = message.replace(placeholderPattern, (_, rawKey) => {
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
function getValue(values, path) {
    if (values === undefined || values === null) {
        return undefined;
    }
    if (typeof values !== 'object') {
        return values;
    }
    return path.split('.').reduce((current, segment) => {
        if (current === undefined || current === null) {
            return undefined;
        }
        if (typeof current !== 'object') {
            return undefined;
        }
        return current[segment.trim()];
    }, values);
}
function stringify(value) {
    if (value === null || value === undefined) {
        return '';
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}
//# sourceMappingURL=messageParser.js.map