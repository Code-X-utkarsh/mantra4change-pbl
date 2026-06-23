# Mantra4Change PBL Program Intelligence & Grant Reporting Assistant

This project is the PBL Program Intelligence & Grant Reporting Assistant for Mantra4Change. It is built using Next.js 14, TypeScript, Tailwind CSS, SQLite, and `better-sqlite3`.

## Phase 1 Setup

To set up the project and ingest the data, follow these steps:

### 1. Install dependencies
Install all the required npm packages:
```bash
npm install
```

### 2. Place CSVs in the /data folder
Ensure that the following 6 CSV data files are placed in the `/data` folder at the root of the project:
*   `PBL_School_Response_Data_July_2025.csv`
*   `PBL_School_Response_Data_August_2025.csv`
*   `PBL_School_Response_Data_September_2025.csv`
*   `01_Grant_Profile_and_Finance.csv`
*   `02_Grant_Performance_and_Report_Material.csv`
*   `03_Evidence_and_Media_Index.csv`

*(Note: The CSV files inside the `/data` folder are git-ignored, except for `.gitkeep`).*

### 3. Seed the SQLite database
Run the database seed script to initialize the schema and ingest all CSV records:
```bash
npm run seed
```
This script will recreate all 6 tables in WAL mode and print an ingestion summary to the console upon completion.

### 4. Start the development server
Run the Next.js development server:
```bash
npm run dev
```

### 5. Verify database records
Visit the health check API endpoint to verify that all counts match the source datasets:
*   URL: [http://localhost:3000/api/health](http://localhost:3000/api/health)
*   Expected row counts:
    *   `schools`: 2300
    *   `monthly_records`: 6900
    *   `grants`: 3
    *   `grant_finance`: 45
    *   `grant_performance`: 9
    *   `evidence_media`: 9

---

## Phase 2 API Reference

All dashboard metrics endpoints work with no filters (returns all data across all months).

### curl Examples for All 8 Routes

1.  **Get Filter Options**
    ```bash
    curl http://localhost:3000/api/filters
    ```

2.  **Get Blocks Filter**
    ```bash
    curl http://localhost:3000/api/filters/blocks?district=District+A
    ```

3.  **Get KPI Metrics**
    ```bash
    curl http://localhost:3000/api/dashboard/kpis?month=2025-09
    ```

4.  **Get District Rankings**
    ```bash
    curl http://localhost:3000/api/dashboard/districts?month=2025-09
    ```

5.  **Get Block Rankings**
    ```bash
    curl http://localhost:3000/api/dashboard/blocks?month=2025-09
    ```

6.  **Get Grants List**
    ```bash
    curl http://localhost:3000/api/grants
    ```

7.  **Get Grant Details**
    ```bash
    curl http://localhost:3000/api/grants/GRANT_AA_2025?month=2025-09
    ```

8.  **Get Schools List**
    ```bash
    curl "http://localhost:3000/api/schools?month=2025-09&district=District+A"
    ```

### Expected Response Shape for `/api/dashboard/kpis?month=2025-09`

```json
{
  "success": true,
  "data": {
    "filters": {
      "month": "2025-09"
    },
    "current": {
      "totalSchools": 2300,
      "participatingSchools": 2119,
      "participationRate": 92.13,
      "evidenceRate": 75.39,
      "totalEnrollment": 402142,
      "totalAttendance": 487336,
      "attendanceRate": 63.97,
      "riskStatus": "On Track"
    },
    "previous": {
      "totalSchools": 2300,
      "participatingSchools": 1899,
      "participationRate": 82.57,
      "evidenceRate": 60.65,
      "totalEnrollment": 402142,
      "totalAttendance": 418667,
      "attendanceRate": 55.22,
      "riskStatus": "On Track"
    },
    "momChange": {
      "participationRate": 11.58,
      "attendanceRate": 15.85
    }
  }
}
```
