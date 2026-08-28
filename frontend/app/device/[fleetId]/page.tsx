'use client';

import { useParams } from 'next/navigation';
import EmergencyCaller from '../EmergencyCaller';
import IncomingAlerts from '../IncomingAlerts';
import ActiveResponse from '../ActiveResponse';

export default function RegisteredDevicePage() {
    const params = useParams();
    const fleetId = Number(params.fleetId);
    return (
        <main className="min-h-screen p-8">
            <p className="mb-4">
                Fleet Device #{fleetId}
            </p>

            <p className="mb-8 text-gray-600">
                Registered fleet member
            </p>
            <ActiveResponse fleetId={fleetId} />
            <IncomingAlerts fleetId={fleetId} />
            <EmergencyCaller />
        </main>
    );
}
