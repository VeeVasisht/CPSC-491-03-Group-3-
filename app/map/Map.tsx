import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../css/Map.css";
import { useEffect, useState } from "react";
import L from "leaflet";

const DEFAULT_CENTER: [number, number] = [34.0522, -118.2437];

type Coordinates = [number, number];

function UserLocation() {
  const map = useMap();

  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: Coordinates = [
          position.coords.latitude,
          position.coords.longitude,
        ];

        setUserLocation(location);
        map.setView(location, 14);
      },
      (error) => {
        console.warn("Unable to get user's location:", error.message);
      },
    );
  }, [map]);

  useEffect(() => {
    if (!userLocation) {
      return;
    }

    const RecenterControl = L.Control.extend({
      options: {
        position: "bottomright",
      },

      onAdd() {
        const button = L.DomUtil.create("button", "recenter-button");

        button.type = "button";
        button.title = "Recenter on my location";
        button.setAttribute("aria-label", "Recenter map on my location");

        button.innerHTML = "◎";

        L.DomEvent.disableClickPropagation(button);

        L.DomEvent.on(button, "click", () => {
          map.setView(userLocation, 14);
        });

        return button;
      },
    });

    const control = new RecenterControl();
    control.addTo(map);

    return () => {
      control.remove();
    };
  }, [map, userLocation]);

  if (!userLocation) {
    return null;
  }

  return (
    <CircleMarker
      center={userLocation}
      radius={9}
      pathOptions={{
        fillColor: "#4285f4",
        fillOpacity: 1,
        color: "white",
        weight: 3,
      }}
    >
      <Popup>You are here</Popup>
    </CircleMarker>
  );
}

export function BaseMap() {
  return (
    <main className="map-page">
      <div className="map-header">
        <h1>Map</h1>
        <p>Explore posts near you.</p>
      </div>

      <div className="map-container">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={11}
          scrollWheelZoom
          className="leaflet-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{
              tileerror: (error) => {
                console.error("Map tile failed to load:", error);
              },
            }}
          />

          <UserLocation />
        </MapContainer>
      </div>
    </main>
  );
}
