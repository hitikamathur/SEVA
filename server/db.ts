import mysql from "mysql2/promise";

const MYSQL_URI = process.env.MYSQL_URI || "";

// Parse individual MySQL connection params as fallback
const connectionConfig = MYSQL_URI
  ? { uri: MYSQL_URI }
  : {
      host: process.env.MYSQL_HOST || "localhost",
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "seva",
    };

export let pool: mysql.Pool;

export async function connectDB() {
  try {
    const dbName = process.env.MYSQL_DATABASE || "seva";

    // 1. Establish connection without selecting a DB to check/create the DB first
    const tempConfig = MYSQL_URI
      ? { uri: MYSQL_URI }
      : {
          host: process.env.MYSQL_HOST || "localhost",
          port: Number(process.env.MYSQL_PORT) || 3306,
          user: process.env.MYSQL_USER || "root",
          password: process.env.MYSQL_PASSWORD || "",
        };

    const tempConn = MYSQL_URI
      ? await mysql.createConnection(MYSQL_URI)
      : await mysql.createConnection(tempConfig);

    await tempConn.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await tempConn.end();

    // 2. Now establish the actual connection pool with the database selected
    pool = MYSQL_URI
      ? mysql.createPool({ uri: MYSQL_URI, waitForConnections: true, connectionLimit: 10 })
      : mysql.createPool({ ...(connectionConfig as any), waitForConnections: true, connectionLimit: 10 });

    // Test pool connection
    const conn = await pool.getConnection();
    console.log(`✅ Connected to MySQL database: "${dbName}"`);
    conn.release();

    // Create tables if they don't exist
    await initializeTables();
  } catch (err) {
    console.error("❌ MySQL connection error:", err);
    process.exit(1);
  }
}

async function initializeTables() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS ambulances (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      driver_id VARCHAR(100) UNIQUE NOT NULL,
      driver_name VARCHAR(255) NOT NULL,
      driver_email VARCHAR(255) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      lat DOUBLE NOT NULL DEFAULT 28.6139,
      lng DOUBLE NOT NULL DEFAULT 77.2090,
      type VARCHAR(50) NOT NULL DEFAULT 'basic',
      status VARCHAR(50) NOT NULL DEFAULT 'available',
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS requests (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      patient_name VARCHAR(255) NOT NULL,
      patient_phone VARCHAR(30) NOT NULL,
      emergency TEXT NOT NULL,
      lat DOUBLE,
      lng DOUBLE,
      driver_id VARCHAR(100),
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      otp VARCHAR(10),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS hospitals (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      name VARCHAR(255) NOT NULL,
      address VARCHAR(500) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      lat DOUBLE NOT NULL,
      lng DOUBLE NOT NULL,
      rating DOUBLE NOT NULL DEFAULT 4.0,
      specialties JSON NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'private'
    )
  `);

  console.log("✅ MySQL tables initialized");
}
