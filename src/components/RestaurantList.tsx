import React from 'react';

interface Restaurant {
  id: string;
  name: string;
  image_url: string;
  location: {
    address1: string;
    city: string;
    state: string;
    zip_code: string;
  };
}

interface RestaurantListProps {
  restaurants: Restaurant[];
}

const RestaurantList: React.FC<RestaurantListProps> = ({ restaurants }) => {
  return (
    <div data-component="RestaurantList">
      <h2>Restaurants</h2>
      <ul>
        {restaurants.map((restaurant) => (
          <li key={restaurant.id}>
            <img src={restaurant.image_url} alt={restaurant.name} />
            <h3>{restaurant.name}</h3>
            <p>{`${restaurant.location.address1}, ${restaurant.location.city}, ${restaurant.location.state} ${restaurant.location.zip_code}`}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RestaurantList;
