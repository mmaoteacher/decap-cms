/* eslint-disable cypress/no-unnecessary-waiting */
describe('External Preview URL and postMessage Bridge', () => {
  it('loads external preview URL in preview iframe and synchronizes content via postMessage', () => {
    cy.visit('/#/collections/kitchenSink/entries/2026-08-16-kitchen-sink-post');

    // Click Login on test backend
    cy.contains('button', 'Login').click();

    // Verify preview pane iframe is loaded with the custom preview URL
    cy.get('iframe#preview-pane', { timeout: 15000 }).should('be.visible');
    cy.get('iframe#preview-pane').should('have.attr', 'src', '/preview.html');

    // Poll until the external iframe has received the initial postMessage data
    cy.get('iframe#preview-pane').then($iframe => {
      function checkIframeData(retries = 20) {
        const win = $iframe[0].contentWindow;
        if (win && win.__last_preview_payload && retries > 0) {
          return cy.wrap(win.__last_preview_payload);
        }
        if (retries <= 0) {
          throw new Error('postMessage payload was never received by external preview iframe');
        }
        return cy.wait(500).then(() => checkIframeData(retries - 1));
      }
      return checkIframeData();
    });

    // Test Live Synchronization: type a title into the title input field
    cy.get('[id^="title-field-"]').clear();
    cy.get('[id^="title-field-"]').type('Live Astro Preview Updated');

    // Verify the external iframe receives the new postMessage and updates its DOM
    cy.get('iframe#preview-pane').then($iframe => {
      function checkUpdatedTitle(retries = 20) {
        const doc = $iframe[0].contentDocument || $iframe[0].contentWindow.document;
        const titleEl = doc && doc.querySelector('#post-title');
        if (titleEl && titleEl.textContent === 'Live Astro Preview Updated' && retries > 0) {
          return cy.wrap(titleEl.textContent);
        }
        if (retries <= 0) {
          throw new Error('Title was not updated in external preview iframe');
        }
        return cy.wait(300).then(() => checkUpdatedTitle(retries - 1));
      }
      return checkUpdatedTitle();
    });

    // Verify the payload structure and html attributes
    cy.get('iframe#preview-pane').then($iframe => {
      const win = $iframe[0].contentWindow;
      const payload = win.__last_preview_payload;
      expect(payload).to.not.be.null;
      expect(payload.type).to.equal('DECAP_CMS_PREVIEW_DATA');
      expect(payload.collection).to.equal('kitchenSink');
      expect(payload.data.title).to.equal('Live Astro Preview Updated');
      // Verify html property is provided in payload, data, and post
      expect(payload.html).to.be.a('string');
      expect(payload.data.html).to.be.a('string');
      expect(payload.post).to.not.be.null;
      expect(payload.post.html).to.be.a('string');
      expect(payload.post.data.title).to.equal('Live Astro Preview Updated');
    });
  });
});
