-- Snowflake database schema for Civic Connect Data Warehouse

CREATE DATABASE IF NOT EXISTS CIVIC_CONNECT_DB;
USE DATABASE CIVIC_CONNECT_DB;

CREATE SCHEMA IF NOT EXISTS INCIDENTS_SCHEMA;
USE SCHEMA INCIDENTS_SCHEMA;

CREATE OR REPLACE TABLE civic_incidents (
    incident_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    hazard_type VARCHAR(100),
    description TEXT,
    priority VARCHAR(20),
    status VARCHAR(50),
    latitude FLOAT,
    longitude FLOAT,
    address VARCHAR(255),
    image_url VARCHAR(500),
    reported_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    resolved_at TIMESTAMP_NTZ
);

-- Optimization: Cluster by time and status for high-performance dashboard aggregation
ALTER TABLE civic_incidents CLUSTER BY (reported_at, status);
