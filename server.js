const express = require('express')
const cors = require('cors')
const path = require('path')
const db = require('./backend/database')
const routes = require('./backend/routes')
const { router: adminRoutes } = require('./backend/adminRoutes')

const app = express()
const PORT = process.env.PORT || 3000

// Middlewares
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

// Routes API
app.use('/api', routes)
app.use('/admin', adminRoutes)

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`)
})