declare module 'decap-cms-app' {
  export * from 'decap-cms-core';
  import type { CMS as CmsInterface } from 'decap-cms-core';

  export const DecapCmsApp: CmsInterface;

  export default DecapCmsApp;
}
