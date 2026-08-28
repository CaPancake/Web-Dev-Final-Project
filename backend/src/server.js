require('dotenv').config();

const express = require('express')
const cors = require('cors')
const db = require('./db');

const { findCandidates } = require('./services/candidateService');

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

    app.post('/api/fleet/:id/location', async(req, res) => {
        try {
            const fleetId = Number(req.params.id);
            const {
                latitude,
                longitude
            } = req.body;

            if(
                latitude === undefined ||
                longitude === undefined
            ) {
                return res.status(400).json({
                    error:'latitude and longitude are required'
                });
            }

            const [result] = await db.query(`
                INSERT INTO locations (
                id_fleet,
                latitude,
                longitude,
                time_of_transmit
                )
                VALUES(?, ?, ?, NOW())
                `, [fleetId, latitude, longitude]);

            res.status(201).json({
                id_location: result.insertId,
                id_fleet: fleetId,
                latitude,
                longitude
            });
        } // try block

        catch (error) {
            console.error(error);
            res.status(500).json({
                error:'Failed to update fleet location'
            });
        } // catch block
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

    app.get('/api/emergencies/:id/candidates', async(req, res) => {

        try {
            const radiusKm = Number(req.query.radiusKm ?? 5);
        const candidates = await findCandidates(
            req.params.id,
            radiusKm
        );

        res.json(candidates);
        }

        catch (error){
            console.error(error);
            res.statusMessage(500).json({
                error:'Failed to fetch relevant candidates'
            });
        }
    });

app.get('/api/emergencies/active', async (req, res) => {

    try {
        const [rows] = await db.query(`
            SELECT
            id_emergency, 
            latitude, 
            longitude,
            created_at, 
            status
            FROM emergencies
            WHERE STATUS IN(
            'OPEN',
            'SEARCHING',
            'RESPONDER_FOUND',
            'EN_ROUTE')
            ORDER BY created_at DESC
            `)

            res.json(rows);
    } // try block

    catch(error) {

        console.error(error);
        res.status(500).json({
            error:'Failed to fetch active emergencies'
        });
    } //catch block
});

app.post('/api/emergencies/:id/notify', async (req, res) => {
    try{
        const emergencyId = Number(req.params.id);
        const radiusKm = Number(req.body.radiusKm ?? 5);

        const candidates = await findCandidates(
            emergencyId,
            radiusKm
        );

        for(const candidate of candidates) {
            await db.query(`
                INSERT INTO emergency_candidates (
                id_emergency,
                id_fleet,
                distance_km,
                notification_status,
                response_status,
                notified_at
            )
                VALUES(?, ?, ?, 'SENT', 'WAITING', NOW())
            ON DUPLICATE KEY UPDATE
                distance_km = VALUES(distance_km),
                notification_status = 'SENT',
                notified_at = NOW()
                `, [
                    emergencyId,
                    candidate.id_fleet,
                    candidate.distanceKm
                ]);
        }

        res.json({
            id_emergency: emergencyId,
            notified_count: candidates.length,
            candidates
        });
    } // try block
    catch(error) {

        console.error(error);
        res.status(500).json({
            error:'Failed to notify candidates'
        });

    } // catch block
});

app.get('/api/fleet/:id/notifications', async (req, res) => {
    try {
        const fleetId = Number(req.params.id);

        const[rows] = await db.query(`
            SELECT 
                ec.id_candidate,
                ec.id_emergency,
                ec.id_fleet,
                ec.distance_km,
                ec.notification_status,
                ec.response_status,
                ec.notified_at,
                e.latitude,
                e.longitude,
                e.created_at,
                e.status AS emergency_status
             FROM emergency_candidates ec
             JOIN emergencies e
                ON ec.id_emergency = e.id_emergency
            WHERE ec.id_fleet = ? 
              AND ec.response_status = 'WAITING'
              AND e.status IN ('OPEN', 'SEARCHING')
              ORDER BY ec.notified_at DESC
            `, [fleetId]);

            res.json(rows);
    }

    catch(error) {
        console.error(error);
        res.status(500).json({
            error:'Failed to load notifications'
        });
    }
}); 

app.post('/api/emergencies/:emergencyId/respond', async (req, res) => {
    const connection = await db.getConnection();
    try {
        // avoid conflicts of two responders to the same emergency
        await connection.beginTransaction();

        const emergencyId = Number(req.params.emergencyId);
        const fleetId = Number(req.body.id_fleet);
        const response = req.body.response;

        if (!['ACCEPTED', 'DECLINED'].includes(response)) {
            await connection.rollback();

            return res.status(400).json({
                error:'Response must be accepted or declined'
            });
        }

        if (response === 'ACCEPTED') {
            const [emergencyResult] = await connection.query(`
                UPDATE emergencies
                SET status = 'RESPONDER_FOUND'
                WHERE id_emergency = ?
                AND STATUS IN ('OPEN', 'SEARCHING')
                `, [emergencyId])

            if (emergencyResult.affectedRows === 0) {
                await connection.rollback();

                return res.status(409).json({
                    error: 'Emergency already has a responder'
                });
            }

            await connection.query(`
                UPDATE emergency_candidates
                SET
                    response_status = 'ACCEPTED',
                    responded_at = NOW()
                    WHERE id_emergency = ?
                    AND id_fleet = ?
                    AND response_status = 'WAITING'
                `, [emergencyId, fleetId])

            await connection.query(`
                UPDATE emergency_candidates
                SET
                    response_status = 'CANCELLED'
                    WHERE id_emergency = ?
                    AND id_fleet <> ? 
                    AND response_status = 'WAITING'
                `, [emergencyId, fleetId])
        } else {

            await connection.query(`
                UPDATE emergency_candidates
                SET
                    response_status = 'DECLINED',
                    responded_at = NOW()
                    WHERE id_emergency = ? 
                    AND id_fleet = ? 
                    AND response_status = 'WAITING'
                `, [emergencyId, fleetId]);
        }

        await connection.commit();

        res.json({
            id_emergency: emergencyId,
            id_fleet: fleetId,
            response
        });

    } // try block
    catch(error) {
        console.error(error);
        res.status(500).json({
            'error': "Failed to save response"
        });
    }
    finally {
        connection.release();
    }

});


app.get('/api/fleet/:id/active-response', async (req,res) => {
    try{
        const fleetId = Number(req.params.id);

        const [rows] = await db.query(`
            SELECT 
            ec.id_candidate,
            ec.id_emergency,
            ec.id_fleet,
            ec.distance_km,
            ec.responded_at,
            e.latitude,
            e.longitude,
            e.created_at,
            e.status
            FROM emergency_candidates ec
            JOIN emergencies e
                ON e.id_emergency = ec.id_emergency
            WHERE ec.id_fleet = ?
                AND ec.response_status = 'ACCEPTED'
                AND e.status IN ('RESPONDER_FOUND', 'EN_ROUTE')
                ORDER BY ec.responded_at DESC
                LIMIT 1
            `, [fleetId])

        if (rows.length === 0) {
            return res.json(null);
        }

        res.json(rows[0]);
    } // try block
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to load active response'
        });
    } // catch block
});

