// ─── VÉRIF CONNEXION ─────────────────────────────────
if (!localStorage.getItem('clientToken')) {
  window.location.href = `connexion.html?redirect=${encodeURIComponent(window.location.href)}`
}

// ─── PARAMÈTRES URL ──────────────────────────────────
const params = new URLSearchParams(window.location.search)
const type = params.get('type')
const id   = params.get('id')
const nom  = params.get('nom')
const prix = parseFloat(params.get('prix'))

// ─── STRIPE INIT ─────────────────────────────────────
const STRIPE_PUBLIC_KEY = 'pk_test_51TN2qiBpSHdivOMG3PNifIRnuY8eGoHmf8avwnEyBLofvd0Lg6gMYzVYRm0wC6kbeabqrNI86INxdbmLkS4x2RjM00qNbUQyah'
let stripe, cardElement, prixTotal = 0
let methodePaiement = 'campay' // 'campay' | 'stripe'
let campayReference = null

// ─── AUTO-REMPLISSAGE DEPUIS LE PROFIL ───────────────
async function chargerInfosClient() {
  try {
    const res = await fetch('/client/profil', {
      headers: { 'Authorization': localStorage.getItem('clientToken') }
    })
    const data = await res.json()
    if (data.erreur) return

    document.getElementById('nom').value = data.nom || ''
    document.getElementById('email').value = data.email || ''

    // Si le champ téléphone existe (pour Campay)
    const telField = document.getElementById('telephone')
    if (telField && data.telephone) {
      telField.value = data.telephone
    }
  } catch (e) {
    // Fallback silencieux — on laisse le client remplir
  }
}

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
  const debut  = new Date(document.getElementById('date-debut').value)
  const fin    = new Date(document.getElementById('date-fin').value)
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
const today = new Date().toISOString().split('T')[0]
document.getElementById('date-debut').min = today
document.getElementById('date-fin').min = today

// ─── SÉLECTION MÉTHODE DE PAIEMENT ───────────────────
function choisirMethode(methode) {
  methodePaiement = methode
  document.querySelectorAll('.pay-option').forEach(el => el.classList.remove('selected'))
  document.getElementById(`pay-${methode}`).classList.add('selected')

  // Affiche/cache les sections correspondantes
  document.getElementById('campay-form').style.display = methode === 'campay' ? 'block' : 'none'
  document.getElementById('stripe-form').style.display = methode === 'stripe' ? 'block' : 'none'

  if (methode === 'stripe' && !stripe) {
    initStripe()
  }
}

