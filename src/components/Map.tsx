import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import React from 'react';
import { LatLngTuple } from 'leaflet';
import './Map.scss';

function ChangeView({ center, zoom }: { center: LatLngTuple; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export function Map({
  center,
  location = 'My Location',
}: {
  center: LatLngTuple;
  location?: string;
}) {
  return (
    <div data-component="Map">
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
      >
        <ChangeView center={center} zoom={11} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={center}>
          <Popup>{location}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
