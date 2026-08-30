'use client';

import { useEffect, useState } from 'react';
import { Siren, Bike, MapPin, SatelliteDish, MoveLeft, Smartphone } from 'lucide-react';
import dynamic from 'next/dynamic';

const FleetMap = dynamic(
  () => import('@/app/FleetMap'),
  { ssr: false }
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

  const [fleet, setFleet] = useState<FleetItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [emergencies, setEmergencies] =
    useState<Emergency[]>([]);

  const [
    selectedEmergencyId,
    setSelectedEmergencyId
  ] = useState<number | null>(null);

  const [candidates, setCandidates] =
    useState<FleetItem[]>([]);


  useEffect(() => {

    Promise.all([
      fetch(
        'http://localhost:3001/api/fleet/latest-locations'
      ).then((response) => response.json()),

      fetch(
        'http://localhost:3001/api/emergencies/active'
      ).then((response) => response.json())
    ])

    .then(([fleetData, emergencyData]) => {

      setFleet(fleetData);
      setEmergencies(emergencyData);
      setLoading(false);

    })

    .catch((error) => {

      console.error(
        'Failed to load dashboard:',
        error
      );

      setLoading(false);

    });

  }, []);


  async function handleEmergencySelect(id: number) {

    try {

      const response = await fetch(
        `http://localhost:3001/api/emergencies/${id}/candidates?radiusKm=5`
      );

      if (!response.ok) {
        throw new Error(
          'Failed to fetch candidates'
        );
      }

      const data = await response.json();

      console.log( 'Candidates returned:', data);

      setCandidates(Array.isArray(data) ? data : []);

      setSelectedEmergencyId(id);

    } catch (error) {
      console.error(error);
    }
  }


  function handleClearEmergencySelection() {
    setSelectedEmergencyId(null);
    setCandidates([]);
  }

  /*
   * Small statistics for dashboard.
   */
  const defibrillators =
    fleet.filter((item) => item.has_defi).length;

  const loraDevices = fleet.filter((item) => item.has_lora).length;

  const workingDefibrillators = fleet.filter((item) => 
    item.has_defi && item.is_working_defi).length;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 text-slate-900"
    >

      {/* Navigation */}

      <nav
        className=" sticky top-0 z-50 bg-slate-950 text-white
          border-b border-slate-800">

        <div
          className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <div className="font-bold text-xl">
            Defergency
          </div>

          <div
            className="hidden md:flex items-center gap-7 text-sm">

            <a href="#about" className="hover:text-red-400">
              איך זה עובד?
            </a>

            <a href="#lora" className="hover:text-red-400">
              מה זה LoRa?
            </a>

            <a href="#network" className="hover:text-red-400">
              הרשת
            </a>

            <a href="#fleet" className="hover:text-red-400">
              מכשירים
            </a>

          </div>

          <a href="#register" className=" bg-red-600 hover:bg-red-700 px-4 py-2
              rounded-lg font-bold text-sm">
            הצטרפו לרשת
          </a>
        </div>
      </nav>


      {/* hero */}

      <section
        className=" bg-slate-950 text-white py-24">

        <div className="max-w-7xl mx-auto px-6">

          <div className="max-w-3xl">

            <p className=" text-red-400 font-semibold mb-4">
              רשת קהילתית להצלת חיים
            </p>

            <h1
              className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              דפיברילטור קרוב
              <br />
              יכול לעשות את ההבדל
            </h1>

            <p className="text-lg md:text-xl text-slate-300
                leading-8 max-w-2xl mb-9">
              מערכת המחברת בין דפיברילטורים ניידים,
              מתנדבים ורשת LoRa כדי לאתר ציוד
              מציל חיים בקרבת אירוע חירום —
              גם באזורים בהם הקליטה הסלולרית מוגבלת.
            </p>

            <div className="flex flex-wrap gap-4">

              <a href="#register" className="bg-red-600 hover:bg-red-700
                      px-6 py-3 rounded-lg font-bold">
                הצטרפו למיזם
              </a>

              <a href="#network" className="border border-slate-600 hover:bg-white/10
                  px-6 py-3 rounded-lg font-bold">
                צפו ברשת
              </a>

            </div>

          </div>

        </div>

      </section>


      {/* How it works */}

      <section id="about" className="py-20">

        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center mb-12">

            <h2 className="text-3xl font-bold mb-3">
              איך זה עובד?
            </h2>

            <p className="text-slate-600">
              מהרגע שמתקבלת קריאת מצוקה ועד
              שמתנדב יוצא לדרך.
            </p>

          </div>

          <div
            className="grid md:grid-cols-4 gap-6">

            <div
              className=" bg-white rounded-2xl p-7 shadow-sm border
               border-slate-200">

              <div className="flex justify-center text-4xl mb-4">
                <Siren size={50} color="#dc2626" />
              </div>

              <h3 className="font-bold text-lg mb-2 text-center">
                קריאת מצוקה
              </h3>

              <p className="text-slate-600 text-center">
                מיקום אירוע החירום מתקבל
                במערכת.
              </p>

            </div>


            <div
              className=" bg-white rounded-2xl p-7 shadow-sm border
                border-slate-200">

              <div className="flex justify-center text-4xl mb-4">
                <MapPin color="#dc2626" size={50} />
              </div>

              <h3 className="font-bold text-lg mb-2 text-center">
                איתור ציוד קרוב
              </h3>

              <p className="text-slate-600 text-center">
                המערכת מאתרת באמצעות
                Geo-fencing את המכשירים
                הקרובים והתקינים.
              </p>

            </div>


            <div
              className=" bg-white rounded-2xl p-7
                shadow-sm border border-slate-200">

              <div className="flex justify-center text-4xl mb-4">
                <SatelliteDish size={50} color="#dc2626" />
              </div>

              <h3 className="font-bold text-lg mb-2 text-center">
                שליחת התראה
              </h3>

              <p className="text-slate-600 text-center">
                ההתראה מופצת דרך הסלולר
                ובמקביל באמצעות LoRa.
              </p>

            </div>

            <div
              className=" bg-white rounded-2xl p-7
                shadow-sm border border-slate-200">

              <div className="flex justify-center text-4xl mb-4">
                <Bike size={50} color="#dc2626"/>
              </div>

              <h3 className="font-bold text-lg mb-2 text-center">
                המתנדב יוצא לדרך
              </h3>

              <p className="text-slate-600 text-center">
                המתנדב מקבל ניווט מהיר
                לעבר האירוע.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* LoRa */}

      <section
        id="lora"
        className=" bg-slate-900 text-white py-20">

        <div className="max-w-7xl mx-auto
            px-6 grid md:grid-cols-2 gap-14 items-center">

        <div>

            <p className=" text-red-400 font-semibold mb-3">
              תקשורת גם מעבר לרשת הסלולרית
            </p>

            <h2 className=" text-3xl md:text-4xl font-bold
                mb-6 text-white ">
              מה זה LoRa?
            </h2>

            <p className=" text-slate-300 leading-8 text-lg">
              LoRa היא טכנולוגיית תקשורת
              ארוכת טווח וחסכונית באנרגיה.
              במסגרת המיזם היא מאפשרת
              למכשירים להעביר מיקום,
              מצב מכשיר והתראות חירום,
              גם כאשר התקשורת הסלולרית
              מוגבלת.
            </p>

            <p className=" text-slate-300 leading-8 text-lg mt-4 font-sans">
              באמצעות Meshtastic,
              מכשירי LoRa יכולים ליצור
              רשת Mesh שבה מכשירים
              מעבירים הודעות זה עבור זה
              ומרחיבים את טווח הרשת.
            </p>

          </div>


          <div
            className=" bg-slate-800 rounded-2xl p-8
              border border-slate-700">

            <div
              className="flex items-center justify-between gap-4">

              <div className="text-center">
                <div className="text-4xl">
                  <Siren size={35}/>
                </div>
                <p className="mt-2 text-sm">
                  אירוע
                </p>
              </div>

              <div className="text-slate-500 text-2xl">
                <MoveLeft />
              </div>

              <div className="text-center">
                <div className="text-4xl">
                  <SatelliteDish size={35} />
                </div>
                <p className="mt-2 text-sm">
                  LoRa
                </p>
              </div>

              <div className="text-slate-500 text-2xl">
                <MoveLeft />
              </div>

              <div className="text-center">
                <div className="text-4xl">
                  <Smartphone size={35}/>
                </div>
                <p className="mt-2 text-sm">
                  מתנדב
                </p>
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* Network */}

      <section id="network" className="py-20">

        <div className=" max-w-7xl mx-auto px-6">

          <div className="mb-8">

            <h2 className=" text-3xl font-bold mb-2">
              הרשת בזמן אמת
            </h2>

            <p className="text-slate-600">
              סימולציה של מיקום
              דפיברילטורים ואירועי
              חירום פעילים.
            </p>

          </div>


          {/* Statistics  */}

          <div className="grid md:grid-cols-4 gap-4 mb-8">

            <DashboardCard value={fleet.length}
              label="משתמשים ברשת"/>

            <DashboardCard value={defibrillators}
              label="דפיברילטורים"/>

            <DashboardCard value={workingDefibrillators}
              label="דפיברילטורים תקינים"/>

            <DashboardCard value={loraDevices}
              label="מכשירי LoRa"/>

          </div>


          {/* MAP */}

          <div
            className=" flex justify-center bg-white rounded-2xl shadow-sm border border-slate-200
              overflow-hidden p-4">

            {loading ? (

              <div className="h-125 flex items-center justify-center
                  text-slate-500">
                טוען את מפת הרשת...
              </div>

            ) : (

              <FleetMap key="fleet-map" fleet={fleet}
                emergencies={emergencies}
                selectedEmergencyId={
                  selectedEmergencyId
                }
                candidates={candidates}
                onEmergencySelect={
                  handleEmergencySelect
                }
                onClearEmergencySelection={
                  handleClearEmergencySelection
                }/>

            )}

          </div>

        </div>

      </section>


      {/* Fleet Table */}

      <section
        id="fleet"
        className=" bg-white py-20">

        <div
          className=" max-w-7xl mx-auto px-6">

          <div className="mb-8">

            <h2 className="text-3xl font-bold">
              סטטוס הרשת
            </h2>

            <p className="text-slate-600 mt-2">
              מצב המכשירים הרשומים
              בסימולטור.
            </p>

          </div>


          <div
            className="
              overflow-x-auto
              rounded-2xl
              border
              border-slate-200
            "
          >

            <table className="w-full text-sm">

              <thead className="bg-slate-100">

                <tr>

                  <th className="p-4 text-right">
                    בעלים
                  </th>

                  <th className="p-4 text-right">
                    דפיברילטור
                  </th>

                  <th className="p-4 text-right">
                    LoRa
                  </th>

                  <th className="p-4 text-right">
                    DevEUI
                  </th>

                  <th className="p-4 text-right">
                    סוללה
                  </th>

                  <th className="p-4 text-right">
                    סטטוס
                  </th>

                </tr>

              </thead>


              <tbody>

                {fleet.map((item) => (

                  <tr
                    key={item.id_fleet}
                    className="
                      border-t
                      border-slate-200
                      hover:bg-slate-50
                    "
                  >

                    <td className="p-4 font-medium">
                      {item.first_name}{' '}
                      {item.last_name}
                    </td>

                    <td className="p-4">
                      {item.has_defi
                        ? 'כן'
                        : 'לא'}
                    </td>

                    <td className="p-4">
                      {item.has_lora
                        ? 'כן'
                        : 'לא'}
                    </td>

                    <td
                      dir="ltr"
                      className="p-4 text-right"
                    >
                      {item.dev_EUI ?? '-'}
                    </td>

                    <td className="p-4">

                      {item.lora_battery !== null
                        ? `${item.lora_battery}%`
                        : '-'}

                    </td>

                    <td className="p-4">

                      {item.is_working_defi ? (

                        <span
                          className="
                            text-green-700
                            font-medium
                          "
                        >
                          תקין
                        </span>

                      ) : (

                        <span
                          className="
                            text-red-700
                            font-medium
                          "
                        >
                          לא זמין
                        </span>

                      )}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      </section>


      {/* join the project */}

      <section
        id="register"
        className="
          bg-red-700
          text-white
          py-20
        "
      >

        <div
          className="
            max-w-4xl
            mx-auto
            px-6
            text-center
          "
        >

          <h2
            className="
              text-3xl
              md:text-4xl
              font-bold
              mb-5
            "
          >
            רוצים לעזור להרחיב את הרשת?
          </h2>

          <p
            className="
              text-red-100
              text-lg
              leading-8
              mb-8
            "
          >
            בעלי דפיברילטורים,
            נשאי LoRa ומתנדבים יכולים
            להצטרף למיזם ולעזור להפוך
            ציוד מציל חיים לזמין יותר
            בזמן אמת.
          </p>

          <button
            className="
              bg-white
              text-red-700
              px-7 py-3
              rounded-lg
              font-bold
              hover:bg-red-50
            "
          >
            הרשמה למיזם
          </button>

        </div>

      </section>


      {/* Footer */}

      <footer
        className=" bg-slate-950 text-slate-400 py-8">

        <div
          className=" max-w-7xl mx-auto px-6 flex
            justify-between flex-wrap gap-4">

          <span>
            Defergency
          </span>

          <span>
            פרויקט גמר בקורס
            פיתוח WEB
          </span>

        </div>

      </footer>

    </main>
  );
}


/*
 * Reusable dashboard statistic card.
 */
function DashboardCard({
  value,
  label
}: {
  value: number;
  label: string;
}) {

  return (

    <div
      className="
        bg-white
        border
        border-slate-200
        rounded-xl
        p-5
      "
    >

      <div
        className="
          text-3xl
          font-bold
        "
      >
        {value}
      </div>

      <div
        className="
          text-slate-500
          mt-1
        "
      >
        {label}
      </div>

    </div>

  );
}