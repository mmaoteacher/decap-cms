# RFC: Preview System Enhancement and Script Injection

- **Target Package**: `packages/decap-cms-core`
- **Feature Type**: Feature / Developer Experience
- **Related Issues**: #1391 (`registerPreviewScript`), #3876 (`Preview iframe context`)

---

## 1. Problem Statement

1. **Inability to Execute Client-Side JS in Preview**: Decap CMS currently only provides `CMS.registerPreviewStyle` for injecting CSS into the preview iframe, with no corresponding `CMS.registerPreviewScript`. Libraries that require client-side execution (e.g., Mermaid diagrams, KaTeX formulas, Prism syntax highlighters, Chart.js, Tailwind CDN) fail to run inside the sandboxed preview iframe.
2. **Opaque Preview Iframe Context**: In custom preview templates (`CMS.registerPreviewTemplate`), developers lack a direct, idiomatic way (such as a React Hook) to access the preview iframe's `window` and `document` objects to manually trigger library rendering after DOM mutations.

---

## 2. API Specification

### A. Global Script Registration (`CMS.registerPreviewScript`)

```typescript
type PreviewScriptOption = 
  | string // External script URL (e.g. CDN or relative path)
  | { src: string; type?: string; async?: boolean; defer?: boolean }
  | { code: string; type?: string }; // Inline JS string

// 1. External Script via String URL
CMS.registerPreviewScript("https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js");

// 2. External Script with Attributes
CMS.registerPreviewScript({ src: "/admin/preview-init.js", type: "module" });

// 3. Inline Script Code
CMS.registerPreviewScript({ code: "window.__preview_ready = true;" });
```

### B. Preview Frame Context Hook (`usePreviewFrame`)

Export `usePreviewFrame` to access the preview iframe's `window` and `document`:

```jsx
import { usePreviewFrame } from 'decap-cms-core';

const ArticlePreview = ({ entry, widgetFor }) => {
  const { window: iframeWindow, document: iframeDoc } = usePreviewFrame();

  useEffect(() => {
    if (iframeWindow && iframeWindow.mermaid) {
      iframeWindow.mermaid.contentLoaded();
    }
  }, [entry]);

  return (
    <div className="article-body">
      {widgetFor('body')}
    </div>
  );
};
```

---

## 3. Architecture & Data Flow

```
Registry (`previewScripts`)
  │ (Populated via CMS.registerPreviewScript)
  ▼
EditorPreviewPane (`PreviewPaneFrame` head)
  │
  ├─► Injects <script src="..."> / <script>code</script> into iframe <head>
  └─► FrameContext / usePreviewFrame: provides { window, document } to custom preview templates
```

---

## 4. Implementation Phases

- [ ] **Phase 1: Registry API & Unit Tests**
  - Implement `registerPreviewScript` and `getPreviewScripts` in `registry.js`.
  - Add comprehensive unit tests in `registry.spec.js`.
- [ ] **Phase 2: iframe Script Injection & usePreviewFrame Hook**
  - Inject external and inline script elements into `EditorPreviewPane.js`.
  - Export `usePreviewFrame` hook from `decap-cms-core` and top-level packages.
- [ ] **Phase 3: E2E Browser Testing & Demo**
  - Add Cypress test verifying script execution and iframe context access.
- [ ] **Phase 4: PR & Documentation**
  - Open GitHub PR and publish release notes.
