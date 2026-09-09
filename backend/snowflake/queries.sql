-- Aggregation queries for the Municipal Dashboard

USE DATABASE CIVIC_CONNECT_DB;
USE SCHEMA INCIDENTS_SCHEMA;

-- 1. Group incidents by their status and hazard_type over the last 30 days
SELECT 
    status,
    hazard_type,
    COUNT(*) as incident_count
FROM 
    civic_incidents
WHERE 
    reported_at >= DATEADD(day, -30, CURRENT_TIMESTAMP())
GROUP BY 
    status,
    hazard_type
ORDER BY 
    status,
    incident_count DESC;

-- 2. Average resolution time by hazard type
SELECT
    hazard_type,
    AVG(TIMEDIFF('hour', reported_at, resolved_at)) as avg_resolution_hours
FROM
    civic_incidents
WHERE
    status = 'Resolved'
    AND resolved_at IS NOT NULL
    AND reported_at >= DATEADD(day, -30, CURRENT_TIMESTAMP())
GROUP BY
    hazard_type
ORDER BY
    avg_resolution_hours ASC;