app.get('/api/fleet/:id/active-response', async(res,req) => {
    try {
        const fleetId = Number(req.params.id);
        const [rows] = await db.query(`
            SELECT 
            ec.id_candidate,
            ec.id_emergency,
            ec.id_fleet,
            ec.distance_km,
            e.latitude,
            e.longitude,
            e.created_at,
            e.status
            FROM emergency_candidates ec
            JOIN emergencies e
                ON e.id_emergency = ec.id_emergency
            WHERE ec.id_fleet = ?
                AND ec.response_status = 'ACCEPTED'
                AND e.status IN ('RESPONDER_FOUND', 'EN_ROUTE')
            ORDER BY ec.responded_at DESC
            LIMIT 1
            `, [fleetId]);

            if(rows.length === 0) {
                return res.json(null);
            }

            res.json(rows[0]);
    } // try block
    catch(error) {
        console.error(error);

        res.status(500).json({
            error:'Failed to load active response'
        });
    }
});

app.get('/api/emergencies/:id/route', async (req,res) => {
    try {
        const emergencyId = Number(req.params.id);
        const fleetId = Number(req.query.fleetId);

        if(!fleetId) {
            return res.status(400).json({
                error: 'fleetId is required'
            });
        }

        const [emergencyRows] = await db.query(`
            SELECT latitude, longitude
            FROM emergencies
            WHERE id_emergency = ?
            `, [emergencyId]);

        if (emergencyRows === 0) {
            return res.status(404).json({
                error: 'Emergency not found'
            });
        
        }

        const [locationRows] = await db.query(`
            SELECT latitude, longitude
            FROM locations
            WHERE id_fleet = ? 
            ORDER BY time_of_transmit DESC, id_location DESC
            `, [fleetId]);

        if(locationRows === 0) {
            return res.status(404).json({
                error:'Fleet location not found'
            });
        }

        const emergency = emergencyRows[0];
        const fleetLocation = locationRows[0];

        // ORS expects longitude first, latitude second

        const body = {
            coordinates: [
                [
                    Number(fleetLocation.longitude),
                    Number(fleetLocation.latitude)
                ],
                [
                    Number(emergency.longitude),
                    Number(emergency.latitude)
                ]
            ]
        };

        const orsResponse = await fetch(
            'http://api.openrouteservice.org/v2/directions/cycling-regular/geojson',
            {
                method: 'POST',
                headers: {
                    Authorization: process.env.ORS_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            }
        );

        if(!orsResponse.ok) {
            const errorText = await orsResponse.text();

            console.error('ORS error:', errorText);
            return res.status(502).json({
                error:'Routing service failed'
            });
        }

        const routeData = await orsResponse.json();
        const feature = routeData.features[0];

        res.json({
            distanceKm:
                feature.properties.summary.distance / 1000,
            durationMinutes:
                feature.properties.summary.duration / 60,
            geometry: 
                feature.geometry.coordinates
        });

    } // try block
    catch(error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to calculate route'
        });
    }
});

