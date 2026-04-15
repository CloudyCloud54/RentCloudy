const db = require('./database')

// Véhicules
const vehicules = [
  {
    nom: 'Toyota Corolla',
    type: 'Berline',
    prix_par_jour: 25000,
    places: 5,
    image: 'corolla.jpg'
  },
  {
    nom: 'Mercedes Classe C',
    type: 'Berline Premium',
    prix_par_jour: 55000,
    places: 5,
    image: 'mercedes.jpg'
  },
  {
    nom: 'Toyota Land Cruiser',
    type: 'SUV',
    prix_par_jour: 75000,
    places: 7,
    image: 'landcruiser.jpg'
  },
  {
    nom: 'Minibus 15 places',
    type: 'Minibus',
    prix_par_jour: 90000,
    places: 15,
    image: 'minibus.jpg'
  }
]

// Hôtels
const hotels = [
  {
    nom: 'Hôtel Hilton Yaoundé',
    ville: 'Yaoundé',
    prix_par_nuit: 120000,
    etoiles: 5,
    image: 'hilton.jpg'
  },
  {
    nom: 'Hôtel Mont Fébé',
    ville: 'Yaoundé',
    prix_par_nuit: 85000,
    etoiles: 4,
    image: 'montfebe.jpg'
  },
  {
    nom: 'Hôtel Akwa Palace',
    ville: 'Douala',
    prix_par_nuit: 95000,
    etoiles: 4,
    image: 'akwa.jpg'
  },
  {
    nom: 'Hôtel La Falaise',
    ville: 'Douala',
    prix_par_nuit: 65000,
    etoiles: 3,
    image: 'falaise.jpg'
  }
]

// Insertion des véhicules
vehicules.forEach(v => {
  db.run(
    `INSERT INTO vehicules (nom, type, prix_par_jour, places, image) 
     VALUES (?, ?, ?, ?, ?)`,
    [v.nom, v.type, v.prix_par_jour, v.places, v.image],
    (err) => {
      if (err) {
        console.error('Erreur véhicule :', err.message)
      } else {
        console.log(`✅ Véhicule ajouté : ${v.nom}`)
      }
    }
  )
})

// Insertion des hôtels
hotels.forEach(h => {
  db.run(
    `INSERT INTO hotels (nom, ville, prix_par_nuit, etoiles, image) 
     VALUES (?, ?, ?, ?, ?)`,
    [h.nom, h.ville, h.prix_par_nuit, h.etoiles, h.image],
    (err) => {
      if (err) {
        console.error('Erreur hôtel :', err.message)
      } else {
        console.log(`✅ Hôtel ajouté : ${h.nom}`)
      }
    }
  )
})