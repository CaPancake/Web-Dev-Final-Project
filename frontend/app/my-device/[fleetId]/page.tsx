'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import { BatteryFull, BatteryMedium, BatteryLow, CircleCheckBig, CircleX,
  Radio, HeartPulse, MapPin, Clock3 } from 'lucide-react';

type DeviceInfo = {
  id_fleet: number;
  first_name?: string;
  last_name?: string;
  phone?: string;

  has_defi: number;
  has_lora: number;

  dev_EUI: string | null;
  med_training?: string | null;

  lora_battery: number | null;
  is_working_defi: number;

  latitude?: number | null;
  longitude?: number | null;
  time_of_transmit?: string | null;
};


export default function MyDevicePage() {

  const params = useParams<{ fleetId: string }>();

  const fleetId = Number(params.fleetId);

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  const [loading, setLoading] =useState(true);

  const [error, setError] = useState('');

  const [testingConnection, setTestingConnection] = useState(false);

  const[connectionMessage, setConnectionMessage] = useState('');

  useEffect(() => {

    async function loadDeviceInfo() {

      try {

        const response = await fetch(
          `http://localhost:3001/api/fleet/${fleetId}/device-info`);

        const data = await response.json();

        if (!response.ok) {
          throw new Error( data.error || 'Failed to load device information');
        }

        setDeviceInfo(data);

      } catch (error) {

        console.error('Failed to load device:',error);

        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('אירעה שגיאה בטעינת המכשיר');
        }

      } finally {
        setLoading(false);
      }

    }


    if (fleetId) {
      loadDeviceInfo();
    } 
    }, [fleetId]);

  if (loading) {

    return (
      <main dir="rtl" className=" min-h-screen bg-slate-100 flex
          items-center justify-center">
        <p className="text-slate-500">
          טוען את פרטי המכשיר...
        </p>
      </main>
    );

  }


  if (error || !deviceInfo) {

    return (
    <main dir="rtl" className=" min-h-screen bg-slate-100 flex
          items-center justify-center px-6">
        <div
          className=" bg-white border border-red-200 rounded-2xl
            p-8 max-w-lg text-center">

          <CircleX className="mx-auto mb-4 text-red-600" size={50} />

          <h1 className="text-2xl font-bold mb-2">
            לא ניתן לטעון את המכשיר
          </h1>

          <p className="text-slate-600 mb-6">
            {error}
          </p>

          <Link href="/login"
            className=" text-red-600 font-bold hover:text-red-700">
            חזרה לכניסה
          </Link>

        </div>
      </main>
    );

  }

  const hasRecentTransmission =
    deviceInfo.time_of_transmit !== null &&
    deviceInfo.time_of_transmit !== undefined;

  const hasGps =
    deviceInfo.latitude !== null &&
    deviceInfo.latitude !== undefined &&
    deviceInfo.longitude !== null &&
    deviceInfo.longitude !== undefined;

    async function loadDeviceInfo() {
        try {
            const response = await fetch(`
                http://localhost:3001/api/fleet/${fleetId}/device-info`);

            const data = await response.json();

            if(!response.ok) {
                throw new Error(data.error ||
                    'Failed to load device information'
                );
            }

            setDeviceInfo(data);
        }
        catch(error) {

            console.error('Failed to load device:', error);

            if(error instanceof Error){
                setError(error.message);
            }
            else {
                setError(`אירעה שגיאה בטעינת מכשיר`);
            }
        }
    }
    
    useEffect(() => {
        if(!fleetId) {
            return;
        }

        loadDeviceInfo().finally(() => setLoading(false));
    }, [fleetId]);

    async function testLoRaConnection() {

        if(!deviceInfo?.has_lora) {
            return;
        }

        setTestingConnection(true);
        setConnectionMessage('');

        try {
            const latitude = deviceInfo.latitude ?? 32.0853;
            const longitude = deviceInfo.longitude ?? 34.7818;
            const battery = deviceInfo.lora_battery ?? 85;

            const response = await fetch(`
                http://localhost:3001/api/fleet/${fleetId}/heartbeat`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    battery, latitude, longitude
                })
            });

            const data = await response.json();

            if(!response.ok) {
                throw new Error(data.error || 'LoRa connection test failed');
            }

            await loadDeviceInfo();

            setConnectionMessage('✓ התקבל שידור LoRa בהצלחה')

        }
        catch(error) {
            console.error('LoRa connection test failed', error);
        

        if (error instanceof Error) {
            setConnectionMessage(`בדיקת החיבור נכשלה: ${error.message}`);
        }
        else {
            setConnectionMessage('בדיקת החיבור נכשלה');
        }   
    }
    finally {
            setTestingConnection(false);
    }
}

  return (

    <main dir="rtl" className="min-h-screen bg-slate-100 py-12 px-6">

      <div className="max-w-6xl mx-auto">

        {/* HEADER*/}

        <div
          className=" flex flex-col md:flex-row
            md:items-center md:justify-between gap-4 mb-10">

          <div>

            <p
              className=" text-red-600 font-semibold mb-2">
              ניהול המכשיר
            </p>

            <h1
              className=" text-3xl md:text-4xl font-bold">
              שלום,
              {deviceInfo.first_name
                ? ` ${deviceInfo.first_name}`
                : ''}
            </h1>

            <p className="text-slate-500 mt-2">
              מזהה מתנדב: #{deviceInfo.id_fleet}
            </p>

          </div>


          <Link href="/"
            className=" border border-slate-300 bg-white hover:bg-slate-50
              rounded-lg px-4 py-2 font-medium self-start">
            חזרה לדף הבית
          </Link>

        </div>



        {/* SUMMARY CARDS */}

        <div
          className=" grid md:grid-cols-2 gap-6 mb-8">

          {/* DEFIBRILLATOR */}

          <div
            className=" bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">

            <div
              className=" flex items-center justify-between mb-5" >

              <div className=" flex items-center gap-3">

                <HeartPulse size={34} className="text-red-600"/>

                <h2 className="text-2xl font-bold">
                  דפיברילטור
                </h2>

              </div>

              {deviceInfo.has_defi ? (

                <span
                  className=" bg-green-100 text-green-800 px-3
                    py-1 rounded-full text-sm font-bold">
                  רשום
                </span>

              ) : (

                <span
                  className=" bg-slate-100 text-slate-500 px-3
                    py-1 rounded-full text-sm font-bold">
                  לא קיים
                </span>

              )}

            </div>

            {deviceInfo.has_defi ? (

              <div>
                <div
                  className=" flex items-center justify-between
                    border-t border-slate-100 py-3">

                  <span className="text-slate-600">
                    מצב המכשיר
                  </span>

                  <span
                    className={
                      deviceInfo.is_working_defi
                        ? 'text-green-700 font-bold'
                        : 'text-red-700 font-bold'
                    }>
                    {deviceInfo.is_working_defi
                      ? 'תקין'
                      : 'לא זמין'}
                  </span>

                </div>


                {deviceInfo.med_training && (

                  <div
                    className="flex items-center justify-between
                      border-t border-slate-100 py-3">

                    <span className="text-slate-600">
                      הכשרה רפואית
                    </span>

                    <span className="font-medium">
                      {deviceInfo.med_training}
                    </span>

                  </div>

                )}

              </div>

            ) : (

              <p className="text-slate-500">
                לחשבון זה לא משויך דפיברילטור.
              </p>

            )}

          </div>



          {/* LORA */}

          <div
            className=" bg-slate-950 text-white
              rounded-2xl p-7 shadow-sm">

            <div
              className=" flex items-center
                justify-between mb-5">

              <div className=" flex items-center gap-3">

                <Radio size={34} className="text-red-400"/>

                <h2 className="text-2xl font-bold">
                  LoRa
                </h2>

              </div>

              {deviceInfo.has_lora ? (

                <span
                  className=" bg-green-900 text-green-300 px-3
                    py-1 rounded-full text-sm font-bold">
                  רשום
                </span>
              ) : (

                <span
                  className=" bg-slate-800 text-slate-400 px-3
                    py-1 rounded-full text-sm font-bold " >
                  לא קיים
                </span>

              )}

            </div>

            {deviceInfo.has_lora ? (

              <div className="space-y-1">

                <div
                  className=" flex items-center justify-between border-t
                    border-slate-800 py-3">

                  <span className="text-slate-400">
                    DevEUI
                  </span>

                  <span dir="ltr"
                    className=" font-mono text-sm">
                    {deviceInfo.dev_EUI ?? '-'}
                  </span>

                </div>

                <div
                  className="flex items-center justify-between border-t
                    border-slate-800 py-3">

                  <span className="text-slate-400">
                    סוללה
                  </span>

                  <BatteryStatus battery={ deviceInfo.lora_battery}/>

                </div>

                <div
                  className=" flex items-center justify-between border-t
                    border-slate-800 py-3">

                  <span className="text-slate-400">
                    שידור אחרון
                  </span>

                  <span>
                    {deviceInfo.time_of_transmit
                      ?? 'טרם התקבל'}
                  </span>

                </div>

              </div>

            ) : (

              <p className="text-slate-400">
                לחשבון זה לא משויך מכשיר LoRa.
              </p>

            )}

            {deviceInfo.has_lora && (
                <div className="mt-6">

                 <button
                 onClick={testLoRaConnection}
                    disabled={testingConnection}
                className="
                    bg-red-600
                   hover:bg-red-700
                 disabled:bg-slate-400
                  text-white
                   px-5 py-3
                   rounded-lg
                  font-bold">
            {testingConnection
              ? 'בודק חיבור...'
              : 'בדיקת חיבור LoRa'}
                 </button>


             {connectionMessage && (
          <p className="mt-3 text-sm font-medium">
               {connectionMessage}
              </p>
              )}

             </div>
            )}

          </div>

        </div>



        {/* LOCATION  */}

        {deviceInfo.has_lora && (

          <div className=" bg-white border border-slate-200 rounded-2xl
              p-7 mb-8" >

            <div
             className=" flex items-center gap-3 mb-5">

              <MapPin className="text-red-600" size={30}/>

              <h2 className="text-2xl font-bold">
                מיקום אחרון
              </h2>

            </div>

            {hasGps ? (

              <div
                className=" grid md:grid-cols-2 gap-4">

                <div
                  className=" bg-slate-50 rounded-lg p-4">
                  <span className="text-slate-500">
                    Latitude
                  </span>

                  <div
                    dir="ltr"
                    className="font-mono mt-1"
                  >
                    {deviceInfo.latitude}
                  </div>
                </div>

                <div
                  className=" bg-slate-50 rounded-lg p-4">
                  <span className="text-slate-500">
                    Longitude
                  </span>

                  <div
                    dir="ltr" className="font-mono mt-1">
                    {deviceInfo.longitude}
                  </div>
                </div>

              </div>

            ) : (

              <p className="text-slate-500">
                טרם התקבל מיקום מהמכשיר.
              </p>

            )}

          </div>

        )}

        {/*  SETUP CHECKLIST  */}

        <div
          className=" bg-white border border-slate-200
            rounded-2xl p-7">

          <h2 className="text-2xl font-bold mb-2">
            מצב הגדרת המכשיר
          </h2>

          <p
            className=" text-slate-600 mb-6">
            כאן ניתן לוודא שהמכשיר נרשם
            ומעביר מידע למערכת בצורה תקינה.
          </p>


          <div className="space-y-4">

            <SetupItem
              success={true}
              title="המשתמש רשום במערכת"
            />


            {deviceInfo.has_lora ? (
              <>
                <SetupItem
                  success={
                    deviceInfo.dev_EUI !== null
                  }
                  title="מזהה DevEUI מוגדר"
                />

                <SetupItem
                  success={
                    hasRecentTransmission
                  }
                  title="התקבל שידור מהמכשיר"
                />

                <SetupItem
                  success={hasGps}
                  title="התקבל מיקום GPS"
                />

                <SetupItem
                  success={
                    deviceInfo.lora_battery !== null
                  }
                  title="התקבל מצב סוללה"
                />
              </>
            ) : (
              <SetupItem
                success={true}
                title="לא נדרש חיבור LoRa"
              />
            )}

          </div>

        </div>


      </div>

    </main>

  );

}



