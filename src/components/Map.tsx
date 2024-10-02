import { LatLngTuple } from 'leaflet';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamically import the MapComponent
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false, // This will disable server-side rendering for this component
  loading: () => <p>Loading map...</p>,
});

export function Map({
  center,
  location = 'My Location',
}: {
  center: LatLngTuple;
  location?: string;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div data-component="Map">
      {isMounted && <MapComponent center={center} location={location} />}
    </div>
  );
}
