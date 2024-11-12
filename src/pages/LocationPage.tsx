import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSuggestedLocations } from '../services/openaiService';

const LocationPage: React.FC = () => {
  const [locationDescription, setLocationDescription] = useState('');
  const [suggestedLocations, setSuggestedLocations] = useState<Array<{ name: string; description: string }>>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const locations = await getSuggestedLocations(locationDescription);
    setSuggestedLocations(locations);
    setLoading(false);
  };

  const handleLocationSelect = (location: string) => {
    navigate('/themes', { state: { location } });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">AI Travel Guide for France</h1>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={locationDescription}
            onChange={(e) => setLocationDescription(e.target.value)}
            placeholder="Where do you want to travel?"
            className="flex-grow border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
          >
            {loading ? "Loading..." : "Explore"}
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {suggestedLocations.map((location, index) => (
          <div
            key={index}
            onClick={() => handleLocationSelect(location.name)}
            className="bg-blue-500 text-white rounded-full p-6 text-center hover:bg-blue-600 transition-colors cursor-pointer"
          >
            <h2 className="text-xl font-semibold">{location.name}</h2>
            <p className="text-sm mt-2">{location.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LocationPage;
