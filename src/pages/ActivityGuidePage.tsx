import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getSuggestedActivities,
} from '../services/openaiService';

interface Activity {
  name: string;
  description: string;
}

const ActivityGuidePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  // const [areaCoordinates, setAreaCoordinates] = useState({});

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      const { location: selectedLocation, theme } = location.state;
      const suggestedActivities = await getSuggestedActivities(
        selectedLocation,
        [theme]
      );
      setActivities(suggestedActivities);
      setLoading(false);
    };
    fetchActivities();
  }, [location.state]);

  const handleActivityClick = (activity: Activity) => {
    navigate('/console', {
      state: {
        context: `${activity.name} in ${location.state.location}`
      },
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Activities in {location.state.location}
      </h1>

      {loading ? (
        <p className="text-center">Loading activities...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {activities &&
            activities.map((activity, index) => (
              <div
                key={index}
                onClick={() => handleActivityClick(activity)}
                className="bg-blue-500 text-white rounded-full p-6 text-center hover:bg-blue-600 transition-colors cursor-pointer"
              >
                <h2 className="text-xl font-semibold">{activity.name}</h2>
                <p className="text-sm mt-2">{activity.description}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default ActivityGuidePage;