import { useState, useEffect, useRef } from 'react';

import './Select.scss';

interface LanguageOption {
  code: string;
  label: string;
  text: string;
}

export function Select({
  value,
  options,
  onChange = () => {},
}: {
  value: LanguageOption;
  options: LanguageOption[];
  onChange: (value: LanguageOption) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const handleSelect = (option: LanguageOption) => {
    onChange(option);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div data-component="Select" ref={selectRef} className="select-container">
      <div className="selected-option" onClick={() => setIsOpen(!isOpen)}>
        {value.label}
      </div>
      {isOpen && (
        <div className="options-container">
          <div className="options">
            {options.map((option) => (
              <div
                key={option.code}
                className="option"
                onClick={() => handleSelect(option)}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
