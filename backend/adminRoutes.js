const express = require('express')
const router = express.Router()
const db = require('./database')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// Clé secrète pour signer les tokens — dans un vrai projet, mets ça dans un fichier .env
const SECRET = 'renteasy_secret_2024'

// ─── MIDDLEWARE ──────────────────────────────────────
function verifierToken(req, res, next) {
  const token = req.headers['authorization']
  if (!token) {
    return res.status(401).json({ erreur: 'Accès refusé — token manquant' })
  }
  try {
    const decoded = jwt.verify(token, SECRET)
    req.admin = decoded
    next()
  } catch (err) {
    res.status(401).json({ erreur: 'Token invalide' })
  }
}

// ─── LOGIN ADMIN ─────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email)
    if (!admin) {
      return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' })
    }
    const valide = await bcrypt.compare(password, admin.password)
    if (!valide) {
      return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' })
    }
    const token = jwt.sign({ id: admin.id, email: admin.email }, SECRET, { expiresIn: '24h' })
    res.json({ message: '✅ Connexion réussie', token })
  } catch (err) {
    res.status(500).json({ erreur: err.message })
  }
})

// ─── AJOUTER UN VÉHICULE (protégé) ───────────────────
router.post('/vehicules', verifierToken, (req, res) => {
  const { nom, type, prix_par_jour, places, image } = req.body
  try {
    const result = db.prepare(`
      INSERT INTO vehicules (nom, type, prix_par_jour, places, image)
      VALUES (?, ?, ?, ?, ?)
    `).run(nom, type, prix_par_jour, places, image || 'placeholder.jpg')
    res.json({ message: '✅ Véhicule ajouté', id: result.lastInsertRowid })
  } catch (err) {
    res.status(500).json({ erreur: err.message })
  }
})

// ─── AJOUTER UN HÔTEL (protégé) ──────────────────────
router.post('/hotels', verifierToken, (req, res) => {
  const { nom, ville, prix_par_nuit, etoiles, image } = req.body
  try {
    const result = db.prepare(`
      INSERT INTO hotels (nom, ville, prix_par_nuit, etoiles, image)
      VALUES (?, ?, ?, ?, ?)
    `).run(nom, ville, prix_par_nuit, etoiles, image || 'placeholder.jpg')
    res.json({ message: '✅ Hôtel ajouté', id: result.lastInsertRowid })
  } catch (err) {
    res.status(500).json({ erreur: err.message })
  }
})

// ─── VOIR TOUTES LES RÉSERVATIONS (protégé) ──────────
router.get('/reservations', verifierToken, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM reservations ORDER BY created_at DESC').all()
    res.json(rows)
  } catch (err) {
    res.status(500).json({ erreur: err.message })
  }
})

// ─── LISTE TOUS LES VÉHICULES ────────────────────────
router.get('/vehicules', verifierToken, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM vehicules ORDER BY id DESC').all()
    res.json(rows)
  } catch (err) {
    res.status(500).json({ erreur: err.message })
  }
})

// ─── LISTE TOUS LES HÔTELS ───────────────────────────
router.get('/hotels', verifierToken, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM hotels ORDER BY id DESC').all()
    res.json(rows)
  } catch (err) {
    res.status(500).json({ erreur: err.message })
  }
})

// ─── TOGGLE DISPONIBILITÉ VÉHICULE ───────────────────
router.put('/vehicules/:id/desactiver', verifierToken, (req, res) => {
  const { id } = req.params
  try {
    const row = db.prepare('SELECT disponible FROM vehicules WHERE id = ?').get(id)
    if (!row) return res.status(404).json({ erreur: 'Véhicule introuvable' })
    const nouvelEtat = row.disponible === 1 ? 0 : 1
    db.prepare('UPDATE vehicules SET disponible = ? WHERE id = ?').run(nouvelEtat, id)
    res.json({
      message: nouvelEtat === 1 ? '✅ Véhicule activé' : '⏸️ Véhicule désactivé',
      disponible: nouvelEtat
    })
  } catch (err) {
    res.status(500).json({ erreur: err.message })
  }
})

// ─── TOGGLE DISPONIBILITÉ HÔTEL ──────────────────────
router.put('/hotels/:id/desactiver', verifierToken, (req, res) => {
  const { id } = req.params
  try {
    const row = db.prepare('SELECT disponible FROM hotels WHERE id = ?').get(id)
    if (!row) return res.status(404).json({ erreur: 'Hôtel introuvable' })
    const nouvelEtat = row.disponible === 1 ? 0 : 1
    db.prepare('UPDATE hotels SET disponible = ? WHERE id = ?').run(nouvelEtat, id)
    res.json({
      message: nouvelEtat === 1 ? '✅ Hôtel activé' : '⏸️ Hôtel désactivé',
      disponible: nouvelEtat
    })
  } catch (err) {
    res.status(500).json({ erreur: err.message })
  }
})

// ─── SUPPRIMER UN VÉHICULE ───────────────────────────
router.delete('/vehicules/:id', verifierToken, (req, res) => {
  try {
    db.prepare('DELETE FROM vehicules WHERE id = ?').run(req.params.id)
    res.json({ message: '🗑️ Véhicule supprimé' })
  } catch (err) {
    res.status(500).json({ erreur: err.message })
  }
})

// ─── SUPPRIMER UN HÔTEL ──────────────────────────────
router.delete('/hotels/:id', verifierToken, (req, res) => {
  try {
    db.prepare('DELETE FROM hotels WHERE id = ?').run(req.params.id)
    res.json({ message: '🗑️ Hôtel supprimé' })
  } catch (err) {
    res.status(500).json({ erreur: err.message })
  }
})

module.exports = { router, verifierToken }