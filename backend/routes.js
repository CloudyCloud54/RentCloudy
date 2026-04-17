const express = require('express')
const router = express.Router()
const db = require('./database')
const Stripe = require('stripe')

// ─── STRIPE INIT ─────────────────────────────────────
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || '')

// ─── VÉHICULES ───────────────────────────────────────
router.get('/vehicules', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM vehicules WHERE disponible = 1').all()
    res.json(rows)
  } catch (err) { res.status(500).json({ erreur: err.message }) }
})

// ─── HÔTELS ──────────────────────────────────────────
router.get('/hotels', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM hotels WHERE disponible = 1').all()
    res.json(rows)
  } catch (err) { res.status(500).json({ erreur: err.message }) }
})

// ─── STRIPE : CRÉER UN PAYMENT INTENT ────────────────
router.post('/create-payment-intent', async (req, res) => {
  const { montant } = req.body
  if (!montant || montant <= 0) return res.status(400).json({ erreur: 'Montant invalide' })
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ erreur: 'Clé Stripe non configurée. Ajoutez STRIPE_SECRET_KEY dans votre .env' })
  }
  try {
    const montant_centimes = Math.max(Math.round(montant * 0.00152 * 100), 50)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: montant_centimes,
      currency: 'eur',
      metadata: { montant_fcfa: montant }
    })
    res.json({ client_secret: paymentIntent.client_secret })
  } catch (err) { res.status(500).json({ erreur: err.message }) }
})

// ─── CAMPAY : INITIER UN PAIEMENT MOBILE MONEY ───────
router.post('/campay/payer', async (req, res) => {
  const { montant, telephone, description } = req.body
  if (!montant || !telephone) return res.status(400).json({ erreur: 'Montant et téléphone requis' })

  const CAMPAY_USERNAME = process.env.CAMPAY_USERNAME
  const CAMPAY_PASSWORD = process.env.CAMPAY_PASSWORD
  const CAMPAY_BASE = process.env.CAMPAY_ENV === 'prod'
    ? 'https://campay.net/api'
    : 'https://demo.campay.net/api'

  if (!CAMPAY_USERNAME || !CAMPAY_PASSWORD) {
    return res.status(500).json({ erreur: 'Identifiants Campay manquants dans le .env' })
  }

  try {
    const tokenRes = await fetch(`${CAMPAY_BASE}/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: CAMPAY_USERNAME, password: CAMPAY_PASSWORD })
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.token) return res.status(401).json({ erreur: 'Auth Campay échouée', detail: tokenData })

    const payRes = await fetch(`${CAMPAY_BASE}/collect/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${tokenData.token}` },
      body: JSON.stringify({
        amount: String(montant),
        currency: 'XAF',
        from: telephone.replace(/\s/g, ''),
        description: description || 'Paiement RentCloudy',
        external_reference: `RC-${Date.now()}`
      })
    })
    const payData = await payRes.json()

    if (payData.reference) {
      res.json({ reference: payData.reference, ussd_code: payData.ussd_code || null, message: 'Confirmez sur votre téléphone.' })
    } else {
      res.status(400).json({ erreur: payData.message || 'Erreur Campay', detail: payData })
    }
  } catch (err) { res.status(500).json({ erreur: err.message }) }
})

// ─── CAMPAY : VÉRIFIER STATUT ────────────────────────
router.get('/campay/statut/:reference', async (req, res) => {
  const { reference } = req.params
  const CAMPAY_USERNAME = process.env.CAMPAY_USERNAME
  const CAMPAY_PASSWORD = process.env.CAMPAY_PASSWORD
  const CAMPAY_BASE = process.env.CAMPAY_ENV === 'prod' ? 'https://campay.net/api' : 'https://demo.campay.net/api'
  try {
    const tokenRes = await fetch(`${CAMPAY_BASE}/token/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: CAMPAY_USERNAME, password: CAMPAY_PASSWORD })
    })
    const { token } = await tokenRes.json()
    const statRes = await fetch(`${CAMPAY_BASE}/transaction/${reference}/`, {
      headers: { 'Authorization': `Token ${token}` }
    })
    res.json(await statRes.json())
  } catch (err) { res.status(500).json({ erreur: err.message }) }
})

// ─── RÉSERVATIONS ────────────────────────────────────
router.post('/reservations', (req, res) => {
  const { type, item_id, nom_client, email_client, date_debut, date_fin, prix_total } = req.body
  if (!type || !item_id || !nom_client || !email_client || !date_debut || !date_fin || !prix_total) {
    return res.status(400).json({ erreur: 'Tous les champs sont obligatoires' })
  }
  if (new Date(date_fin) <= new Date(date_debut)) {
    return res.status(400).json({ erreur: 'La date de fin doit être après la date de début' })
  }
  try {
    const result = db.prepare(`
      INSERT INTO reservations (type, item_id, nom_client, email_client, date_debut, date_fin, prix_total)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(type, item_id, nom_client, email_client, date_debut, date_fin, prix_total)
    res.json({ message: '✅ Réservation confirmée !', id: result.lastInsertRowid })
  } catch (err) { res.status(500).json({ erreur: err.message }) }
})

module.exports = router
