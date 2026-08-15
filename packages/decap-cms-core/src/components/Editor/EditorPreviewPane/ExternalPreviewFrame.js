import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { lengths } from 'decap-cms-ui-default';

import { resolveWidget } from '../../../lib/registry';

const StyledExternalFrame = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
  border-radius: ${lengths.borderRadius};
`;

export default class ExternalPreviewFrame extends React.Component {
  iframeRef = React.createRef();

  componentDidMount() {
    window.addEventListener('message', this.handleWindowMessage);
    this.sendPreviewData();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.entry !== this.props.entry ||
      prevProps.collection !== this.props.collection ||
      prevProps.previewUrlConfig !== this.props.previewUrlConfig
    ) {
      this.sendPreviewData();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.handleWindowMessage);
  }

  handleWindowMessage = event => {
    const data = event.data;
    if (!data) return;

    const type = typeof data === 'string' ? data : data.type;
    // Supported handshake events from child iframe
    if (
      type === 'PREVIEW_READY' ||
      type === 'CMS_PREVIEW_READY' ||
      type === 'DECAP_CMS_READY' ||
      type === 'CMS_READY'
    ) {
      this.sendPreviewData();
    }
  };

  handleIframeLoad = () => {
    this.sendPreviewData();
  };

  resolveUrl() {
    const { previewUrlConfig, entry, collection } = this.props;
    if (!previewUrlConfig) return '';

    const urlValue =
      typeof previewUrlConfig === 'object' && previewUrlConfig !== null
        ? previewUrlConfig.url
        : previewUrlConfig;

    if (typeof urlValue === 'function') {
      try {
        return urlValue({ entry, collection });
      } catch (e) {
        console.error('Error executing previewUrl function:', e);
        return '';
      }
    }

    return typeof urlValue === 'string' ? urlValue : '';
  }

  getTargetOrigin() {
    const { previewUrlConfig } = this.props;
    if (typeof previewUrlConfig === 'object' && previewUrlConfig !== null) {
      return previewUrlConfig.targetOrigin || '*';
    }
    return '*';
  }

  getMessageType() {
    const { previewUrlConfig } = this.props;
    if (typeof previewUrlConfig === 'object' && previewUrlConfig !== null) {
      return previewUrlConfig.messageType || 'DECAP_CMS_PREVIEW_DATA';
    }
    return 'DECAP_CMS_PREVIEW_DATA';
  }

  getHtml() {
    const { entry, collection, previewProps } = this.props;
    const rawData = (entry && entry.toJS ? entry.toJS().data : entry && entry.data) || {};

    if (typeof rawData.html === 'string' && rawData.html) {
      return rawData.html;
    }

    let markdownField = 'body';
    if (!rawData.body && collection && collection.get) {
      const fields = collection.get('fields');
      if (fields) {
        const mdFieldObj = fields.find(
          f => f.get('widget') === 'markdown' || f.get('widget') === 'richtext',
        );
        if (mdFieldObj) {
          markdownField = mdFieldObj.get('name');
        }
      }
    }

    const markdownValue = rawData[markdownField];
    if (typeof markdownValue !== 'string' || !markdownValue) {
      return '';
    }

    // Try using registered markdown or richtext widget's markdownToHtml
    try {
      const widget = resolveWidget('markdown') || resolveWidget('richtext');
      if (widget && typeof widget.markdownToHtml === 'function') {
        const getAsset = previewProps && previewProps.getAsset;
        const remarkPlugins =
          previewProps && previewProps.getRemarkPlugins ? previewProps.getRemarkPlugins() : [];
        return widget.markdownToHtml(markdownValue, { getAsset, resolveWidget, remarkPlugins });
      }
    } catch (e) {
      console.warn('Error converting markdown to HTML in ExternalPreviewFrame:', e);
    }

    return markdownValue;
  }

  getPayload() {
    const { entry, collection } = this.props;
    const entryData = entry && entry.toJS ? entry.toJS() : entry;
    const collectionName = collection && collection.get ? collection.get('name') : '';
    const rawData = (entryData && entryData.data) || {};
    const htmlContent = this.getHtml();

    const dataWithHtml = {
      ...rawData,
      html: rawData.html || htmlContent,
    };

    return {
      type: this.getMessageType(),
      entry: entryData,
      data: dataWithHtml,
      html: htmlContent,
      post: {
        data: rawData,
        body: rawData.body || '',
        html: htmlContent,
      },
      collection: collectionName,
      isModification: entry && entry.get ? entry.get('isModification') : null,
    };
  }

  sendPreviewData = () => {
    const iframe = this.iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    const { previewUrlConfig, entry } = this.props;
    if (
      typeof previewUrlConfig === 'object' &&
      previewUrlConfig !== null &&
      typeof previewUrlConfig.handler === 'function'
    ) {
      previewUrlConfig.handler(entry, iframe);
      return;
    }

    try {
      const payload = this.getPayload();
      iframe.contentWindow.postMessage(payload, this.getTargetOrigin());
    } catch (e) {
      console.error('Error posting preview message to iframe:', e);
    }
  };

  render() {
    const url = this.resolveUrl();

    return (
      <StyledExternalFrame
        id="preview-pane"
        ref={this.iframeRef}
        src={url}
        onLoad={this.handleIframeLoad}
      />
    );
  }
}

ExternalPreviewFrame.propTypes = {
  previewUrlConfig: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.object]),
  collection: ImmutablePropTypes.map.isRequired,
  entry: ImmutablePropTypes.map.isRequired,
  previewProps: PropTypes.object,
};
