'use client';

import { useParams } from 'next/navigation';
import { useState, useRef } from 'react';
import LoRaIncomingAlerts from '../LoRaIncomingAlerts';
import LoRaActiveResponse from '../LoRaActiveResponse';

export default function LoRaDevicePage() {
    const params = useParams();
    const fleetId = Number(params.fleetId);
    const [isPoweredOn, setIsPoweredOn] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const [isAlerting, setIsAlerting] = useState(false);
    const alertTimeout = useRef<ReturnType<typeof setTimeout> | null> (null);
    const [responseRefreshKey, setResponseRefreshKey] = useState(0);
    
// beep sounds

function playAlertSound() {

    try {
        const audioContext = audioContextRef.current;

        if(!audioContext) {
            return;
        }

        function beep(delay: number, duration: number) {
            setTimeout(() => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();

                osc.type = 'square';
                osc.frequency.value = 850;

                gain.gain.value = 0.08;

                osc.connect(gain);
                gain.connect(audioContext.destination);

                osc.start();
                setTimeout (() => {
                    osc.stop();
                }, duration);
            }, delay);
        }

        // BEEP - BEEP - BEEP
        beep(0, 180);
        beep(350, 180);
        beep(700, 180);

        setTimeout(() => {
            audioContext.close();
        }, 1200);

    } // try block
    catch (error) {
        console.warn(
            'Alert sound could not play:'
        , error);
        }
    } // playAlertSound func

function handleAlertSignal() {

    // start/restart blinking
    setIsAlerting(true);

    if(alertTimeout.current) {
        clearTimeout(alertTimeout.current);
    }

    alertTimeout.current = setTimeout (() => {
        setIsAlerting(false);
    }, 5000);

    playAlertSound();

    } // alertSignal()

    async function powerOnDevice() {
        const AudioContextClass = 
        window.AudioContext || (window as any).webkitAudioContext;

        const audioContext = new AudioContextClass();

        await audioContext.resume();

        audioContextRef.current = audioContext;
        setIsPoweredOn(true);

    } // powerOnDevice func

    function powerOffDevice() {
        if(!audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        setIsPoweredOn(false);
        setIsAlerting(false);

    } // powerOffDevice func

    function handleResponseRefresh() {
        setResponseRefreshKey((previous) => previous + 1);
    }

    return (
        <main className="min-h-screen flex items-center justify p-8">
            <div className="w-90 rounded-3xl border-4 border-gray-4
                            bg-gray-900 p-5 shadow-xl">
                <div className={`flex justify-between text-sm mb-4
                                ${isPoweredOn ?
                                    'text-green-400'
                                    : 'text-red-400' }`}>
                            <span> LoRa Device #{fleetId} </span>


                            <span> ● 
                                {
                                    isPoweredOn ? 
                                    ' Connected'
                                    : ' Disconnected'
                                }
                            </span>
                </div>

                <button
                    onClick={isPoweredOn ? powerOffDevice : powerOnDevice}
                    className= {` ${isPoweredOn ? 
                                'w-full mb-4 py-2 bg-gray-500 text-whiter rounded-lg font-bold'
                                : 'w-full mb-4 py-2 bg-white text-whiter rounded-lg font-bold'} `} >

                     {isPoweredOn ? 'POWER OFF' : 'POWER ON'}
                </button>

                {isPoweredOn ? (
                    <> 
                    <div
                    className="rounded-xl bg-green-200 text-gray-900
                                p-4 min-h-105">
                    
                    <LoRaIncomingAlerts fleetId={fleetId}
                                        onAlertSignal={handleAlertSignal}
                                        onResponseChanged={handleResponseRefresh} />

                    <LoRaActiveResponse fleetId={fleetId}
                                        refreshKey={responseRefreshKey} />
                    </div>
                    </>
                ) : (
                    <div className="text-center mt-12">
                        DEVICE OFFLINE
                    </div>
                )}
                
                <div className="flex justify-center gap-4 mt-5">
                    <div className={`
                                w-4 h-4 rounded-full bg-red-500
                                ${isPoweredOn ? '' : 'opacity-20'}
                                ${isAlerting ? 'lora-blink' : ''}` } />
                    <div className={`w-4 h-4 rounded-full bg-yellow-400
                                    ${isPoweredOn ? '' : 'opacity-20'}
                                    ${isAlerting ? 'lora-blink' : ''}`}/>
                    <div className={`w-4 h-4 rounded-full bg-green-500
                                    ${isPoweredOn ? '' : 'opacity-20'}
                                    ${isAlerting ? 'lora-blink' : ''}`} />
                </div>
            </div>
        </main>
    );
}