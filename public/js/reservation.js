// ─── VÉRIF CONNEXION ──────────────────────────────────
if (!localStorage.getItem('clientToken')) {
  window.location.href = `connexion.html?redirect=${encodeURIComponent(window.location.href)}`
}

// ─── PARAMÈTRES URL ───────────────────────────────────
const params = new URLSearchParams(window.location.search)
const type      = params.get('type')
const id        = params.get('id')
const nom       = params.get('nom')
const prix      = parseFloat(params.get('prix'))

// ─── STRIPE INIT ─────────────────────────────────────
// Remplacez par votre clé publique Stripe (pk_test_...)
const STRIPE_PUBLIC_KEY = 'pk_test_51TN2qiBpSHdivOMG3PNifIRnuY8eGoHmf8avwnEyBLofvd0Lg6gMYzVYRm0wC6kbeabqrNI86INxdbmLkS4x2RjM00qNbUQyah'
let stripe, cardElement, prixTotal = 0

// ─── RÉSUMÉ DE L'ITEM ────────────────────────────────
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

// ─── CALCUL PRIX + VALIDATION DATES ──────────────────
function calculerPrix() {
  const debut = new Date(document.getElementById('date-debut').value)
  const fin   = new Date(document.getElementById('date-fin').value)
  const erreur = document.getElementById('erreur-dates')

  if (!document.getElementById('date-debut').value || !document.getElementById('date-fin').value) return

  if (fin <= debut) {
    erreur.style.display = 'block'
    document.getElementById('prix-total').innerHTML = ''
    prixTotal = 0
    return
  }

  erreur.style.display = 'none'
  const jours = Math.ceil((fin - debut) / (1000 * 60 * 60 * 24))
  prixTotal = jours * prix

  document.getElementById('prix-total').innerHTML = `
    <div class="total-box">
      <span>${jours} ${type === 'vehicule' ? 'jour(s)' : 'nuit(s)'} × ${prix.toLocaleString()} FCFA</span>
      <strong>Total : ${prixTotal.toLocaleString()} FCFA</strong>
    </div>
  `
}

document.getElementById('date-debut').addEventListener('change', calculerPrix)
document.getElementById('date-fin').addEventListener('change', calculerPrix)

// Empêche de choisir une date passée
const today = new Date().toISOString().split('T')[0]
document.getElementById('date-debut').min = today
document.getElementById('date-fin').min = today

// ─── ÉTAPE 1 → ÉTAPE 2 : Validation + Init Stripe ───
async function passerAuPaiement() {
  const nomClient   = document.getElementById('nom').value.trim()
  const emailClient = document.getElementById('email').value.trim()
  const dateDebut   = document.getElementById('date-debut').value
  const dateFin     = document.getElementById('date-fin').value

  if (!nomClient || !emailClient || !dateDebut || !dateFin) {
    alert('Veuillez remplir tous les champs !')
    return
  }

  const debut = new Date(dateDebut)
  const fin   = new Date(dateFin)

  if (fin <= debut) {
    document.getElementById('erreur-dates').style.display = 'block'
    return
  }

  if (prixTotal <= 0) {
    alert('Erreur de calcul du prix, vérifiez les dates.')
    return
  }

  // Passe à l'étape 2
  document.getElementById('section-infos').style.display = 'none'
  document.getElementById('stripe-section').style.display = 'block'
  document.getElementById('etape-1').classList.remove('active')
  document.getElementById('etape-1').classList.add('done')
  document.getElementById('etape-2').classList.add('active')

  // Récap prix
  const jours = Math.ceil((fin - debut) / (1000 * 60 * 60 * 24))
  document.getElementById('prix-recap').innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span>📋 ${nom} — ${jours} ${type === 'vehicule' ? 'jour(s)' : 'nuit(s)'}</span>
      <strong style="color:#16a34a; font-size:1.1rem;">${prixTotal.toLocaleString()} FCFA</strong>
    </div>
  `

  // Init Stripe Elements
  if (!stripe) {
    stripe = Stripe(STRIPE_PUBLIC_KEY)
    const elements = stripe.elements()
    cardElement = elements.create('card', {
      style: {
        base: { fontFamily: 'Poppins, sans-serif', fontSize: '16px', color: '#1e293b' },
        invalid: { color: '#ef4444' }
      }
    })
    cardElement.mount('#card-element')
    cardElement.on('change', (e) => {
      document.getElementById('card-errors').textContent = e.error ? e.error.message : ''
    })
  }
}

function retourInfos() {
  document.getElementById('stripe-section').style.display = 'none'
  document.getElementById('section-infos').style.display = 'block'
  document.getElementById('etape-2').classList.remove('active')
  document.getElementById('etape-1').classList.remove('done')
  document.getElementById('etape-1').classList.add('active')
}

// ─── ÉTAPE 2 : PAIEMENT + ENREGISTREMENT ─────────────
async function payerEtReserver() {
  const btnText = document.getElementById('btn-payer-text')
  const spinner = document.getElementById('spinner')
  const btnPayer = document.getElementById('btn-payer')

  btnPayer.disabled = true
  btnText.textContent = 'Traitement...'
  spinner.style.display = 'inline'

  try {
    // 1. Créer un Payment Intent côté serveur
    const piRes = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ montant: prixTotal })
    })
    const piData = await piRes.json()

    if (piData.erreur) {
      throw new Error(piData.erreur)
    }

    // 2. Confirmer le paiement avec Stripe.js
    const { error, paymentIntent } = await stripe.confirmCardPayment(piData.client_secret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: document.getElementById('nom').value,
          email: document.getElementById('email').value
        }
      }
    })

    if (error) {
      document.getElementById('card-errors').textContent = error.message
      btnPayer.disabled = false
      btnText.textContent = 'Payer et confirmer'
      spinner.style.display = 'none'
      return
    }

    if (paymentIntent.status === 'succeeded') {
      // 3. Enregistrer la réservation en base
      const resaRes = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          item_id: id,
          nom_client: document.getElementById('nom').value,
          email_client: document.getElementById('email').value,
          date_debut: document.getElementById('date-debut').value,
          date_fin: document.getElementById('date-fin').value,
          prix_total: prixTotal
        })
      })

      const resaData = await resaRes.json()

      if (resaData.id) {
        // 4. Mise à jour étapes
        document.getElementById('etape-2').classList.remove('active')
        document.getElementById('etape-2').classList.add('done')
        document.getElementById('etape-3').classList.add('active')

        // 5. Redirection confirmation
        window.location.href = `confirmation.html?ref=${resaData.id}&type=${type}&nom=${encodeURIComponent(nom)}&debut=${document.getElementById('date-debut').value}&fin=${document.getElementById('date-fin').value}&total=${prixTotal}`
      } else {
        throw new Error(resaData.erreur || 'Erreur lors de la réservation')
      }
    }

  } catch (err) {
    alert('❌ ' + err.message)
    btnPayer.disabled = false
    btnText.textContent = 'Payer et confirmer'
    spinner.style.display = 'none'
  }
}
