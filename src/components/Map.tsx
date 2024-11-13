import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import './Map.scss';

type LatlongitudeTuple = [number, number]; // Define the 'LatlongitudeTuple' type

function ChangeView({
  center,
  zoom,
}: {
  center: LatlongitudeTuple;
  zoom: number;
}) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export function Map({
  center,
  location = 'My Location',
  zoom = 5,
}: {
  center: LatlongitudeTuple;
  location?: string;
  zoom?: number;
}) {
  return (
    <div data-component="Map">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        zoomControl={true}
        attributionControl={false}
      >
        <ChangeView center={center} zoom={zoom} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={center}>
          <Popup>{location}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}