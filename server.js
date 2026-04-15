const express = require('express')
const cors = require('cors')
const path = require('path')
const db = require('./backend/database')
const routes = require('./backend/routes')
const { router: adminRoutes } = require('./backend/adminRoutes')

const app = express()

// 🔥 IMPORTANT
const PORT = process.env.PORT || 3000

// Middlewares
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

// Route principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Routes API
app.use('/api', routes)
app.use('/admin', adminRoutes)

// Démarrage
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`)
})