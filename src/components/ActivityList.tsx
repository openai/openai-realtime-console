import React from 'react';
import { Link } from 'react-router-dom';

interface Activity {
  title: string;
  description: string;
  link: string;
}

interface ActivityListProps {
  activities: Activity[];
}

const ActivityList: React.FC<ActivityListProps> = ({ activities }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {activities.map((activity, index) => (
        <Link
          key={index}
          to={activity.link}
          className="block bg-blue-500 text-white rounded-lg p-6 hover:bg-blue-600 transition-colors"
        >
          <h2 className="text-xl font-semibold">{activity.title}</h2>
          <p className="text-sm mt-2">{activity.description}</p>
        </Link>
      ))}
    </div>
  );
};

export default ActivityList;
