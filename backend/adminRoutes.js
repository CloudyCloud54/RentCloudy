const express = require('express')
const router = express.Router()
const db = require('./database')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// Clé secrète pour signer les tokens — dans un vrai projet, mets ça dans un fichier .env
const SECRET = 'renteasy_secret_2024'

// ─── MIDDLEWARE ──────────────────────────────────────
// Ce middleware vérifie que la requête a un token valide
// On l'utilisera sur toutes les routes protégées
function verifierToken(req, res, next) {
  const token = req.headers['authorization']

  if (!token) {
    return res.status(401).json({ erreur: 'Accès refusé — token manquant' })
  }

  try {
    // jwt.verify lance une erreur si le token est faux ou expiré
    const decoded = jwt.verify(token, SECRET)
    req.admin = decoded  // on attache les infos de l'admin à la requête
    next()               // on laisse passer vers la route suivante
  } catch (err) {
    res.status(401).json({ erreur: 'Token invalide' })
  }
}

// ─── LOGIN ADMIN ─────────────────────────────────────
router.post('/login', (req, res) => {
  const { email, password } = req.body

  db.get(`SELECT * FROM admins WHERE email = ?`, [email], async (err, admin) => {
    if (err || !admin) {
      return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' })
    }

    // bcrypt.compare compare le mot de passe tapé avec le hash en base
    const valide = await bcrypt.compare(password, admin.password)

    if (!valide) {
      return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' })
    }

    // On crée un token qui expire dans 24h
    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      SECRET,
      { expiresIn: '24h' }
    )

    res.json({ message: '✅ Connexion réussie', token })
  })
})

// ─── AJOUTER UN VÉHICULE (protégé) ───────────────────
router.post('/vehicules', verifierToken, (req, res) => {
  const { nom, type, prix_par_jour, places, image } = req.body

  db.run(
    `INSERT INTO vehicules (nom, type, prix_par_jour, places, image)
     VALUES (?, ?, ?, ?, ?)`,
    [nom, type, prix_par_jour, places, image || 'placeholder.jpg'],
    function (err) {
      if (err) {
        res.status(500).json({ erreur: err.message })
      } else {
        res.json({ message: '✅ Véhicule ajouté', id: this.lastID })
      }
    }
  )
})

// ─── AJOUTER UN HÔTEL (protégé) ──────────────────────
router.post('/hotels', verifierToken, (req, res) => {
  const { nom, ville, prix_par_nuit, etoiles, image } = req.body

  db.run(
    `INSERT INTO hotels (nom, ville, prix_par_nuit, etoiles, image)
     VALUES (?, ?, ?, ?, ?)`,
    [nom, ville, prix_par_nuit, etoiles, image || 'placeholder.jpg'],
    function (err) {
      if (err) {
        res.status(500).json({ erreur: err.message })
      } else {
        res.json({ message: '✅ Hôtel ajouté', id: this.lastID })
      }
    }
  )
})

// ─── VOIR TOUTES LES RÉSERVATIONS (protégé) ──────────
router.get('/reservations', verifierToken, (req, res) => {
  db.all(`SELECT * FROM reservations ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) {
      res.status(500).json({ erreur: err.message })
    } else {
      res.json(rows)
    }
  })
})

// ─── LISTE TOUS LES VÉHICULES (admin voit tout, même désactivés) ──
router.get('/vehicules', verifierToken, (req, res) => {
  db.all(`SELECT * FROM vehicules ORDER BY id DESC`, [], (err, rows) => {
    if (err) res.status(500).json({ erreur: err.message })
    else res.json(rows)
  })
})

// ─── LISTE TOUS LES HÔTELS ───────────────────────────────────────
router.get('/hotels', verifierToken, (req, res) => {
  db.all(`SELECT * FROM hotels ORDER BY id DESC`, [], (err, rows) => {
    if (err) res.status(500).json({ erreur: err.message })
    else res.json(rows)
  })
})

// ─── DÉSACTIVER UN VÉHICULE ──────────────────────────────────────
router.put('/vehicules/:id/desactiver', verifierToken, (req, res) => {
  const { id } = req.params

  // On lit d'abord l'état actuel pour faire un toggle (activer/désactiver)
  db.get(`SELECT disponible FROM vehicules WHERE id = ?`, [id], (err, row) => {
    if (err || !row) return res.status(404).json({ erreur: 'Véhicule introuvable' })

    const nouvelEtat = row.disponible === 1 ? 0 : 1

    db.run(`UPDATE vehicules SET disponible = ? WHERE id = ?`, [nouvelEtat, id], (err) => {
      if (err) res.status(500).json({ erreur: err.message })
      else res.json({
        message: nouvelEtat === 1 ? '✅ Véhicule activé' : '⏸️ Véhicule désactivé',
        disponible: nouvelEtat
      })
    })
  })
})

// ─── DÉSACTIVER UN HÔTEL ─────────────────────────────────────────
router.put('/hotels/:id/desactiver', verifierToken, (req, res) => {
  const { id } = req.params

  db.get(`SELECT disponible FROM hotels WHERE id = ?`, [id], (err, row) => {
    if (err || !row) return res.status(404).json({ erreur: 'Hôtel introuvable' })

    const nouvelEtat = row.disponible === 1 ? 0 : 1

    db.run(`UPDATE hotels SET disponible = ? WHERE id = ?`, [nouvelEtat, id], (err) => {
      if (err) res.status(500).json({ erreur: err.message })
      else res.json({
        message: nouvelEtat === 1 ? '✅ Hôtel activé' : '⏸️ Hôtel désactivé',
        disponible: nouvelEtat
      })
    })
  })
})

// ─── SUPPRIMER UN VÉHICULE ───────────────────────────────────────
router.delete('/vehicules/:id', verifierToken, (req, res) => {
  db.run(`DELETE FROM vehicules WHERE id = ?`, [req.params.id], (err) => {
    if (err) res.status(500).json({ erreur: err.message })
    else res.json({ message: '🗑️ Véhicule supprimé' })
  })
})

// ─── SUPPRIMER UN HÔTEL ──────────────────────────────────────────
router.delete('/hotels/:id', verifierToken, (req, res) => {
  db.run(`DELETE FROM hotels WHERE id = ?`, [req.params.id], (err) => {
    if (err) res.status(500).json({ erreur: err.message })
    else res.json({ message: '🗑️ Hôtel supprimé' })
  })
})

module.exports = { router, verifierToken }