'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { convertSegmentPathToStaticExportFilename } from 'next/dist/shared/lib/segment-cache/segment-value-encoding';

const FleetMap = dynamic(
  () => import('@/app/FleetMap'),
  { ssr: false}
);

type FleetItem = {
  id_user: number;
  first_name: string;
  last_name: string;
  phone: string;
  id_fleet: number;
  has_defi: number;
  has_lora: number;
  dev_EUI: string | null;
  med_training: string;
  lora_battery: number | null; 
  is_working_defi: number;

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

export default function Home() {
  const[fleet, setFleet] = useState<FleetItem[]>([]);
  const[loading, setLoading] = useState(true); // still fetching data upon entering
  const[emergencies, setEmergencies]=useState<Emergency[]>([]);
  const[selectedEmergencyId, setSelectedEmergencyId] = 
    useState<number | null>(null);
  const [candidates, setCandidates] = useState<FleetItem[]>([]);

  useEffect(() => {

    Promise.all([
      fetch('http://localhost:3001/api/fleet/latest-locations')
      .then((response) => response.json()),

      fetch('http://localhost:3001/api/emergencies/active')
      .then((response) => response.json())

    ])
    .then(([fleetData, emergencyData]) => {
      setFleet(fleetData);
      setEmergencies(emergencyData)
      setLoading(false);
    }) 
    .catch((error) => {
      console.error('Failed to load dashboard:', error);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <main className="p-8"> Loading... </main>;
  }


  // Idle / On-click mode
  async function handleEmergencySelect(id: number) {
  try {
    const response = await fetch(
      `http://localhost:3001/api/emergencies/${id}/candidates?radiusKm=5`
    );

    if(!response.ok){
      throw new Error('Failed to fetch candidates');
    }

    const data = await response.json();
    console.log('Candidates returned:', data);

    setCandidates(Array.isArray(data) ? data: []);
    setSelectedEmergencyId(id);
  } // try block

  catch(error) {
    console.error(error);
  } // catch block
}

// fallback to clear map after an emergency is selected
function handleClearEmergencySelection() {
  setSelectedEmergencyId(null);
  setCandidates([]);
}

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4"> Fleet </h1>
      <FleetMap key="fleet-map" 
      fleet={fleet} 
      emergencies={emergencies}
      selectedEmergencyId = {selectedEmergencyId}
      candidates={candidates}
      onEmergencySelect={handleEmergencySelect}
      onClearEmergencySelection={handleClearEmergencySelection}
      />

      <table>
        <thead>
          <tr>
            <th> Owner </th>
            <th> Defibrillator </th>
            <th> LoRa </th>
            <th> DevEUI </th>
            <th> Battery </th>
            <th> Status </th>
          </tr>
        </thead>
        <tbody>
          { fleet.map((item) => (
            <tr key={item.id_fleet}>
              <td>
                {item.first_name} {item.last_name}
              </td>
              <td> {item.has_defi ? 'Yes' : 'No'} </td>
              <td> {item.has_lora ? 'Yes' : 'No'} </td>
              <td> {item. dev_EUI ?? '-' } </td>
              <td>
                {item.lora_battery !== null ?
                  `${item.lora_battery}%`
                  : '-'}
              </td>

            <td> 
              {item.is_working_defi ? 'Working' : 'Unavailable' }
            </td>
            </tr>

          ))}
        </tbody>
        </table>
    </main>
  ); // return 

} // Home function



