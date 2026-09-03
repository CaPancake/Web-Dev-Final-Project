'use client';

import { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

import Link from 'next/link';

import { BatteryFull, BatteryMedium, BatteryLow, CircleCheckBig,
    CircleX, Radio, HeartPulse, MapPin,
    UserRound, Phone, GraduationCap, Smartphone,
    Pencil, LogOut, ExternalLink
} from 'lucide-react';

// TYPES 

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


const medicalTrainingLabels:
    Record<string, string> = {

    'First Aid': 'עזרה ראשונה',
    Medic: 'חובש/ת',
    Paramedic: 'פרמדיק/ית',
    Doctor: 'רופא/ה',
    NONE: 'ללא הכשרה',
    None: 'ללא הכשרה'
};


export default function MyDevicePage() {

    const params = useParams<{ fleetId: string }>();

    const fleetId = Number(params.fleetId);


    const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');

    /* Load participant + equipment information. */
    useEffect(() => {

        if (!fleetId) {
            setError('מזהה משתמש אינו תקין');
            setLoading(false);
            return;
        }


        async function loadDeviceInfo() {
            try {

                const token = localStorage.getItem('participantAccessToken');

                if(!token) {
                    window.location.href =  '/login';
                    return;
                }

                const response = await fetch(
                `http://localhost:3001/api/fleet/${fleetId}/device-info`, 
                {
                    headers: { Authorization: 
                        `Bearer ${token}`
                    }

                });

                const data = await response.json();

                if (!response.ok) {

                    throw new Error(data.error ||'Failed to load participant information');
                }

                setDeviceInfo(data);

            } catch (error) {

                console.error('Failed to load participant:',error);

                if (error instanceof Error) {
                    setError(error.message);
                } else {
                    setError('אירעה שגיאה בטעינת החשבון');
                }
            } finally {
                setLoading(false);
            }
        }
        loadDeviceInfo();

    }, [fleetId]);

    useEffect(() => {

    async function loadParticipant() {

        try {

            const token =localStorage.getItem('participantAccessToken');

            if (!token) {

                window.location.href ='/login';
                return;
            }

            const response =await fetch('http://localhost:3001/api/participant/me',
            {
                headers: {
                            Authorization:
                            `Bearer ${token}`
                }
            }
            );

            if (response.status === 401) {

                localStorage.removeItem('participantAccessToken');
                window.location.href ='/login';
                return;
            }


            const data = await response.json();

            if (!response.ok) {

                throw new Error(data.error ||'Failed to load participant');}

            setDeviceInfo(data);

        } catch (error) {

            console.error('Failed to load participant:',error);

            if (error instanceof Error) {
                setError(error.message);

            } else {
                setError('אירעה שגיאה בטעינת החשבון');
            }

        } finally {
            setLoading(false);
        }
    }
    loadParticipant();
}, []);

function handleLogout() {
    localStorage.removeItem('participantAccessToken');
    window.location.href = '/login';
}

    if (loading) {

        return (

            <main dir="rtl" className=" min-h-screen
             bg-slate-100 flex
            items-center justify-center">

                <p className="text-slate-500">
                    טוען את החשבון...
                </p>

            </main>
        );}

    if (error || !deviceInfo) {

        return (
            <main dir="rtl" className="
            min-h-screen bg-slate-100 flex
            items-center justify-center
            px-6">

            <div className="bg-white border border-red-200
            rounded-2xl p-8 max-w-lg text-center">

                <CircleX className="mx-auto mb-4 text-red-600"
                        size={50}/>

                <h1 className="text-2xl font-bold mb-2">
                        לא ניתן לטעון את החשבון
                    </h1>

                    <p className=" text-slate-600 mb-6">
                        {
                            error ||
                            'המשתמש לא נמצא'
                        }
                    </p>

                    <Link
                        href="/login"
                        className="
                            text-red-600
                            font-bold
                            hover:text-red-700
                        "
                    >
                        חזרה לכניסה
                    </Link>

                </div>

            </main>
        );
    }


    const fullName =
        [
            deviceInfo.first_name,
            deviceInfo.last_name
        ]
            .filter(Boolean)
            .join(' ');


    const medicalTraining =
        deviceInfo.med_training
            ? (
                medicalTrainingLabels[
                    deviceInfo.med_training
                ] ??
                deviceInfo.med_training
            )
            : 'לא צוינה';


    return (

        <main
            dir="rtl"
            className="
                min-h-screen
                bg-slate-100
                py-12
                px-6
            "
        >

            <div
                className="
                    max-w-6xl
                    mx-auto
                "
            >

                {/* HEADER */}

                <header
                    className="
                        flex
                        flex-col
                        md:flex-row
                        md:items-center
                        md:justify-between
                        gap-5
                        mb-10
                    "
                >

                    <div>

                        <p
                            className="
                                text-red-600
                                font-semibold
                                mb-2
                            "
                        >
                            האזור האישי
                        </p>


                        <h1
                            className="
                                text-3xl
                                md:text-4xl
                                font-bold
                            "
                        >
                            שלום
                            {
                                deviceInfo.first_name
                                    ? `, ${deviceInfo.first_name}`
                                    : ''
                            }
                        </h1>


                        <p
                            className="
                                text-slate-500
                                mt-2
                            "
                        >
                            כאן ניתן לצפות בפרטים
                            ובציוד המשויך לחשבון.
                        </p>

                    </div>


                    <div
                        className="flex flex-wrap gap-3">

                        <Link
                            href="/"
                            className="
                                border
                                border-slate-300
                                bg-white
                                hover:bg-slate-50
                                rounded-lg
                                px-4
                                py-2
                                font-medium
                            "
                        >
                            דף הבית
                        </Link>

                    
                        <button onClick={handleLogout} 
                        className="flex items-center gap-2 
                        bg-slate-900 hover:bg-slate-800
                        text-white rounded-lg px-4 py-2 fond-medium">

                            <LogOut size={18}/>

                            יציאה

                        </button>

                    </div>

                </header>



                {/* PERSONAL DETAILS */}

                <section
                    className="
                        bg-white
                        border
                        border-slate-200
                        rounded-2xl
                        shadow-sm
                        p-7
                        mb-8
                    "
                >

                    <div
                        className="
                            flex
                            items-center
                            justify-between
                            gap-4
                            mb-6
                        "
                    >

                        <div
                            className="
                                flex
                                items-center
                                gap-3
                            "
                        >

                            <UserRound
                                size={30}
                                className="text-red-600"
                            />


                            <h2
                                className="
                                    text-2xl
                                    font-bold
                                "
                            >
                                פרטים אישיים
                            </h2>

                        </div>


                        <button
                            disabled
                            title="יתווסף לאחר חיבור אימות המשתמש"
                            className="
                                flex
                                items-center
                                gap-2
                                border
                                border-slate-300
                                rounded-lg
                                px-4
                                py-2
                                text-slate-400
                                cursor-not-allowed
                            "
                        >

                            <Pencil size={17}/>

                            עריכת פרטים

                        </button>

                    </div>


                    <div
                        className="
                            grid
                            md:grid-cols-3
                            gap-4
                        "
                    >

                        <InfoCard
                            icon={
                                <UserRound
                                    size={21}
                                />
                            }
                            label="שם"
                            value={
                                fullName ||
                                'לא צוין'
                            }
                        />


                        <InfoCard
                            icon={
                                <Phone
                                    size={21}
                                />
                            }
                            label="טלפון"
                            value={
                                deviceInfo.phone ||
                                'לא צוין'
                            }
                        />


                        <InfoCard
                            icon={
                                <GraduationCap
                                    size={21}
                                />
                            }
                            label="הכשרה רפואית"
                            value={
                                medicalTraining
                            }
                        />

                    </div>

                </section>



                {/* EQUIPMENT */}

                <div
                    className="
                        grid
                        lg:grid-cols-2
                        gap-6
                        mb-8
                    "
                >

                    {/* DEFIBRILLATOR */}

                    <section
                        className="
                            bg-white
                            border
                            border-slate-200
                            rounded-2xl
                            shadow-sm
                            p-7
                        "
                    >

                        <div
                            className="
                                flex
                                items-center
                                justify-between
                                mb-6
                            "
                        >

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-3
                                "
                            >

                                <HeartPulse
                                    size={34}
                                    className="text-red-600"
                                />

                                <h2
                                    className="
                                        text-2xl
                                        font-bold
                                    "
                                >
                                    דפיברילטור נייד
                                </h2>

                            </div>


                            <StatusBadge
                                active={
                                    Boolean(
                                        deviceInfo.has_defi
                                    )
                                }
                                activeText="רשום"
                                inactiveText="לא משויך"
                            />

                        </div>


                        {deviceInfo.has_defi ? (

                            <>
                                <DetailRow
                                    label="מצב הדפיברילטור"
                                    value={
                                        deviceInfo.is_working_defi
                                            ? 'תקין'
                                            : 'לא זמין'
                                    }
                                    success={
                                        Boolean(
                                            deviceInfo.is_working_defi
                                        )
                                    }
                                />


                                <div
                                    className="
                                        mt-6
                                        flex
                                        flex-wrap
                                        gap-3
                                    "
                                >

                                    <button
                                        disabled
                                        title="יתווסף לאחר חיבור JWT למשתמש"
                                        className="
                                            bg-slate-100
                                            text-slate-400
                                            px-4
                                            py-2
                                            rounded-lg
                                            font-medium
                                            cursor-not-allowed
                                        "
                                    >
                                        {
                                            deviceInfo.is_working_defi
                                                ? 'דיווח על תקלה'
                                                : 'סימון כתקין'
                                        }
                                    </button>

                                </div>
                            </>

                        ) : (

                            <div>

                                <p
                                    className="
                                        text-slate-500
                                        mb-5
                                    "
                                >
                                    לחשבון זה לא משויך
                                    דפיברילטור נייד.
                                </p>


                                <button
                                    disabled
                                    className="
                                        bg-slate-100
                                        text-slate-400
                                        px-4
                                        py-2
                                        rounded-lg
                                        cursor-not-allowed
                                    "
                                >
                                    הוספת דפיברילטור
                                </button>

                            </div>
                        )}

                    </section>



                    {/* LORA */}

                    <section
                        className="
                            bg-slate-950
                            text-white
                            rounded-2xl
                            shadow-sm
                            p-7
                        "
                    >

                        <div
                            className="
                                flex
                                items-center
                                justify-between
                                mb-6
                            "
                        >

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-3
                                "
                            >

                                <Radio
                                    size={34}
                                    className="text-red-400"
                                />

                                <h2
                                    className="
                                        text-2xl
                                        font-bold
                                    "
                                >
                                    מכשיר LoRa
                                </h2>

                            </div>


                            <StatusBadge
                                active={
                                    Boolean(
                                        deviceInfo.has_lora
                                    )
                                }
                                activeText="רשום"
                                inactiveText="לא משויך"
                                dark
                            />

                        </div>


                        {deviceInfo.has_lora ? (

                            <div>

                                <DarkDetailRow
                                    label="DevEUI"
                                    value={
                                        deviceInfo.dev_EUI ||
                                        '-'
                                    }
                                    mono
                                />


                                <DarkDetailRow
                                    label="סוללה"
                                    valueComponent={
                                        <BatteryStatus
                                            battery={
                                                deviceInfo.lora_battery
                                            }
                                        />
                                    }
                                />


                                <DarkDetailRow
                                    label="שידור אחרון"
                                    value={
                                        deviceInfo.time_of_transmit ||
                                        'טרם התקבל'
                                    }
                                />


                                <div
                                    className="
                                        mt-6
                                        flex
                                        flex-wrap
                                        gap-3
                                    "
                                >

                                    <button
                                        disabled
                                        title="יתווסף לאחר חיבור JWT למשתמש"
                                        className="
                                            bg-slate-800
                                            text-slate-500
                                            px-4
                                            py-2
                                            rounded-lg
                                            cursor-not-allowed
                                        "
                                    >
                                        ניהול מכשיר LoRa
                                    </button>


                                    <Link
                                        href={
                                            `/device/lora/${fleetId}`
                                        }
                                        className="
                                            flex
                                            items-center
                                            gap-2
                                            border
                                            border-slate-600
                                            hover:bg-slate-800
                                            px-4
                                            py-2
                                            rounded-lg
                                            font-medium
                                        "
                                    >

                                        <ExternalLink
                                            size={17}
                                        />

                                        פתיחת סימולטור LoRa

                                    </Link>

                                </div>

                            </div>

                        ) : (

                            <div>

                                <p
                                    className="
                                        text-slate-400
                                        mb-5
                                    "
                                >
                                    לחשבון זה לא משויך
                                    מכשיר LoRa.
                                </p>


                                <button
                                    disabled
                                    className="
                                        bg-slate-800
                                        text-slate-500
                                        px-4
                                        py-2
                                        rounded-lg
                                        cursor-not-allowed
                                    "
                                >
                                    הוספת מכשיר LoRa
                                </button>

                            </div>
                        )}

                    </section>

                </div>



                {/* LAST LOCATION */}

                {deviceInfo.has_lora && (

                    <section
                        className="
                            bg-white
                            border
                            border-slate-200
                            rounded-2xl
                            p-7
                            mb-8
                        "
                    >

                        <div
                            className="
                                flex
                                items-center
                                gap-3
                                mb-5
                            "
                        >

                            <MapPin
                                className="text-red-600"
                                size={30}
                            />

                            <h2
                                className="
                                    text-2xl
                                    font-bold
                                "
                            >
                                נתוני מכשיר אחרונים
                            </h2>

                        </div>


                        <div
                            className="
                                grid
                                md:grid-cols-3
                                gap-4
                            "
                        >

                            <InfoCard
                                label="Latitude"
                                value={
                                    deviceInfo.latitude !== null &&
                                    deviceInfo.latitude !== undefined
                                        ? String(
                                            deviceInfo.latitude
                                        )
                                        : 'לא התקבל'
                                }
                            />


                            <InfoCard
                                label="Longitude"
                                value={
                                    deviceInfo.longitude !== null &&
                                    deviceInfo.longitude !== undefined
                                        ? String(
                                            deviceInfo.longitude
                                        )
                                        : 'לא התקבל'
                                }
                            />


                            <InfoCard
                                label="שידור אחרון"
                                value={
                                    deviceInfo.time_of_transmit ||
                                    'טרם התקבל'
                                }
                            />

                        </div>

                    </section>
                )}



                {/* SIMULATORS */}

                <section
                    className="
                        bg-white
                        border
                        border-slate-200
                        rounded-2xl
                        p-7
                    "
                >

                    <div
                        className="
                            flex
                            items-center
                            gap-3
                            mb-3
                        "
                    >

                        <Smartphone
                            size={30}
                            className="text-red-600"
                        />


                        <h2
                            className="
                                text-2xl
                                font-bold
                            "
                        >
                            סימולטורים
                        </h2>

                    </div>


                    <p
                        className="
                            text-slate-600
                            mb-6
                        "
                    >
                        לצורך הדגמת המערכת ניתן
                        לפתוח את ממשק האפליקציה
                        והמכשיר המשויכים למשתמש.
                    </p>


                    <div
                        className="
                            flex
                            flex-wrap
                            gap-3
                        "
                    >

                        <Link
                            href={
                                `/device/${fleetId}`
                            }
                            className="
                                bg-red-600
                                hover:bg-red-700
                                text-white
                                rounded-lg
                                px-5
                                py-3
                                font-bold
                            "
                        >
                            פתיחת אפליקציית המתנדב
                        </Link>


                        {deviceInfo.has_lora && (

                            <Link
                                href={
                                    `/device/lora/${fleetId}`
                                }
                                className="
                                    bg-slate-900
                                    hover:bg-slate-800
                                    text-white
                                    rounded-lg
                                    px-5
                                    py-3
                                    font-bold
                                "
                            >
                                פתיחת מכשיר LoRa
                            </Link>
                        )}

                    </div>

                </section>

            </div>

        </main>
    );
}



/* -------------------------------- */
/* UI HELPERS                       */
/* -------------------------------- */


function InfoCard({
    icon,
    label,
    value
}: {
    icon?: React.ReactNode;
    label: string;
    value: string;
}) {

    return (

        <div
            className="
                bg-slate-50
                rounded-xl
                p-4
            "
        >

            <div
                className="
                    flex
                    items-center
                    gap-2
                    text-slate-500
                    text-sm
                    mb-2
                "
            >
                {icon}

                {label}
            </div>


            <div className="font-medium">
                {value}
            </div>

        </div>
    );
}



function StatusBadge({
    active,
    activeText,
    inactiveText,
    dark = false
}: {
    active: boolean;
    activeText: string;
    inactiveText: string;
    dark?: boolean;
}) {

    return (

        <span
            className={
                active

                    ? (
                        dark
                            ? `
                                bg-green-900
                                text-green-300
                                px-3
                                py-1
                                rounded-full
                                text-sm
                                font-bold
                              `
                            : `
                                bg-green-100
                                text-green-800
                                px-3
                                py-1
                                rounded-full
                                text-sm
                                font-bold
                              `
                    )

                    : (
                        dark
                            ? `
                                bg-slate-800
                                text-slate-400
                                px-3
                                py-1
                                rounded-full
                                text-sm
                                font-bold
                              `
                            : `
                                bg-slate-100
                                text-slate-500
                                px-3
                                py-1
                                rounded-full
                                text-sm
                                font-bold
                              `
                    )
            }
        >
            {
                active
                    ? activeText
                    : inactiveText
            }
        </span>
    );
}



function DetailRow({
    label,
    value,
    success
}: {
    label: string;
    value: string;
    success?: boolean;
}) {

    return (

        <div
            className="
                flex
                items-center
                justify-between
                border-t
                border-slate-100
                py-3
            "
        >

            <span className="text-slate-600">
                {label}
            </span>


            <span
                className={
                    success === undefined
                        ? 'font-medium'
                        : success
                            ? 'font-bold text-green-700'
                            : 'font-bold text-red-700'
                }
            >
                {value}
            </span>

        </div>
    );
}



function DarkDetailRow({
    label,
    value,
    valueComponent,
    mono = false
}: {
    label: string;
    value?: string;
    valueComponent?: React.ReactNode;
    mono?: boolean;
}) {

    return (

        <div
            className="
                flex
                items-center
                justify-between
                gap-4
                border-t
                border-slate-800
                py-3
            "
        >

            <span className="text-slate-400">
                {label}
            </span>


            {
                valueComponent ?? (

                    <span
                        dir={
                            mono
                                ? 'ltr'
                                : undefined
                        }
                        className={
                            mono
                                ? 'font-mono text-sm'
                                : ''
                        }
                    >
                        {value}
                    </span>
                )
            }

        </div>
    );
}



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
                className="
                    flex
                    items-center
                    gap-2
                    text-red-400
                    font-bold
                "
            >

                <span>
                    {battery}%
                </span>

                <BatteryLow size={22}/>

            </div>
        );
    }


    if (battery <= 60) {

        return (

            <div
                className="
                    flex
                    items-center
                    gap-2
                "
            >

                <span>
                    {battery}%
                </span>

                <BatteryMedium size={22}/>

            </div>
        );
    }


    return (

        <div
            className="
                flex
                items-center
                gap-2
            "
        >

            <span>
                {battery}%
            </span>

            <BatteryFull size={22}/>

        </div>
    );
}