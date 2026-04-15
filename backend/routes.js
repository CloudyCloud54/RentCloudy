const express = require('express')
const router = express.Router()
const db = require('./database')

// ─── VÉHICULES ───────────────────────────────────────

// Récupérer tous les véhicules
router.get('/vehicules', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM vehicules WHERE disponible = 1').all()
    res.json(rows)
  } catch (err) {
    res.status(500).json({ erreur: err.message })
  }
})

// ─── HÔTELS ──────────────────────────────────────────

// Récupérer tous les hôtels
router.get('/hotels', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM hotels WHERE disponible = 1').all()
    res.json(rows)
  } catch (err) {
    res.status(500).json({ erreur: err.message })
  }
})

// ─── RÉSERVATIONS ────────────────────────────────────

// Créer une réservation
router.post('/reservations', (req, res) => {
  const { type, item_id, nom_client, email_client, date_debut, date_fin, prix_total } = req.body
  try {
    const result = db.prepare(`
      INSERT INTO reservations (type, item_id, nom_client, email_client, date_debut, date_fin, prix_total)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(type, item_id, nom_client, email_client, date_debut, date_fin, prix_total)
    res.json({ message: '✅ Réservation confirmée !', id: result.lastInsertRowid })
  } catch (err) {
    res.status(500).json({ erreur: err.message })
  }
})

module.exports = router