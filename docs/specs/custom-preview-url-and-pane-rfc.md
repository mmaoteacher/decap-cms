# RFC: Custom Preview URL & Preview Pane Override (`registerPreviewUrl` / `registerPreviewPane`)

## 1. Summary

This RFC specifies the design and implementation for two new extension APIs in Decap CMS:
1. `CMS.registerPreviewUrl(name, urlOrOptions, options)`: Enables external site preview in an isolated iframe with automated bidirectional `postMessage` synchronization.
2. `CMS.registerPreviewPane(name, component)`: Allows developers to completely override the preview pane React container component for a given collection.

---

## 2. Motivation & Background

Decap CMS's built-in preview pane relies on `react-frame-component`, rendering a blank iframe where React mounts preview templates. While effective for simple sites and React-based previews, modern frontend frameworks (e.g. **Astro**, **Next.js**, **Nuxt**, **SvelteKit**, **Remix**) often have complex rendering pipelines, server-side layouts, or non-React component trees.

Currently, developers wanting to preview their real site have two options:
1. Re-implement their site templates in React inside Decap CMS (labor intensive and prone to drift).
2. Manually embed an `<iframe>` inside `registerPreviewTemplate` (resulting in a nested iframe inside `react-frame-component` and awkward scroll/resizing behaviors).

By providing first-class support for `registerPreviewUrl` and `registerPreviewPane`, Decap CMS enables seamless live editing preview with any external site or framework via standard `postMessage` communication without nested iframes.

---

## 3. Detailed Design

### A. Registry APIs (`registry.js`)

```typescript
type PreviewUrlFn = (ctx: { entry: Map<string, any>; collection: Map<string, any> }) => string;

interface PreviewUrlOptions {
  url?: string | PreviewUrlFn;
  targetOrigin?: string;
  messageType?: string;
  handler?: (entry: any, iframe: HTMLIFrameElement) => void;
}

type PreviewUrl = string | PreviewUrlFn | PreviewUrlOptions;

// Global Registry methods
CMS.registerPreviewUrl(name: string, urlOrOptions: PreviewUrl, options?: PreviewUrlOptions): void;
CMS.getPreviewUrl(name: string): PreviewUrlOptions | undefined;

CMS.registerPreviewPane(name: string, component: React.ComponentType<any>): void;
CMS.getPreviewPane(name: string): React.ComponentType<any> | undefined;
```

#### Usage Examples

```javascript
// 1. Static URL for a collection
CMS.registerPreviewUrl('posts', 'http://localhost:4321/preview');

// 2. Dynamic URL based on entry slug / data
CMS.registerPreviewUrl('posts', ({ entry }) => {
  return `/preview?slug=${entry.get('slug')}`;
});

// 3. Advanced options with custom targetOrigin and messageType
CMS.registerPreviewUrl('posts', {
  url: 'http://localhost:4321/preview',
  targetOrigin: 'http://localhost:4321',
  messageType: 'CMS_PREVIEW_DATA',
});

// 4. Wildcard for all collections
CMS.registerPreviewUrl('*', '/preview');

// 5. Complete preview pane component override
CMS.registerPreviewPane('posts', CustomPreviewComponent);
```

---

### B. `ExternalPreviewFrame` Component

When `registerPreviewUrl` is used (or `preview_url` is configured in `config.yml`), `EditorPreviewPane` mounts `ExternalPreviewFrame` instead of `react-frame-component`:

1. **Rendering**: Renders a single `<iframe id="preview-pane" src={resolvedUrl} />`.
2. **Lifecycle & Synchronization**:
   - When the child iframe mounts and sends `{ type: 'PREVIEW_READY' }` (or `CMS_PREVIEW_READY` / `DECAP_CMS_READY`), CMS sends the initial post data immediately.
   - When the iframe fires `onLoad`, CMS sends the current post data.
   - On every entry change (`componentDidUpdate`), CMS emits a `postMessage` event to `iframe.contentWindow`:
     ```javascript
     {
       type: messageType || 'DECAP_CMS_PREVIEW_DATA',
       entry: entry.toJS(),
       data: entry.get('data') ? entry.get('data').toJS() : {},
       collection: collection.get('name'),
       isModification: entry.get('isModification'),
     }
     ```
3. **URL Resolution**: If the URL is dynamic, the iframe `src` updates only when the resolved URL string changes, avoiding unnecessary reloads on text edits.

---

### C. Downstream Preview Receiver Specification

Downstream preview pages (e.g. in Astro, Next.js, Solid.js) simply listen for `message` events:

```javascript
window.addEventListener('message', (event) => {
  const { type, entry, data } = event.data || {};
  if (type === 'DECAP_CMS_PREVIEW_DATA' || type === 'CMS_PREVIEW_DATA') {
    renderPost(data);
  }
});

// Notify parent CMS that preview listener is ready
if (window.parent !== window) {
  window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
}
```