/*  Battery display */

function BatteryStatus({
  battery
}: {
  battery: number | null;
}) {

  if (battery === null) {

    return (
      <span className="text-slate-400">
        לא התקבל
      </span>
    );

  }


  if (battery <= 20) {

    return (
      <div
        className=" flex items-center gap-2 text-red-400 font-bold">
        <span>{battery}%</span>
        <BatteryLow size={22} />
      </div>
    );

  }

  if (battery <= 60) {

    return (
      <div className=" flex items-center  gap-2">
        <span>{battery}%</span>
        <BatteryMedium size={22} />
      </div>
    );

  }

  return (
    <div className=" flex items-center gap-2">
      <span>{battery}%</span>
      <BatteryFull size={22} />
    </div>
  );

}


/* Setup checklist item */

function SetupItem({
  success,
  title
}: {
  success: boolean;
  title: string;
}) {

  return (

    <div
      className=" flex items-center gap-3 bg-slate-50
        rounded-lg px-4 py-3">

      {success ? (

        <CircleCheckBig className="text-green-600" size={22}/>
      ) : (
        <Clock3
          className="text-amber-600"
          size={22}
        />
      )}

      <span
        className={
          success
            ? 'font-medium'
            : 'text-slate-600'
        }
      >
        {title}
      </span>

    </div>

  );

}