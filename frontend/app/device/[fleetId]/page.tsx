'use client';

import { useParams } from 'next/navigation';
import EmergencyCaller from '../EmergencyCaller';
import IncomingAlerts from '../IncomingAlerts';
import ActiveResponse from '../ActiveResponse';

export default function RegisteredDevicePage() {
    const params = useParams();
    const fleetId = Number(params.fleetId);

    return (
        <main className="min-h-screen bg-slate-100 py-10 px-4">
            <div
                className=" mx-auto w-full
                    max-w-107.5 min-h-212.5 bg-white rounded-[2.5rem]
                    border-8 border-slate-900 shadow-2xl
                    overflow-hidden">
                {/* Phone top bar */}
                <div
                    className=" bg-slate-950 text-white
                    px-5 pt-3 pb-4">
                    <div
                        className="w-24 h-5 bg-black
                         rounded-full mx-auto mb-4"
                    />

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-400">
                                Defergency
                            </p>

                            <h1 className="font-bold text-lg">
                                מכשיר מתנדב
                            </h1>
                        </div>

                        <div
                            className=" text-xs bg-green-500/20
                         text-green-300 border
                         border-green-500/30 px-3
                         py-1 rounded-full">
                            מחובר
                        </div>
                    </div>
                </div>

                {/* Device identity */}
                <div
                    className="px-5 py-4 border-b bg-slate-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                מזהה מכשיר
                            </p>

                            <p className="font-bold text-slate-900">
                                Fleet #{fleetId}
                            </p>
                        </div>

                        <div
                            className="
                                text-xs
                                text-slate-500
                                bg-white
                                border
                                rounded-lg
                                px-3
                                py-2
                            "
                        >
                            משתמש רשום
                        </div>
                    </div>
                </div>

                {/* Phone screen */}
                <div
                    className=" p-4 space-y-4
                     bg-slate-50 min-h-175">
                    <section
                        className=" bg-white rounded-2xl
                         border shadow-sm p-4">

                        <ActiveResponse fleetId={fleetId} />
                    </section>

                    <section className=" bg-white rounded-2xl
                     border shadow-sm p-4">
                         <IncomingAlerts fleetId={fleetId} />
                    </section>

                    <section className=" bg-white rounded-2xl
                    border shadow-sm p-4">
                        <EmergencyCaller />
                    </section>
                </div>

                {/* Bottom phone bar */}
                <div className="bg-white py-3">
                    <div
                        className=" w-32 h-1.5 bg-slate-300
                         rounded-fullmx-auto"
                    />
                </div>
            </div>
        </main>
    );
}