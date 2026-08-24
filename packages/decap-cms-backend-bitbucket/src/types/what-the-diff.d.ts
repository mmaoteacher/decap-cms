declare module 'what-the-diff' {
  export const parse: (
    rawDiff: string,
  ) => { oldPath?: string; newPath?: string; binary: boolean; status: string }[];
}

declare module 'minimatch' {
  export function minimatch(path: string, pattern: string, options?: unknown): boolean;
  export default function (path: string, pattern: string, options?: unknown): boolean;
}
