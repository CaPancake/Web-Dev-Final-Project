
'use client';

import { use, useEffect, useState } from 'react';
import MovementSimulator from './MovementSimulator';
import dynamic from 'next/dynamic';

const NavigationMap = dynamic(
    () => import('./NavigationMap'),
    { ssr: false }
);

// TYPES

type ActiveEmergency = {
    id_candidate: number;
    id_emergency: number;
    id_fleet: number;
    distance_km: number;
    responded_at: string | null;
    latitude: number;
    longitude: number;
    created_at: number;
    status: string;
};

type RouteData = {
    distanceKm: number;
    durationMinutes: number;
    geometry: number[][];
}

type Props = {
    fleetId: number;
};

export default function ActiveResponse({fleetId }: Props) {

    const [activeEmergency, setActiveEmergency] = 
        useState<ActiveEmergency | null>(null);

    const [loading, setLoading] = useState(true);

    const [route, setRoute] = 
      useState<RouteData | null>(null);

    const[startingNavigation, setStartingNavigation] = useState(false);

    const[currentPosition, setCurrentPosition] = 
        useState<[number, number] | null>(null);

    const[breadcrumbPositions, setBreadcrumbPositions] = 
        useState<[number, number][]>([]);

    async function loadActiveResponse() {
        try {
            const response = await fetch(
                `http://localhost:3001/api/fleet/${fleetId}/active-response`,
            );

            if(!response.ok) {
                throw new Error('Failed to load active response');
            }

            const data = await response.json();
            setActiveEmergency(data);
        } // try block
        catch(error) {
            console.error('Failed to load active response', error);
        }
        finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadActiveResponse();
    }, [fleetId]);

    if (loading) {
        return (
            <p className="mb-4">
                Checking active response...
            </p>
        );
    }

    if(!activeEmergency) {
        return null;
    }

    async function startNavigation() {
        try {
           if(!activeEmergency){
            return;
        }
            setStartingNavigation(true);

            const routeResponse = await fetch(
                `http://localhost:3001/api/emergencies/${activeEmergency.id_emergency}/route?fleetId=${fleetId}`,
            );

            if(!routeResponse.ok) {
                throw new Error('Failed to fetch route');
            }

            const routeData = await routeResponse.json();

            // update emergency state to 'EN-ROUTE'
            const statusResponse = await fetch(
                `http://localhost:3001/api/emergencies/${activeEmergency.id_emergency}/start-navigation`,
                {
                    method: 'POST'
                }
            );

            if(!statusResponse.ok) {
                const errorData = await statusResponse.json();
                throw new Error(
                    errorData.error || 'Failed to start navigation'
                );
            }

            setRoute(routeData);
            setActiveEmergency({
                ...activeEmergency,
                status: 'EN_ROUTE'
            }); 
        } // try block
        catch (error) {
            console.error('Failed to start navigation', error)
        } // catch 
        finally {
            setStartingNavigation(false);
        } 
        } // startNavigation func 

    return( 
        <section className="w-full max-w-xl mb-8">

        <div className="border rounded-lg p-5 bg-green-50 shadow-sm">
            <h2 className="text-xl font-bold">
                Responding to Emergency #{activeEmergency.id_emergency}
            </h2>
            
            <p className="mt-3">
                <strong> Distance: </strong>{' '}
                {Number(activeEmergency.distance_km).toFixed(2)} km
            </p>

            <p>
                <strong> Status: </strong>{' '}
                {activeEmergency.status}
            </p>

            <p>
                <strong> Emergency created: </strong>{' '}
                {activeEmergency.created_at}
            </p>

            <button 
                onClick={startNavigation}
                disabled={startingNavigation}
                className="
                mt-4
                px-4 py-2
                bg-green-600
                text-white
                rounded-lg
                disabled:opacity-50
                "
                >
                    {startingNavigation
                    ? 'Calculating Route...'
                    : 'Start Navigation'}
                </button>

                {route && (
                    <div className="mt-6">
                        <h3 className="text-lg font-bold mb-2">
                            Bicycle Navigation
                        </h3>

                        <div className="mb-4">
                            <p>
                                <strong> Route Distance: </strong>{' '}
                                {route.distanceKm.toFixed(2)} km
                            </p>

                            <p>
                                <strong> Estimated cycling time: </strong>
                                {(route.durationMinutes).toFixed(1)} minutes
                            </p>
                        </div>
                        {route &&
                            <>

                            <NavigationMap
                            geometry={route.geometry}
                            emergencyLatitude={activeEmergency.latitude}
                            emergencyLongitude={activeEmergency.longitude}
                            currentPosition={currentPosition}
                            breadcrumbPositions={breadcrumbPositions}
                            />

                            <MovementSimulator
                            fleetId={fleetId}
                            geometry={route.geometry}
                            onPositionChange={(latitude, longitude) => {
                                const newPosition: [number, number] = [
                                    latitude,
                                    longitude
                                ]
                                    setCurrentPosition(newPosition);
                                    setBreadcrumbPositions((previous) =>
                                    [
                                        ...previous,
                                        newPosition
                                    ]);
                            }} 
                            />
                            </>
                        }
                    </div>
                )}
        </div>
        </section>
    );
}
