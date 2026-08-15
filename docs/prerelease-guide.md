# Develop Prerelease & Live CDN Guide

This document describes how prerelease builds are automated from the `develop` branch and how downstream projects (e.g. Astro / Solid / Next.js) can consume them.

---

## 1. Automated CI Workflow

Whenever code is merged/pushed to `develop` (or triggered manually via **Actions > Publish Develop Prerelease & Pages**):

1. **GitHub Pages (`latest` CDN)**:
   The built distribution bundle (`packages/decap-cms/dist/*`) is published to GitHub Pages.

   - **URL**: `https://mmaoteacher.github.io/decap-cms/dist/decap-cms.js`
   - **Build Info**: `https://mmaoteacher.github.io/decap-cms/dist/version.json`

2. **GitHub Release Assets (`dev-latest` & versioned tags)**:
   The distribution files are uploaded as release assets:
   - **Rolling Latest**: `https://github.com/mmaoteacher/decap-cms/releases/download/dev-latest/decap-cms.js`
   - **Specific Commit**: `https://github.com/mmaoteacher/decap-cms/releases/download/dev-<short_sha>/decap-cms.js`

---

## 2. Downstream Consumption Examples

### A. Fixed `latest` Script Tag (Recommended for Active Development)

Use GitHub Pages or the rolling release asset in your HTML/Astro template:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Content Manager</title>
  </head>
  <body>
    <!-- Always pulls the latest develop build -->
    <script src="https://mmaoteacher.github.io/decap-cms/dist/decap-cms.js"></script>
    <script>
      CMS.init();
      // Use new features like CMS.registerPreviewUrl or CMS.registerPreviewScript
    </script>
  </body>
</html>
```

### B. Fixed Versioned Release Asset (Recommended for Stability)

```html
<script src="https://github.com/mmaoteacher/decap-cms/releases/download/dev-8ef25fe/decap-cms.js"></script>
```

---

## 3. GitHub Repository Setup (One-time)

To enable GitHub Pages deployment via GitHub Actions:

1. In your GitHub repository settings, navigate to **Settings > Pages**.
2. Under **Build and deployment > Source**, select **GitHub Actions**.
