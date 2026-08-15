/* eslint-disable cypress/no-unnecessary-waiting */
describe('Preview script injection and iframe context', () => {
  it('injects registered scripts into preview iframe and provides iframe context to preview components', () => {
    cy.visit('/#/collections/posts/entries/2026-08-16-post-number-20');

    // Click Login on test backend
    cy.contains('button', 'Login').click();

    // Wait for editor to be ready (preview pane loads)
    cy.get('iframe#preview-pane', { timeout: 15000 }).should('be.visible');

    // Wait for preview content to render inside the iframe
    cy.get('iframe#preview-pane').then($iframe => {
      // Poll until iframe body has content
      function checkContent(retries = 20) {
        const doc = $iframe[0].contentDocument || $iframe[0].contentWindow.document;
        const body = doc && doc.body;
        if (body && body.innerHTML.trim().length > 10 && retries > 0) {
          return cy.wrap(null);
        }
        if (retries <= 0) {
          throw new Error('iframe body never populated');
        }
        return cy.wait(500).then(() => checkContent(retries - 1));
      }
      return checkContent();
    });

    // === Test 1: Verify scripts are injected and executed in iframe ===
    cy.get('iframe#preview-pane').then($iframe => {
      const iframeWin = $iframe[0].contentWindow;
      // The inline script sets window.__preview_script_loaded = true
      expect(iframeWin.__preview_script_loaded).to.equal(true);
      // The inline script defines window.formatPreviewHeading
      expect(typeof iframeWin.formatPreviewHeading).to.equal('function');
    });

    // === Test 2: Verify window prop is passed to custom preview template ===
    // The custom post preview uses `this.props.window` to access iframe context.
    // On initial render, scripts may not have executed yet, so the title may
    // not be formatted. After any content change, it will pick up the function.

    // Trigger a content change to force re-render with the script available
    cy.get('iframe#preview-pane')
      .parents('.Pane.vertical.Pane2')
      .siblings('.Pane.vertical.Pane1')
      .find('input[type="text"]')
      .first()
      .as('titleInput');

    // Clear and retype to trigger a re-render of the preview
    cy.get('@titleInput').clear();
    cy.get('@titleInput').type('Test Preview Script');

    // Now the preview should re-render with formatPreviewHeading available
    cy.get('iframe#preview-pane').then($iframe => {
      const body = $iframe[0].contentDocument.body;
      const titleEl = body.querySelector('#preview-injected-title');
      expect(titleEl).to.not.be.null;
      // After re-render, formatPreviewHeading should have been called
      expect(titleEl.textContent).to.include('✨');
      expect(titleEl.textContent).to.include('Test Preview Script');
    });
  });
});
