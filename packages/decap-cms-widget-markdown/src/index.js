import controlComponent from './MarkdownControl';
import previewComponent from './MarkdownPreview';
import schema from './schema';
import { markdownToHtml } from './serializers';

function Widget(opts = {}) {
  return {
    name: 'markdown',
    controlComponent,
    previewComponent,
    schema,
    markdownToHtml,
    ...opts,
  };
}

export { markdownToHtml };
export const DecapCmsWidgetMarkdown = {
  Widget,
  controlComponent,
  previewComponent,
  markdownToHtml,
};
export default DecapCmsWidgetMarkdown;
