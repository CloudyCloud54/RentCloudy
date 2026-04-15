const db = require('./database')
const bcrypt = require('bcrypt')

const email = 'anna@kevin.com'
const motDePasse = 'anna1234'

// bcrypt transforme "admin1234" en quelque chose comme "$2b$10$xK9..."
// Le "10" = nombre de rounds de hashage (plus c'est élevé, plus c'est sécurisé)
bcrypt.hash(motDePasse, 10, (err, hash) => {
  if (err) return console.error(err)

  db.run(
    `INSERT INTO admins (email, password) VALUES (?, ?)`,
    [email, hash],
    (err) => {
      if (err) {
        console.error('Erreur :', err.message)
      } else {
        console.log('✅ Admin créé avec succès !')
        console.log('Email    :', email)
        console.log('Password :', motDePasse)
      }
    }
  )
})