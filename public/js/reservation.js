// Récupère les paramètres dans l'URL
const params = new URLSearchParams(window.location.search)
const type = params.get('type')
const id = params.get('id')
const nom = params.get('nom')
const prix = parseFloat(params.get('prix'))

// Affiche le résumé de ce qu'on réserve
document.getElementById('item-resume').innerHTML = `
  <div class="resume-card">
    <i class="fas fa-${type === 'vehicule' ? 'car' : 'hotel'}"></i>
    <div>
      <p class="resume-type">${type === 'vehicule' ? 'Véhicule' : 'Hôtel'}</p>
      <p class="resume-nom">${nom}</p>
      <p class="resume-prix">${prix.toLocaleString()} FCFA / ${type === 'vehicule' ? 'jour' : 'nuit'}</p>
    </div>
  </div>
`

// Calcule le prix total automatiquement selon les dates
function calculerPrix() {
  const debut = new Date(document.getElementById('date-debut').value)
  const fin = new Date(document.getElementById('date-fin').value)

  if (debut && fin && fin > debut) {
    const jours = Math.ceil((fin - debut) / (1000 * 60 * 60 * 24))
    const total = jours * prix
    document.getElementById('prix-total').innerHTML = `
      <div class="total-box">
        <span>${jours} ${type === 'vehicule' ? 'jour(s)' : 'nuit(s)'} × ${prix.toLocaleString()} FCFA</span>
        <strong>Total : ${total.toLocaleString()} FCFA</strong>
      </div>
    `
  }
}

document.getElementById('date-debut').addEventListener('change', calculerPrix)
document.getElementById('date-fin').addEventListener('change', calculerPrix)

// Envoie la réservation au backend
async function confirmerReservation() {
  const nom_client = document.getElementById('nom').value
  const email_client = document.getElementById('email').value
  const date_debut = document.getElementById('date-debut').value
  const date_fin = document.getElementById('date-fin').value

  if (!nom_client || !email_client || !date_debut || !date_fin) {
    alert('Veuillez remplir tous les champs !')
    return
  }

  const debut = new Date(date_debut)
  const fin = new Date(date_fin)
  const jours = Math.ceil((fin - debut) / (1000 * 60 * 60 * 24))
  const prix_total = jours * prix

  const response = await fetch('http://localhost:3000/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type, item_id: id,
      nom_client, email_client,
      date_debut, date_fin,
      prix_total
    })
  })

  const data = await response.json()

  if (data.message) {
  // Au lieu du simple alert, on redirige vers la page de confirmation
  // avec toutes les infos dans l'URL
  window.location.href = `confirmation.html?ref=${data.id}&type=${type}&nom=${encodeURIComponent(nom)}&debut=${date_debut}&fin=${date_fin}&total=${prix_total}`
} else {
  alert('❌ Une erreur est survenue, réessayez.')
}
}