import yaml from 'yaml';

import { sortKeys } from './helpers';

interface YamlPair {
  key?: unknown;
  value?: unknown;
  commentBefore?: string;
}

function addComments(items: Array<YamlPair>, comments: Record<string, string>, prefix = '') {
  items.forEach(item => {
    if (item.key != null) {
      const itemKey = String(item.key);
      const key = prefix ? `${prefix}.${itemKey}` : itemKey;
      if (comments[key]) {
        const value = comments[key].split('\\n').join('\n ');
        item.commentBefore = ` ${value}`;
      }
      const itemValue = item.value as { items?: Array<YamlPair> } | null | undefined;
      if (itemValue && Array.isArray(itemValue.items)) {
        addComments(itemValue.items, comments, key);
      }
    }
  });
}

const timestampTag = {
  identify: (value: unknown) => value instanceof Date,
  default: true,
  tag: '!timestamp',
  test: RegExp(
    '^' +
      '([0-9]{4})-([0-9]{2})-([0-9]{2})' + // YYYY-MM-DD
      'T' + // T
      '([0-9]{2}):([0-9]{2}):([0-9]{2}(\\.[0-9]+)?)' + // HH:MM:SS(.ss)?
      'Z' + // Z
      '$',
  ),
  resolve: (str: string) => new Date(str),
  stringify: (value: unknown) => (value as Date).toISOString(),
} as const;

export default {
  fromFile(content: string) {
    if (content && content.trim().endsWith('---')) {
      content = content.trim().slice(0, -3);
    }

    const doc = yaml.parseDocument(content, {
      customTags: [timestampTag],
      prettyErrors: true,
    });

    for (const warn of doc.warnings) {
      console.warn(`YAML warning: ${warn.message}`);
    }

    if (doc.errors.length > 0) {
      const messages = doc.errors.map(e => e.message).join('\n');
      throw new Error(`YAML parsing error:\n${messages}`);
    }

    return doc.toJSON();
  },

  toFile(data: object, sortedKeys: string[] = [], comments: Record<string, string> = {}) {
    const doc = new yaml.Document(data);
    const contents = doc.contents as { items?: Array<YamlPair> } | null;

    if (contents && Array.isArray(contents.items)) {
      addComments(contents.items, comments);
      contents.items.sort(sortKeys(sortedKeys, (item: YamlPair) => String(item.key ?? '')));
    }

    return doc.toString();
  },
};
