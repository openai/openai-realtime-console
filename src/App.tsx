import React from 'react';
import { ConsolePage } from './pages/ConsolePage';
import { ThemeProvider, useTheme } from './ThemeContext';
import './App.scss';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} className="theme-toggle">
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};

const AppContent: React.FC = () => {
  return (
    <div data-component="App">
      <ThemeToggle />
      <ConsolePage />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
