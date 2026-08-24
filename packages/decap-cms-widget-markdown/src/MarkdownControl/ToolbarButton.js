import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { Icon, buttons } from 'decap-cms-ui-default';

const StyledToolbarButton = styled.button`
  ${buttons.button};
  display: inline-block;
  padding: 6px;
  border: none;
  background-color: transparent;
  font-size: 16px;
  color: ${props => (props.isActive ? '#1e2532' : 'inherit')};
  cursor: pointer;

  &:disabled {
    cursor: auto;
    opacity: 0.5;
  }

  ${Icon} {
    display: block;
  }
`;

function ToolbarButton({ type, label, icon, onClick, isActive, disabled }) {
  function renderIcon() {
    if (!icon) return label;
    if (typeof icon === 'string') {
      const trimmed = icon.trim();
      if (trimmed.startsWith('<svg')) {
        return (
          <span
            style={{
              display: 'inline-flex',
              width: '24px',
              height: '24px',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 0,
            }}
            dangerouslySetInnerHTML={{ __html: trimmed }}
          />
        );
      }
      const isKnownIcon = [
        'add',
        'add-with',
        'arrow',
        'bold',
        'chevron',
        'chevron-double',
        'close',
        'code',
        'code-block',
        'drag-handle',
        'error',
        'folder',
        'grid',
        'hOptions',
        'image',
        'info',
        'italic',
        'link',
        'list',
        'list-bulleted',
        'list-numbered',
        'markdown',
        'media',
        'media-alt',
        'pages',
        'preview',
        'quote',
        'refresh',
        'search',
        'settings',
        'strikethrough',
        'sun',
        'triangle-down',
        'user',
        'version',
        'workflow',
      ].includes(icon);

      if (isKnownIcon) {
        return <Icon type={icon} />;
      }
      return (
        <span
          style={{
            display: 'inline-flex',
            width: '24px',
            height: '24px',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: '700',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            letterSpacing: '-0.5px',
            lineHeight: 1,
          }}
        >
          {icon}
        </span>
      );
    }
    if (React.isValidElement(icon)) {
      return icon;
    }
    if (typeof icon === 'function') {
      const IconComponent = icon;
      return <IconComponent />;
    }
    return icon;
  }

  return (
    <StyledToolbarButton
      isActive={isActive}
      onClick={e => onClick && onClick(e, type)}
      title={label}
      disabled={disabled}
    >
      {renderIcon()}
    </StyledToolbarButton>
  );
}

ToolbarButton.propTypes = {
  type: PropTypes.string,
  label: PropTypes.string.isRequired,
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.element, PropTypes.func]),
  onClick: PropTypes.func,
  isActive: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default ToolbarButton;
