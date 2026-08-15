import controlComponent from './RichtextControl';
import previewComponent from './RichtextPreview';
import schema from './schema';
import { markdownToHtml } from './serializers';

function Widget(opts = {}) {
  return {
    name: 'richtext',
    controlComponent,
    previewComponent,
    schema,
    markdownToHtml,
    ...opts,
  };
}

export { markdownToHtml };
export const DecapCmsWidgetRichtext = {
  Widget,
  controlComponent,
  previewComponent,
  markdownToHtml,
};
export default DecapCmsWidgetRichtext;
