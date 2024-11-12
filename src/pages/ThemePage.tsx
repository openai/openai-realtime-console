import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSuggestedThemes } from '../services/openaiService';

const ThemePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [themes, setThemes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThemes = async () => {
      setLoading(true);
      const suggestedThemes = await getSuggestedThemes([location.state.location]);
      setThemes(suggestedThemes);
      setLoading(false);
    };
    fetchThemes();
  }, [location.state.location]);

  const handleThemeSelect = (theme: string) => {
    navigate('/activities', { state: { location: location.state.location, theme } });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Choose a Theme for {location.state.location}</h1>
      
      {loading ? (
        <p className="text-center">Loading themes...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {themes.map((theme, index) => (
            <div
              key={index}
              onClick={() => handleThemeSelect(theme)}
              className="bg-blue-500 text-white rounded-full p-6 text-center hover:bg-blue-600 transition-colors cursor-pointer"
            >
              <h2 className="text-xl font-semibold">{theme}</h2>
              <p className="text-sm mt-2">Explore {theme}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemePage;
