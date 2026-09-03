'use client';

import { useParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

import LoRaIncomingAlerts from '../LoRaIncomingAlerts';

import LoRaActiveResponse from '../LoRaActiveResponse';

import { BatteryLow, BatteryMedium, BatteryFull, Power } from 'lucide-react';

type DeviceInfo = {
    id_fleet: number;
    has_lora: number;
    dev_EUI: string | null;
    lora_battery: number | null;
    is_working_defi: number;
};


export default function LoRaDevicePage() {

    const params = useParams();

    const fleetId = Number(params.fleetId);

    const [ isPoweredOn, setIsPoweredOn] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);

    const [isAlerting, setIsAlerting] = useState(false);

    const alertTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [responseRefreshKey, setResponseRefreshKey] = useState(0);

    const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

    const [lowBatteryThreshold, setLowBatteryThreshold] = useState(20);
    /*
     * Message displayed after
     * heartbeat / location actions.
     */
    const [connectionMessage, setConnectionMessage] = useState('');

    // ALERT SOUND

    function playAlertSound() {

        try {
            const audioContext =audioContextRef.current;

            if (!audioContext) {
                return;
            }
            function beep(delay: number, duration: number) {

                setTimeout(() => {

                    const osc = audioContext!.createOscillator();
                    const gain = audioContext!.createGain();

                    osc.type = 'square';

                    osc.frequency.value = 850;
                    gain.gain.value = 0.08;

                    osc.connect(gain);

                    gain.connect(audioContext!.destination);
                    osc.start();

                    setTimeout(() => {
                        osc.stop();
                    }, duration);

                }, delay);
            }

            // BEEP - BEEP - BEEP

            beep(0, 180);

            beep(350, 180);

            beep(700, 180);

        } catch (error) {

            console.warn('Alert sound could not play:', error);
        }
    }

    // ALERT SIGNAL

    function handleAlertSignal() {

        setIsAlerting(true);

        if (alertTimeout.current) {

            clearTimeout(alertTimeout.current);
        }

        alertTimeout.current =
            setTimeout(() => {

                setIsAlerting(false);

            }, 5000);


        playAlertSound();
    }

    // POWER

    async function powerOnDevice() {

        const AudioContextClass = window.AudioContext ||
            (window as any).webkitAudioContext;

        const audioContext = new AudioContextClass();
        await audioContext.resume();

        audioContextRef.current = audioContext;
        setIsPoweredOn(true);
    }

    function powerOffDevice() {

        if (audioContextRef.current) {

            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        if (alertTimeout.current) {

            clearTimeout(alertTimeout.current);
            alertTimeout.current = null;
        }

        setIsPoweredOn(false);
        setIsAlerting(false);
        setConnectionMessage('');
    }

    // RESPONSE REFRESH

    function handleResponseRefresh() {

        setResponseRefreshKey(
            (previous) => previous + 1);
    }

    // LOAD DEVICE INFO

    async function loadDeviceInfo() {

        try {

            if (!Number.isInteger(fleetId) || fleetId <= 0) {
                return;
            }

            const response = await fetch(
                    `http://localhost:3001/api/fleet/${fleetId}/device-info`
                );

            if (!response.ok) {
                return;
            }

            const data = await response.json();

            setDeviceInfo(data);

        } catch (error) {

            console.error('Failed to fetch LoRa Device Data', error);
        }
    }

    useEffect(() => {
        loadDeviceInfo();
    }, [fleetId]);

    // MANUAL HEARTBEAT

    async function sendManualHeartbeat() {

        if (!navigator.geolocation) {
            setConnectionMessage('שירותי מיקום אינם נתמכים במכשיר זה');
            return;
        }

        if (!Number.isInteger(fleetId) || fleetId <= 0 ) {

            setConnectionMessage( 'מזהה מכשיר אינו תקין');
            return;
        }

        setConnectionMessage('מאתר מיקום...');

        navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const latitude = position.coords.latitude;

                        const longitude = position.coords.longitude;

                        /*
                         * Use current DB battery.
                         *
                         * If no heartbeat has ever
                         * reported a battery value,
                         * 85 is inserted to simulate.
                         */
                        const batteryValue = deviceInfo ?.lora_battery ?? 85;

                        const response = await fetch(
                                `http://localhost:3001/api/fleet/${fleetId}/heartbeat`,
                                {
                                    method:
                                        'POST',

                                    headers: {'Content-Type': 'application/json'
                                    },

                                    body:
                                        JSON.stringify({
                                            battery: batteryValue,
                                            latitude,
                                            longitude
                                        })
                                }
                            );


                        const data = await response.json();

                        if (!response.ok) {
                            throw new Error( data.error || 'Heartbeat failed');
                        }


                        console.log('Heartbeat response:',data);

                        // Backend manages maintenance notifications
                        if (data.needsMaintenance) {
                            setConnectionMessage(`⚠ נדרש טיפול: הסוללה מתחת לסף ${data.lowBatteryThreshold}%`);

                        } else {
                            setConnectionMessage('✓ Heartbeat נשלח בהצלחה');
                        }

                        // Refresh device data so
                        await loadDeviceInfo();

                    } catch (error) {

                        console.error('Heartbeat failed:', error);

                        if (error instanceof Error) {

                            setConnectionMessage(`שליחת Heartbeat נכשלה: ${error.message}`);

                        } else {
                            setConnectionMessage('נכשלה שליחת Heartbeat');
                        }
                    }
                },
                (error) => {

                    console.error('Location failed:',error);
                    setConnectionMessage('לא ניתן היה לקבל את מיקום המכשיר');
                },
                {
                    enableHighAccuracy:true,
                    timeout:10000,
                    maximumAge:0
                }
            );
    }

    // LOW BATTERY CHECKUP 
    
    useEffect(() => {

    async function loadBatteryThreshold() {

        try {

            const response = await fetch('http://localhost:3002/api/settings');

            if (!response.ok) {
                return;
            }

            const data = await response.json();

            setLowBatteryThreshold(Number(data.lowBatteryThreshold));

        } catch (error) {

            console.error('Failed to load battery threshold:',error);
        }
    }
    loadBatteryThreshold();
}, []);


    // PAGE
    return (

        <main className=" min-h-screen flex items-center justify-center
                        p-8">

        <div className="w-90 rounded-3xl border-4 border-gray-4
             bg-gray-900 p-5 shadow-xl">

                {/* DEVICE STATUS */}

            <div className={`flex justify-between text-sm mb-4
                ${  isPoweredOn
                     ? 'text-green-400'
                    : 'text-red-400'
                        }
                    `}>

                    <span>
                        LoRa Device
                        {' '}
                        #{fleetId}
                    </span>

                    <span>

                        ●{' '}

                        { isPoweredOn
                            ? 'Connected'
                            : 'Disconnected'
                        }

                    </span>

                </div>

                {/* BATTERY STATUS */}

                {   isPoweredOn &&
                    deviceInfo &&
                    deviceInfo.lora_battery !== null &&
                    (
                        <div className="flex items-center
                        justify-between w-full font-sans mb-3">

                            {deviceInfo.lora_battery <= lowBatteryThreshold
                                ? (
                            <span className="font-bold text-red-500">
                            ⚠ Maintenance Required
                             </span>
                                )
                            : (
                             <span className=" text-green-400">
                            Operational
                             </span>
                            )
                            }


                            <div className="flex items-center gap-2 text-white">

                                <span>
                                    {deviceInfo.lora_battery}
                                    %
                                </span>

                                {deviceInfo.lora_battery <= lowBatteryThreshold
                                ? (
                                <BatteryLow size={22} color="red"/>
                                )
                                : deviceInfo.lora_battery <= 60
                                ? (
                                    <BatteryMedium size={22} color="white" />
                                 )
                                : ( 
                                <BatteryFull size={22} color="white"/>
                                )
                                }
                            </div>
                        </div>
                    )
                }

                {/* POWER BUTTON */}

                <button onClick=
                {isPoweredOn
                    ? powerOffDevice
                    : powerOnDevice
                }
                className={`
                        ${isPoweredOn
                        ? `flex justify-center gap-2 w-full
                         mb-4 py-2 bg-gray-500 text-black
                        rounded-lg font-bold font-sans
                        mt-1 `
                        : ` flex justify-center gap-2 w-full mb-4
                            py-2 bg-white text-black rounded-lg
                         font-bold font-sans mt-1`
                        }
                        `
                    }>
                    <Power />
                    {
                        isPoweredOn
                            ? 'POWER OFF'
                            : 'POWER ON'
                    }

                </button>


                {/* DEVICE CONTENT */}

                { isPoweredOn
                        ? (
                <>
                     <div className="rounded-xl bg-green-200
                         text-gray-900 p-4 min-h-105 max-h-130
                         overflow-y-auto
                          lora-scrollbar" >

              <LoRaIncomingAlerts fleetId={fleetId}
              onAlertSignal={handleAlertSignal}
              onResponseChanged={handleResponseRefresh}/>

            <LoRaActiveResponse fleetId={fleetId}
                    refreshKey={responseRefreshKey}/>

            {/* MANUAL HEARTBEAT */}

                <button onClick={sendManualHeartbeat}
                className="w-full bg-slate-800 hover:bg-slate-700
                 text-white px-4 py-3 rounded-lg font-bold mt-4">
                     שליחת מיקום
                </button>

                {connectionMessage && (
                    <p className=" mt-3 text-sm font-medium text-center">
                        {connectionMessage}
                    </p>
                )
                }
                </div>

                </>
                )
                : (
                <div className="text-center text-white mt-12">
                                DEVICE OFFLINE
                            </div>
                        )
                }

                {/* LEDs */}

                <div className="flex justify-center gap-4 mt-5">

                <div className={` w-4 h-4 rounded-full bg-red-500
                    ${isPoweredOn
                    ? ''
                    : 'opacity-20'
                    }
                    ${isAlerting
                     ? 'lora-blink' : ''}
                        `}
                    />

                <div className={`w-4 h-4 rounded-full bg-yellow-400

                    ${ isPoweredOn ? '' : 'opacity-20'}

                    ${ isAlerting ? 'lora-blink' : ''}`}
                    />

                    <div className={`w-4 h-4 rounded-full bg-green-500
                    ${isPoweredOn ? ''
                                : 'opacity-20'}

                    ${isAlerting ? 'lora-blink' : ''}
                        `}
                    />

                </div>

            </div>

        </main>
    );
}