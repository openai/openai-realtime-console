import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const [location, setLocation] = useState('');
  const [themes, setThemes] = useState<string[]>([]);
  const navigate = useNavigate();

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically fetch themes based on the location
    // For now, we'll use a static list
    setThemes(['Gastronomy', 'Culture', 'History', 'Nature', 'Art']);
  };

  const handleThemeSelect = (theme: string) => {
    navigate(`/console?location=${encodeURIComponent(location)}&theme=${encodeURIComponent(theme)}`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">AI Travel Guide for France</h1>
      
      {!themes.length ? (
        <form onSubmit={handleLocationSubmit} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where in France do you want to travel?"
              className="flex-grow border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
            <button 
              type="submit" 
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Next
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {themes.map((theme) => (
            <div
              key={theme}
              onClick={() => handleThemeSelect(theme)}
              className="bg-blue-500 text-white rounded-full p-6 text-center hover:bg-blue-600 transition-colors cursor-pointer"
            >
              <h2 className="text-xl font-semibold">{theme}</h2>
              <p className="text-sm mt-2">Explore {theme} in {location}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;
