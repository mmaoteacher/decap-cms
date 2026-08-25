declare module 'decap-cms' {
  export * from 'decap-cms-core';
  import type { CMS as CmsInterface } from 'decap-cms-core';

  export const CMS: CmsInterface;

  export default CMS;
}
