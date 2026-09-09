import snowflake from 'snowflake-sdk';
import dotenv from 'dotenv';
dotenv.config();

// Analytical backend script for Hackathon shortlisting weightage
// This script can be run independently (e.g. as a cron job) to sync data
// into Snowflake for advanced analytics and scoring, keeping the live web app lean.

export function syncIncidentToSnowflake(incidentId: string, category: string, description: string, priority: string, imageUrl: string) {
  if (!process.env.SNOWFLAKE_ACCOUNT) {
    console.log('Skipping Snowflake sync: credentials not provided.');
    return;
  }

  const snowflakeConnection = snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT,
    username: process.env.SNOWFLAKE_USERNAME || '',
    password: process.env.SNOWFLAKE_PASSWORD || '',
    database: process.env.SNOWFLAKE_DATABASE || 'CIVIC_CONNECT_DB',
    schema: process.env.SNOWFLAKE_SCHEMA || 'INCIDENTS_SCHEMA'
  });
  
  snowflakeConnection.connect((err, conn) => {
    if (err) {
      console.error('Unable to connect to Snowflake: ' + err.message);
      return;
    } 
    
    console.log('Successfully connected to Snowflake Data Warehouse.');
    
    const insertSql = `
      INSERT INTO civic_incidents (incident_id, hazard_type, description, priority, status, image_url)
      VALUES (?, ?, ?, ?, 'Reported', ?)
    `;
    
    snowflakeConnection.execute({
      sqlText: insertSql,
      binds: [incidentId, category, description, priority, imageUrl],
      complete: (err, stmt, rows) => {
        if (err) {
          console.error("Failed to ingest into Snowflake:", err);
        } else {
          console.log("Successfully logged incident to Snowflake data warehouse for analytics.");
        }
      }
    });
  });
}
