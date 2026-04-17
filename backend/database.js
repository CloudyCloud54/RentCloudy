const Database = require('better-sqlite3')
const path = require('path')

const db = new Database(path.join(__dirname, 'renteasy.db'))

// Création des tables (synchrone avec better-sqlite3)
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    telephone TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vehicules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    type TEXT NOT NULL,
    prix_par_jour REAL NOT NULL,
    places INTEGER NOT NULL,
    image TEXT,
    disponible INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS hotels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    ville TEXT NOT NULL,
    prix_par_nuit REAL NOT NULL,
    etoiles INTEGER NOT NULL,
    image TEXT,
    disponible INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    item_id INTEGER NOT NULL,
    nom_client TEXT NOT NULL,
    email_client TEXT NOT NULL,
    date_debut TEXT NOT NULL,
    date_fin TEXT NOT NULL,
    prix_total REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
`)

console.log('✅ Base de données connectée et tables prêtes')

module.exports = db