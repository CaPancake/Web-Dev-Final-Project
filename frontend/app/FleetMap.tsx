'use client';

import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';

delete (L.Icon.Default.prototype as any).__getIconUrl;


// Icons

const fleetIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const EmergencyIcon = L.divIcon({
    className: '',
    html:`
    <div
    style="
        width:24px;
        height:24px;
        background: red;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 6px rgba(0,0,0,0.6);
        "
        ></div>
    `,
    iconSize: [24,24],
    iconAnchor:[12,12]
});

const selectedEmergencyIcon = L.divIcon({
    className:'',
    html: `
        <div
        style="
        width:24px;
        height:24px;
        background:#dc2626;
        border:4px solid white;
        border-radius: 50%;
        box-shadow: 0 0 9px rgba(220,38,38,0.9);
        "
        ></div>
    `,
    iconSize:[30,30],
    iconAnchor:[15,15],
});

const mutedEmergencyIcon = L.divIcon({
    className:'',
    html: `
    <div
        style="
        width:20px;
        height:20px;
        background:#dc2626;
        opacity:0.5;
        border: 2px solid white;
        border-radius:50%;
        box-shadow: 0 0 9px rgba(220,38,38,0.9);
        "
    ></div>`, 
    iconSize:[20,20],
    iconAnchor:[10,10],
});

const candidateIcon = L.divIcon({
    className:'',
    html:`
    <div
        style="
        width:22px;
        height:22px;
        background:#16a34a;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 5px rgba(0,0,0,0.5);
        "
        ></div> `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
    });


// TYPES

type FleetLocation = {
    id_fleet: number;
    first_name: string;
    last_name: string;
    has_defi: number;
    has_lora: number,
    lora_battery?: number | null;
    med_training?: string;
    latitude: number | null;
    longitude: number | null;
    time_of_transmit: string | null;
};

type Emergency = {
    id_emergency: number;
    latitude: number;
    longitude: number;
    created_at: string;
    status: string;
};

type Props = {
    fleet: FleetLocation[];
    emergencies: Emergency[];

    selectedEmergencyId: number | null;
    candidates: FleetLocation[];

    onEmergencySelect: (id: number) => void;
    onClearEmergencySelection: () => void;
};

function MapClickReset({
    onReset
}: {
    onReset: () => void;
}) {
    useMapEvents({
        click() {
            onReset();
        }
    });

    return null;
}

export default function FleetMap({ fleet, emergencies,
    selectedEmergencyId, candidates, onEmergencySelect,
    onClearEmergencySelection
 }: Props ) {
    // filter and avoid FleetLocation without location data
    const devicesWithLocation = fleet.filter(
        (item) => item.latitude !== null && item.longitude !== null
    );
    console.log('devicesWithLocation:', devicesWithLocation);

    /*
    Interactive map:
        IDLE --> Show every fleet member
        Emergency clicked --> show only members relevant to respond
    */

    const candidateIds = new Set(
        candidates.map((candidate: FleetLocation) =>
            Number(candidate.id_fleet)
        )
    );

    const displayedFleet = 
        selectedEmergencyId === null 
        ? devicesWithLocation 
        : devicesWithLocation.filter((member) =>
            candidateIds.has(Number(member.id_fleet))
        );

    return (
        <MapContainer 
        center = {[32.0853, 34.7818]}
        zoom = {13}
        style = {{ height: '500px', width: '500px'}}
        >
        <MapClickReset onReset={onClearEmergencySelection}/>

        <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' 
        />

        {displayedFleet.map((item) => (
        
        <Marker
            key={`fleet-${item.id_fleet}`}

            position={[Number(item.latitude), Number(item.longitude)
            ]}
            icon={
                selectedEmergencyId !== null
                ? candidateIcon
                : fleetIcon}
            >

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

                    {item.lora_battery !== undefined && (
                        <p>
                            <strong> Battery: </strong>{' '}
                            {item.lora_battery !== null
                            ? `${item.lora_battery}%`
                            : 'Unknown'
                            }
                        </p>
                    )}

                    {item.med_training && (
                        <p>
                            <strong> Medical Training: </strong> {' '}
                            {item.med_training}
                        </p>
                    )}

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

      {emergencies.map((emergency) => {
        const isSelected = 
            emergency.id_emergency === selectedEmergencyId;
        
        const emergencyMarkerIcon = 
            selectedEmergencyId === null
            ? EmergencyIcon
            : isSelected 
                ? selectedEmergencyIcon
                : mutedEmergencyIcon;

        return (
            <Marker
            key={emergency.id_emergency}
            position={[
                Number(emergency.latitude),
                Number(emergency.longitude)
            ]}
            // prevent muted events to go over event text-boxes
            zIndexOffset={
                isSelected 
                ? 1000
                : selectedEmergencyId !== null
                ? -100
                : 0
            }
            icon={emergencyMarkerIcon}
            eventHandlers={{
                click: (event) => {
                    L.DomEvent.stopPropagation(event.originalEvent);
                    
                    if(!isSelected)
                        onEmergencySelect(emergency.id_emergency);
                }
            }}
            > 
            {(selectedEmergencyId === null || isSelected) && (
                <Popup
                closeButton={true}
                autoClose={true}
                closeOnClick={false}
                >
                 <div>
                <h3 className="font-bold text-base mb-2"> 
                    Emergency #{emergency.id_emergency}
                </h3>
                <p>
                    <strong> Status: </strong> 
                    {emergency.status}
                </p>
                
                <p>
                    <strong> Created: </strong>
                    {emergency.created_at}
                </p>
                
                </div>
                </Popup>

            )}
            </Marker>
        )
    })}

        </MapContainer>
        );

} // FleetMap