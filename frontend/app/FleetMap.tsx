'use client';

import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

delete (L.Icon.Default.prototype as any).__getIconUrl;

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type FleetLocation = {
    id_fleet: number;
    first_name: string;
    last_name: string;
    has_defi: number;
    has_lora: number,
    latitude: number | null;
    longitude: number | null;
    time_of_transmit: string | null;
};

type Props = {
    fleet: FleetLocation[];
};

export default function FleetMap({ fleet }: Props ) {
    // filter and avoid FleetLocation without location data
    const devicesWithLocation = fleet.filter(
        (item) => item.latitude !== null && item.longitude !== null
    );
    console.log('devicesWithLocation:', devicesWithLocation);

    return (
        <MapContainer 
        center = {[32.0853, 34.7818]}
        zoom = {13}
        style = {{ height: '500px', width: '500px'}}
        >
        <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' 
        />

        {devicesWithLocation.map((item) => (
        <Marker
            key={item.id_fleet}
            position={[Number(item.latitude), Number(item.longitude)
            ]}
            icon={markerIcon}
            >

            console.log('Alice:' devicesWithLocation[0]?.latitude,
            devicesWithLocation[0].longitude);

            <Popup> 
                <div className="min-w-45">
                    <h3 className="font-bold text-base mb-2">
                        {item.first_name} {item.last_name}
                    </h3>
                

                <div className="space-y-1 text-sm">
                    <p>
                        <strong> Defibrillator: </strong> {' '}
                        {item.has_defi ? 'Yes' : 'No'}
                    </p>

                    <p>
                    <strong> LoRa: </strong> {' '}
                    {item.has_lora ? 'Yes' : 'No'} 
                    </p>

                    <p>
                        <strong> Last Transmission: </strong>
                        {item.time_of_transmit 
                        ? item.time_of_transmit
                        : 'Unknown' }
                    </p>
                </div>
                </div>

            </Popup>
            </Marker>
    
        ))}

        </MapContainer>
        );
} // FleetMap