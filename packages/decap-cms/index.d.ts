declare module 'decap-cms' {
  export * from 'decap-cms-core';
  import type { CMS } from 'decap-cms-core';

  export const CMS: CMS;

  export default CMS;
}
