declare module 'decap-cms-app' {
  export * from 'decap-cms-core';
  import type { CMS } from 'decap-cms-core';

  export const DecapCmsApp: CMS;

  export default DecapCmsApp;
}
