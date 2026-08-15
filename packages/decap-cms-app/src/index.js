import { DecapCmsCore as CMS, usePreviewFrame } from 'decap-cms-core';
import './extensions.js';

// Log version
if (typeof window !== 'undefined') {
  if (typeof DECAP_CMS_APP_VERSION === 'string') {
    console.log(`decap-cms-app ${DECAP_CMS_APP_VERSION}`);
  }
}

export { usePreviewFrame };
export const DecapCmsApp = {
  ...CMS,
  usePreviewFrame,
};
export default CMS;
