require('dotenv').config();

const express = require('express')
const cors = require('cors')
const db = require('./db');

const app = express();

// enable frontend to access numerous back ports
app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
    res.json({message: 'Backend is running'});
});

app.get('/api/fleet', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
            users.id_user,
            users.first_name,
            users.last_name,
            users.phone,
            fleet.id_fleet,
            fleet.has_defi,
            fleet.has_lora,
            fleet.dev_EUI,
            fleet.med_training,
            fleet.lora_battery,
            fleet.is_working_defi
            FROM users
            JOIN fleet
                ON users.id_user = fleet.id_fleet
            `);

        
        res.json(rows);
    } catch(error) {
        console.error(error);
        res.status(500).json({
            error: 'Database query failed'
        });
    }
    });

app.get('/api/fleet/latest-locations', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
            u.id_user,
            u.first_name,
            u.last_name,
            u.phone,
            f.id_fleet,
            f.has_defi,
            f.has_lora,
            f.dev_EUI,
            f.med_training,
            f.lora_battery,
            f.is_working_defi,
            l.latitude, 
            l.longitude,
            l.time_of_transmit
            FROM users u
            JOIN fleet f
                ON u.id_user = f.id_user
            LEFT JOIN (
                SELECT 
                id_fleet,
                latitude,
                longitude,
                time_of_transmit,
                id_location,
                ROW_NUMBER() OVER (
                    PARTITION BY id_fleet
                    ORDER BY time_of_transmit DESC, id_location DESC
                ) AS rn
                FROM locations
                ) l
                 ON f.id_fleet = l.id_fleet
                 AND l.rn = 1
            `);
        
        res.json(rows);
    }
        catch (error) {
            console.error(error);

            res.status(500).json( {
                error: 'Database query failed'
            });
        }
    
    });

    app.post('/api/emergencies', async (req, res) => {
        try {
            const {latitude, longitude} = req.body;

            if(latitude == null || longitude == null) {
                return res.status(400).json({
                    error:'latitude and longitude required',
                });
            }

            const[result] = await db.query(`
                INSERT INTO emergencies
                (latitude, longitude, status)
                VALUES(?, ?, 'OPEN') 
                `, [latitude, longitude]);

            res.status(201).json({
                id_emergency: result.insertId,
                latitude, 
                longitude,
                status:'OPEN'
            });

        } // try block

        catch (error) {
            console.error(error);

            res.status(500).json({
                error:'Failed to create emergency'
            });

        } // catch block

    });

    app.get('/api/emergencies', async (req, res) => {
        try {

            const[rows] = await db.query(`
                SELECT 
                id_emergency, 
                latitude,
                longitude,
                created_at,
                status
                FROM emergencies
                ORDER BY created_at DESC
                `);

                res.json(rows);
        }

        catch(error) {
            console.error(error);

            res.status(500).json({
                error:'Failed to fetch emergencies'
            });
        }
    });

const PORT = process.env.PORT || 3001;

// init express server
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
