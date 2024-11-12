import * as React from 'react';

interface ThemeSelectorProps {
  themes: string[];
  onThemeSelect: (theme: string) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ themes, onThemeSelect }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {themes.map((theme, index) => (
        <div
          key={index}
          onClick={() => onThemeSelect(theme)}
          className="bg-blue-500 text-white rounded-full p-6 text-center hover:bg-blue-600 transition-colors cursor-pointer"
        >
          <h2 className="text-xl font-semibold">{theme}</h2>
          <p className="text-sm mt-2">Select this theme</p>
        </div>
      ))}
    </div>
  );
};

export default ThemeSelector;
