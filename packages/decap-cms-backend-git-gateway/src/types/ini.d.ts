declare module 'ini' {
  const ini: { decode: <T>(ini: string) => T };
  export default ini;
}

declare module 'minimatch' {
  export function minimatch(path: string, pattern: string, options?: unknown): boolean;
  export default function (path: string, pattern: string, options?: unknown): boolean;
}
