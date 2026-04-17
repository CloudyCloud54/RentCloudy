const express = require('express')
const router = express.Router()
const db = require('./database')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const SECRET = 'renteasy_client_secret_2024'

// ─── MIDDLEWARE AUTH CLIENT ───────────────────────────
function verifierClient(req, res, next) {
  const token = req.headers['authorization']
  if (!token) return res.status(401).json({ erreur: 'Connexion requise' })
  try {
    req.client = jwt.verify(token, SECRET)
    next()
  } catch {
    res.status(401).json({ erreur: 'Session expirée, reconnectez-vous' })
  }
}

// ─── INSCRIPTION ─────────────────────────────────────
router.post('/inscription', async (req, res) => {
  const { nom, email, password, telephone } = req.body

  if (!nom || !email || !password) {
    return res.status(400).json({ erreur: 'Nom, email et mot de passe obligatoires' })
  }
  if (password.length < 6) {
    return res.status(400).json({ erreur: 'Le mot de passe doit faire au moins 6 caractères' })
  }

  try {
    const existant = db.prepare('SELECT id FROM clients WHERE email = ?').get(email)
    if (existant) {
      return res.status(409).json({ erreur: 'Un compte existe déjà avec cet email' })
    }

    const hash = await bcrypt.hash(password, 10)
    const result = db.prepare(`
      INSERT INTO clients (nom, email, password, telephone) VALUES (?, ?, ?, ?)
    `).run(nom, email, hash, telephone || null)

    const token = jwt.sign({ id: result.lastInsertRowid, email, nom }, SECRET, { expiresIn: '7d' })
    res.status(201).json({ message: '✅ Compte créé !', token, nom, email })
  } catch (err) {
    res.status(500).json({ erreur: err.message })
  }
})

// ─── CONNEXION ───────────────────────────────────────
router.post('/connexion', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ erreur: 'Email et mot de passe requis' })
  }

  try {
    const client = db.prepare('SELECT * FROM clients WHERE email = ?').get(email)
    if (!client) {
      return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' })
    }

    const valide = await bcrypt.compare(password, client.password)
    if (!valide) {
      return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' })
    }

    const token = jwt.sign(
      { id: client.id, email: client.email, nom: client.nom },
      SECRET,
      { expiresIn: '7d' }
    )
    res.json({ message: '✅ Connexion réussie', token, nom: client.nom, email: client.email })
  } catch (err) {
    res.status(500).json({ erreur: err.message })
  }
})

// ─── PROFIL ──────────────────────────────────────────
router.get('/profil', verifierClient, (req, res) => {
  try {
    const client = db.prepare(
      'SELECT id, nom, email, telephone, created_at FROM clients WHERE id = ?'
    ).get(req.client.id)

    if (!client) return res.status(404).json({ erreur: 'Compte introuvable' })
    res.json(client)
  } catch (err) {
    res.status(500).json({ erreur: err.message })
  }
})

// ─── MES RÉSERVATIONS ────────────────────────────────
router.get('/mes-reservations', verifierClient, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT r.*,
        CASE
          WHEN r.type = 'vehicule' THEN v.nom
          WHEN r.type = 'hotel'   THEN h.nom
        END AS nom_item,
        CASE
          WHEN r.type = 'vehicule' THEN v.image
          WHEN r.type = 'hotel'   THEN h.image
        END AS image_item
      FROM reservations r
      LEFT JOIN vehicules v ON r.type = 'vehicule' AND r.item_id = v.id
      LEFT JOIN hotels h    ON r.type = 'hotel'    AND r.item_id = h.id
      WHERE r.email_client = ?
      ORDER BY r.created_at DESC
    `).all(req.client.email)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ erreur: err.message })
  }
})

// ─── MODIFIER PROFIL ─────────────────────────────────
router.put('/profil', verifierClient, async (req, res) => {
  const { nom, telephone, password } = req.body
  try {
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ erreur: 'Mot de passe trop court (min 6 caractères)' })
      }
      const hash = await bcrypt.hash(password, 10)
      db.prepare('UPDATE clients SET nom = ?, telephone = ?, password = ? WHERE id = ?')
        .run(nom, telephone, hash, req.client.id)
    } else {
      db.prepare('UPDATE clients SET nom = ?, telephone = ? WHERE id = ?')
        .run(nom, telephone, req.client.id)
    }
    res.json({ message: '✅ Profil mis à jour' })
  } catch (err) {
    res.status(500).json({ erreur: err.message })
  }
})

module.exports = { router, verifierClient }
