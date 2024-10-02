import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { LatLngTuple } from 'leaflet';

function ChangeView({ center, zoom }: { center: LatLngTuple; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function MapComponent({
  center,
  location = 'My Location',
}: {
  center: LatLngTuple;
  location?: string;
}) {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setMapReady(true);
  }, []);

  if (!mapReady) {
    return <div>Loading map...</div>;
  }

  return (
    <MapContainer
      center={center}
      zoom={11}
      scrollWheelZoom={false}
      zoomControl={false}
      attributionControl={false}
      style={{ height: '400px', width: '100%' }}
    >
      <ChangeView center={center} zoom={11} />
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={center}>
        <Popup>{location}</Popup>
      </Marker>
    </MapContainer>
  );
}