// ─── ÉTAPE 1 → ÉTAPE 2 ───────────────────────────────
async function passerAuPaiement() {
  const nomClient   = document.getElementById('nom').value.trim()
  const emailClient = document.getElementById('email').value.trim()
  const dateDebut   = document.getElementById('date-debut').value
  const dateFin     = document.getElementById('date-fin').value

  if (!nomClient || !emailClient || !dateDebut || !dateFin) {
    alert('Veuillez remplir tous les champs !')
    return
  }

  if (new Date(dateFin) <= new Date(dateDebut)) {
    document.getElementById('erreur-dates').style.display = 'block'
    return
  }

  if (prixTotal <= 0) {
    alert('Erreur de calcul du prix, vérifiez les dates.')
    return
  }

  // Passe à l'étape 2
  document.getElementById('section-infos').style.display = 'none'
  document.getElementById('paiement-section').style.display = 'block'
  document.getElementById('etape-1').classList.remove('active')
  document.getElementById('etape-1').classList.add('done')
  document.getElementById('etape-2').classList.add('active')

  // Récap
  const jours = Math.ceil((new Date(dateFin) - new Date(dateDebut)) / (1000 * 60 * 60 * 24))
  document.getElementById('prix-recap').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span>📋 ${nom} — ${jours} ${type === 'vehicule' ? 'jour(s)' : 'nuit(s)'}</span>
      <strong style="color:#16a34a;font-size:1.1rem;">${prixTotal.toLocaleString()} FCFA</strong>
    </div>
  `
}

function retourInfos() {
  document.getElementById('paiement-section').style.display = 'none'
  document.getElementById('section-infos').style.display = 'block'
  document.getElementById('etape-2').classList.remove('active')
  document.getElementById('etape-1').classList.remove('done')
  document.getElementById('etape-1').classList.add('active')
}

// ─── INIT STRIPE ─────────────────────────────────────
function initStripe() {
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

// ─── PAYER AVEC CAMPAY (Mobile Money) ────────────────
async function payerCampay() {
  const telephone = document.getElementById('campay-tel').value.trim()
  if (!telephone) {
    alert('Entrez votre numéro de téléphone Mobile Money')
    return
  }

  const btn = document.getElementById('btn-campay')
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Initiation...'

  document.getElementById('campay-status').style.display = 'none'
  document.getElementById('campay-error').style.display = 'none'

  try {
    const res = await fetch('/api/campay/payer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        montant: prixTotal,
        telephone,
        description: `Réservation ${nom}`
      })
    })
    const data = await res.json()

    if (data.erreur) throw new Error(data.erreur)

    campayReference = data.reference
    btn.innerHTML = '<i class="fas fa-mobile-alt"></i> En attente...'

    // Affiche l'instruction
    const statusDiv = document.getElementById('campay-status')
    statusDiv.style.display = 'block'
    statusDiv.innerHTML = `
      <div style="text-align:center;padding:1rem;">
        <div style="font-size:2rem;margin-bottom:0.5rem;">📱</div>
        <p style="font-weight:600;color:#1e293b;">Confirmez sur votre téléphone</p>
        <p style="color:#64748b;font-size:0.88rem;margin-top:0.25rem;">
          Une demande de paiement de <strong>${prixTotal.toLocaleString()} FCFA</strong>
          a été envoyée au ${telephone}
        </p>
        ${data.ussd_code ? `<p style="margin-top:0.5rem;color:#64748b;font-size:0.85rem;">Code USSD : <strong>${data.ussd_code}</strong></p>` : ''}
        <div style="margin-top:1rem;" id="campay-polling-msg">
          <i class="fas fa-spinner fa-spin" style="color:#3b82f6;"></i>
          Vérification en cours...
        </div>
      </div>
    `

    // Polling du statut toutes les 5 secondes (max 12 fois = 1 min)
    let tentatives = 0
    const intervalle = setInterval(async () => {
      tentatives++
      try {
        const statRes = await fetch(`/api/campay/statut/${campayReference}`)
        const statData = await statRes.json()

        if (statData.status === 'SUCCESSFUL') {
          clearInterval(intervalle)
          await enregistrerReservation()
        } else if (statData.status === 'FAILED') {
          clearInterval(intervalle)
          document.getElementById('campay-polling-msg').innerHTML =
            '<span style="color:#ef4444;"><i class="fas fa-times-circle"></i> Paiement refusé ou annulé</span>'
          btn.disabled = false
          btn.innerHTML = '<i class="fas fa-mobile-alt"></i> Réessayer'
        } else if (tentatives >= 12) {
          clearInterval(intervalle)
          document.getElementById('campay-polling-msg').innerHTML =
            '<span style="color:#f59e0b;"><i class="fas fa-exclamation-triangle"></i> Délai expiré. Vérifiez votre téléphone.</span>'
          btn.disabled = false
          btn.innerHTML = '<i class="fas fa-mobile-alt"></i> Réessayer'
        }
      } catch(e) { /* continue */ }
    }, 5000)

  } catch (err) {
    const errDiv = document.getElementById('campay-error')
    errDiv.textContent = '❌ ' + err.message
    errDiv.style.display = 'block'
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-mobile-alt"></i> Payer avec Mobile Money'
  }
}

// ─── PAYER AVEC STRIPE (Carte) ────────────────────────
async function payerStripe() {
  const btnText  = document.getElementById('btn-stripe-text')
  const spinner  = document.getElementById('stripe-spinner')
  const btnPayer = document.getElementById('btn-stripe')

  btnPayer.disabled = true
  btnText.textContent = 'Traitement...'
  spinner.style.display = 'inline'

  try {
    const piRes = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ montant: prixTotal })
    })
    const piData = await piRes.json()
    if (piData.erreur) throw new Error(piData.erreur)

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
      btnText.textContent = 'Payer par carte'
      spinner.style.display = 'none'
      return
    }

    if (paymentIntent.status === 'succeeded') {
      await enregistrerReservation()
    }
  } catch (err) {
    alert('❌ ' + err.message)
    btnPayer.disabled = false
    btnText.textContent = 'Payer par carte'
    spinner.style.display = 'none'
  }
}

// ─── ENREGISTREMENT RÉSERVATION ───────────────────────
async function enregistrerReservation() {
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
    document.getElementById('etape-2').classList.remove('active')
    document.getElementById('etape-2').classList.add('done')
    document.getElementById('etape-3').classList.add('active')

    window.location.href = `confirmation.html?ref=${resaData.id}&type=${type}&nom=${encodeURIComponent(nom)}&debut=${document.getElementById('date-debut').value}&fin=${document.getElementById('date-fin').value}&total=${prixTotal}`
  } else {
    throw new Error(resaData.erreur || 'Erreur lors de la réservation')
  }
}

// ─── INIT ─────────────────────────────────────────────
chargerInfosClient()
