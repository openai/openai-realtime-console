import React, { useEffect, useState } from 'react';
import './Button.scss';

import { Icon } from 'react-feather';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  icon?: Icon;
  iconPosition?: 'start' | 'end';
  iconColor?: 'red' | 'green' | 'grey';
  iconFill?: boolean;
  buttonStyle?: 'regular' | 'action' | 'alert' | 'flush';
}

export function Button({
  label = 'Okay',
  icon = void 0,
  iconPosition = 'start',
  iconColor = void 0,
  iconFill = false,
  buttonStyle = 'regular',
  onMouseDown,
  onMouseUp,
  onTouchStart,
  onTouchEnd,
  ...rest
}: ButtonProps) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const touchHandler = () => {
      setIsTouchDevice(true);
      window.removeEventListener('touchstart', touchHandler);
    };
    window.addEventListener('touchstart', touchHandler);
    return () => {
      window.removeEventListener('touchstart', touchHandler);
    };
  }, []);

  const handleMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!isTouchDevice && onMouseDown) {
      onMouseDown(event);
    }
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!isTouchDevice && onMouseUp) {
      onMouseUp(event);
    }
  };

  const StartIcon = iconPosition === 'start' ? icon : null;
  const EndIcon = iconPosition === 'end' ? icon : null;
  const classList = [];
  if (iconColor) {
    classList.push(`icon-${iconColor}`);
  }
  if (iconFill) {
    classList.push(`icon-fill`);
  }
  classList.push(`button-style-${buttonStyle}`);

  return (
    <button
      data-component="Button"
      className={classList.join(' ')}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      {...rest}
    >
      {StartIcon && (
        <span className="icon icon-start">
          <StartIcon />
        </span>
      )}
      <span className="label">{label}</span>
      {EndIcon && (
        <span className="icon icon-end">
          <EndIcon />
        </span>
      )}
    </button>
  );
}
