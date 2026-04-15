const express = require('express')
const router = express.Router()
const db = require('./database')

// ─── VÉHICULES ───────────────────────────────────────

// Récupérer tous les véhicules
router.get('/vehicules', (req, res) => {
  db.all(
    `SELECT * FROM vehicules WHERE disponible = 1`,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ erreur: err.message })
      } else {
        res.json(rows)
      }
    }
  )
})

// ─── HÔTELS ──────────────────────────────────────────

// Récupérer tous les hôtels
router.get('/hotels', (req, res) => {
  db.all(
    `SELECT * FROM hotels WHERE disponible = 1`,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ erreur: err.message })
      } else {
        res.json(rows)
      }
    }
  )
})

// ─── RÉSERVATIONS ────────────────────────────────────

// Créer une réservation
router.post('/reservations', (req, res) => {
  const {
    type,
    item_id,
    nom_client,
    email_client,
    date_debut,
    date_fin,
    prix_total
  } = req.body

  db.run(
    `INSERT INTO reservations 
     (type, item_id, nom_client, email_client, date_debut, date_fin, prix_total)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [type, item_id, nom_client, email_client, date_debut, date_fin, prix_total],
    function (err) {
      if (err) {
        res.status(500).json({ erreur: err.message })
      } else {
        res.json({
          message: '✅ Réservation confirmée !',
          id: this.lastID
        })
      }
    }
  )
})

module.exports = router