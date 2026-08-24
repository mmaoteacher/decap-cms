import yaml from 'yaml';

import { sortKeys } from './helpers';

interface YamlPair {
  key?: { value?: unknown; commentBefore?: string } | unknown;
  value?: unknown;
  commentBefore?: string;
}

function addComments(items: Array<YamlPair>, comments: Record<string, string>, prefix = '') {
  items.forEach(item => {
    if (item.key != null) {
      const itemKey = String((item.key as { value?: unknown })?.value ?? item.key);
      const key: string = prefix ? `${prefix}.${itemKey}` : itemKey;
      if (comments[key]) {
        const value = comments[key].split('\\n').join('\n ');
        if (typeof item.key === 'object' && item.key !== null) {
          (item.key as { commentBefore?: string }).commentBefore = ` ${value}`;
        } else {
          item.commentBefore = ` ${value}`;
        }
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
  test: /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2}(?:\.[0-9]+)?)Z$/,
  resolve: (str: string) => new Date(str),
  stringify: (value: { value?: unknown }) => {
    const val = value?.value ?? value;
    return val instanceof Date ? val.toISOString() : String(val);
  },
};

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
      const messages = doc.errors
        .map(e => {
          let msg = e.message;
          if (msg.includes('Map keys must be unique')) {
            const lines = msg.split('\n');
            const keyLine = lines.slice(1).find(l => l.includes(':'));
            const keyName = keyLine ? keyLine.split(':')[0].trim() : '';
            msg = `Map keys must be unique; "${keyName}" is repeated\n${msg}`;
          }
          return msg;
        })
        .join('\n');
      throw new Error(`YAML parsing error:\n${messages}`);
    }

    return doc.toJS();
  },

  toFile(data: object, sortedKeys: string[] = [], comments: Record<string, string> = {}) {
    const doc = new yaml.Document(data, {
      customTags: [timestampTag],
    });
    const contents = doc.contents as { items?: Array<YamlPair> } | null;

    if (contents && Array.isArray(contents.items)) {
      addComments(contents.items, comments);
      contents.items.sort(
        sortKeys(sortedKeys, (item: YamlPair) =>
          String((item.key as { value?: unknown })?.value ?? item.key ?? ''),
        ),
      );
    }

    return doc.toString();
  },
};
