// On récupère les infos passées dans l'URL
const params  = new URLSearchParams(window.location.search)
const ref     = params.get('ref')
const type    = params.get('type')
const nom     = params.get('nom')
const debut   = params.get('debut')
const fin     = params.get('fin')
const total   = parseFloat(params.get('total'))

// On remplit chaque champ de la page
document.getElementById('conf-ref').textContent   = '#' + ref
document.getElementById('conf-type').textContent  = type === 'vehicule' ? 'Véhicule' : 'Hôtel'
document.getElementById('conf-nom').textContent   = nom
document.getElementById('conf-debut').textContent = debut
document.getElementById('conf-fin').textContent   = fin
document.getElementById('conf-total').textContent = total.toLocaleString() + ' FCFA'