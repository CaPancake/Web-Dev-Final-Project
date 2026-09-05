## Web-Dev-Final-Project
Shani & Michal's final project for the Web Platforms Development course.

#### Project Overview
- **Defergency** is a web-based emergency response system designed to help locate nearby defibrillators and volunteers during cardiac emergencies.
- The system combines a public emergency reporting interface, participant and LoRa device simulators, an administrative dashboard, real-time geographic filtering, and bicycle-based navigation.

#### Workflow
Emergency created --> Backend saves emergency --> System loads current candidates radius --> Nearby eligible fleet members are notified --> Volunteer accepts or declines --> One responder is selected --> Bicycle route is generated --> (Optional) Navigation and movement simulation --> Responder arrival detected --> Emergency is resolved. 

#### System Components
1. **Backend server** - _Port 3001_

Main application server implemented with Express.js.

2. **Authentication server** - _Port 3002_

Express-based server responsible for administrative functionality and NoSQL-backed application configuration.

3. **Frontend** - _Port 3000_
 
Implemented using Next.js and TypeScript.

4. **SQL Database** - _MySQL_

Stores relational system data, including users, fleet, device information and locations.

5. **NoSQL Database** - _MongoDB_

Stores flexible administrative and configuration data, including: Administrator accounts and editable homepage content.

6. **External Services**
- _OpenStreetMap_ used for displaying maps.
- _OpenRouteService_ used for route generation & navigation geometry. 

#### Installation & Startup requirements 
1. Required before running:  MySQL server, MongoDB server & [MongoDB CLI Tools](https://www.mongodb.com/try/download/database-tools) and API key for OpenRouteService (it's free!).
2. Database recreation: [located databases / defergency_db_full.db, mongodb_defergency_auth]
```
mysql -u root -p -e "CREATE DATABASE derfergency_db;"
mysql -u root -p defergency_db < defergency_db_full.db
mongorestore --db defergency_auth database/mongodb/dump/defergency_auth
```
4. Running the backend server:
- cd backend
- npm install
- npm run dev
4. Running authentication & settings server:
  - cd auth
  - npm install
  - npm run dev
5.  Starting the frontend:
    - cd frontend
    - npm install
    - npm run dev
