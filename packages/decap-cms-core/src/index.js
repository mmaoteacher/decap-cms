import bootstrap from './bootstrap';
import Registry from './lib/registry';
import { usePreviewFrame } from './components/Editor/EditorPreviewPane/PreviewFrameContext';

export { usePreviewFrame };
export const DecapCmsCore = {
  ...Registry,
  init: bootstrap,
  usePreviewFrame,
};
export default DecapCmsCore;
