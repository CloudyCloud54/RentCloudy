// Charge les variables d'environnement depuis le fichier .env
try { require('dotenv').config() } catch(e) {}

const express = require('express')
const cors = require('cors')
const path = require('path')
const db = require('./backend/database')
const routes = require('./backend/routes')
const { router: adminRoutes } = require('./backend/adminRoutes')
const { router: clientRoutes } = require('./backend/clientRoutes')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'))
})

app.use('/api', routes)
app.use('/admin', adminRoutes)
app.use('/client', clientRoutes)

app.listen(PORT, () => {
  console.log(`🚀 Serveur RentCloudy sur http://localhost:${PORT}`)
})
