const express = require('express')
const router = express.Router()
const db = require('./database')
const Stripe = require('stripe')

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_REMPLACEZ_PAR_VOTRE_CLE')

// ─── VÉHICULES ───────────────────────────────────────

router.get('/vehicules', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM vehicules WHERE disponible = 1').all()
    res.json(rows)
  } catch (err) {
    res.status(500).json({ erreur: err.message })
  }
})

// ─── HÔTELS ──────────────────────────────────────────

router.get('/hotels', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM hotels WHERE disponible = 1').all()
    res.json(rows)
  } catch (err) {
    res.status(500).json({ erreur: err.message })
  }
})

// ─── STRIPE : CRÉER UN PAYMENT INTENT ────────────────

router.post('/create-payment-intent', async (req, res) => {
  const { montant } = req.body // montant en FCFA

  if (!montant || montant <= 0) {
    return res.status(400).json({ erreur: 'Montant invalide' })
  }

  try {
    // Stripe travaille en centimes. 1 FCFA ≈ 0.00152 EUR → on utilise EUR en test
    // Pour le test, on convertit FCFA → centimes EUR (approximatif, parfait pour les tests)
    const montant_centimes = Math.round(montant * 0.00152 * 100)
    const montantFinal = Math.max(montant_centimes, 50) // minimum Stripe : 50 centimes

    const paymentIntent = await stripe.paymentIntents.create({
      amount: montantFinal,
      currency: 'eur',
      metadata: { montant_fcfa: montant }
    })

    res.json({ client_secret: paymentIntent.client_secret })
  } catch (err) {
    res.status(500).json({ erreur: err.message })
  }
})

// ─── RÉSERVATIONS ────────────────────────────────────

router.post('/reservations', (req, res) => {
  const { type, item_id, nom_client, email_client, date_debut, date_fin, prix_total } = req.body

  // Validation : tous les champs requis
  if (!type || !item_id || !nom_client || !email_client || !date_debut || !date_fin || !prix_total) {
    return res.status(400).json({ erreur: 'Tous les champs sont obligatoires' })
  }

  // Validation : date de fin doit être après date de début
  const debut = new Date(date_debut)
  const fin = new Date(date_fin)
  if (fin <= debut) {
    return res.status(400).json({ erreur: 'La date de fin doit être après la date de début' })
  }

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