app.post('/api/emergencies/:id/start-navigation', async (req, res) => {
    
    try {
        const emergencyId = Number(req.params.id);
        const [result] = await db.query(`
            UPDATE emergencies
            SET status = 'EN_ROUTE'
            WHERE id_emergency = ?
            AND status = 'RESPONDER_FOUND'
            `, [emergencyId]);

            if(result.affectedRows === 0) {
                return res.status(409).json({
                    error:'Emergency not ready for navigation'
                });
            }

            res.json({
                id_emergency: emergencyId,
                status: 'EN_ROUTE'
            });

    } // try block
    catch (error) {
        console.error(error);
        res.status(500).json({
            error:'Failed to start navigation'
        });
    } // catch block
});


app.get('/api/fleet/:id/device-info', async (req, res) => {

      try {
        const fleetId = Number(req.params.id);
        const[rows] = await db.query(`
            SELECT
                f.id_fleet,
                f.has_lora,
                f.dev_EUI,
                f.lora_battery,
                f.is_working_defi,
                u.first_name,
                u.last_name
                FROM fleet f
                JOIN users u
                ON u.id_user = f.id_user
                WHERE f.id_user = ?
            `, [fleetId]);

            if(rows.length === 0) {
                return res.status(404).json({
                    error:'Fleet member not found'
                });
            }

            res.json(rows[0]);

      } // try block
      catch (error) {
        console.error(error);

        res.status(500).json({
            error:'Failed to load device information'
        });
      } // catch block
});

const PORT = process.env.PORT || 3001;

// init express server
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
