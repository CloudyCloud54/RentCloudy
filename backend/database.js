const Database = require('better-sqlite3');
const path = require('path')

// Crée ou ouvre le fichier de base de données
const db = new Database('renteasy.db');
module.exports = db;

// Création des tables
db.serialize(() => {

  // Table véhicules
  db.run(`
    CREATE TABLE IF NOT EXISTS vehicules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      type TEXT NOT NULL,
      prix_par_jour REAL NOT NULL,
      places INTEGER NOT NULL,
      image TEXT,
      disponible INTEGER DEFAULT 1
    )
  `)

  // Table hôtels
  db.run(`
    CREATE TABLE IF NOT EXISTS hotels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      ville TEXT NOT NULL,
      prix_par_nuit REAL NOT NULL,
      etoiles INTEGER NOT NULL,
      image TEXT,
      disponible INTEGER DEFAULT 1
    )
  `)

  // Table réservations
  db.run(`
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
    )
  `)

  // Table admins
  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
    )
`)


  console.log('✅ Tables prêtes')
})

module.exports = db