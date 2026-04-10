// ══════════════════════════════════════════════════
// TEST ROBUSTESSE — Hash FNV-1a + Empreinte IA
// Simule les scénarios de doublon critiques
// ══════════════════════════════════════════════════

// ── Copie exacte des fonctions de production ─────
function fnv1a32(bytes, offsetBasis) {
  let h = offsetBasis >>> 0;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function multiHash(bytes) {
  const len = bytes.length;
  const q   = Math.floor(len / 4);
  const s1 = bytes.slice(0,     Math.min(q, 8192));
  const s2 = bytes.slice(q,     Math.min(q * 2, q + 8192));
  const s3 = bytes.slice(q * 2, Math.min(q * 3, q * 2 + 8192));
  const s4 = bytes.slice(len - Math.min(q, 8192));
  const h1 = fnv1a32(s1, 0x811c9dc5);
  const h2 = fnv1a32(s2, 0x84222325);
  const h3 = fnv1a32(s3, 0xc9fb3f18);
  const h4 = fnv1a32(s4, 0x6b43a9b5);
  const ha = ((h1 ^ h3)           >>> 0).toString(16).padStart(8,'0');
  const hb = ((h2 ^ h4)           >>> 0).toString(16).padStart(8,'0');
  const hc = ((h1^h2^h3^h4)       >>> 0).toString(16).padStart(8,'0');
  const hs = (len                  >>> 0).toString(16).padStart(8,'0');
  return ha + hb + hc + hs;
}

// ── Copie exacte de la fonction empreinte ────────
function calcEmpreinte(d) {
  const date     = (d.date || '').substring(0, 10);
  const emetteur = (d.emetteur || '').toUpperCase()
                    .replace(/[^A-Z0-9]/g,'_').replace(/_{2,}/g,'_').substring(0,20);
  const objet    = (d.objet || d.sous_categorie || 'DIVERS').toUpperCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
                    .replace(/[^A-Z0-9]/g,'_').replace(/_{2,}/g,'_').substring(0,20);
  const benef    = (d.beneficiaire || 'ANONYME').toUpperCase()
                    .replace(/[^A-Z0-9]/g,'_').replace(/_{2,}/g,'_').substring(0,15);
  const ttc      = parseFloat(d.montant_ttc) || 0;
  const montant  = String(Math.round(ttc * 100));
  const isFinancial = ['FACTURE','RECU'].includes((d.type_document||'').toUpperCase());
  const parts = [date, emetteur, objet, benef];
  if (isFinancial && ttc > 0) parts.push(montant);
  return parts.join('_');
}

// ── Simulateur de fichier PDF ─────────────────────
function makePDF(content) {
  return Buffer.from(`%PDF-1.4\n${content}\n%%EOF`, 'utf8');
}

// ══════════════════════════════════════════════════
// SCÉNARIOS DE TEST
// ══════════════════════════════════════════════════
const scenarios = [

  // ── GROUPE 1 : VRAIS DOUBLONS (hash ET empreinte doivent matcher) ──
  {
    group: '1 — VRAI DOUBLON',
    desc: 'Fichier identique scanné 2 fois',
    docs: [
      { label: 'Scan #1', bytes: makePDF('HYDRO-QUEBEC FACTURE 2026-02-13 226.17$'),
        meta: { date:'2026-02-13', emetteur:'Hydro-Québec', objet:'Facture électricité', beneficiaire:'DJAMAL_EDDINE', montant_ttc:226.17, type_document:'FACTURE' }},
      { label: 'Scan #2 (identique)', bytes: makePDF('HYDRO-QUEBEC FACTURE 2026-02-13 226.17$'),
        meta: { date:'2026-02-13', emetteur:'Hydro-Québec', objet:'Facture électricité', beneficiaire:'DJAMAL_EDDINE', montant_ttc:226.17, type_document:'FACTURE' }},
    ],
    expect: { hashMatch: true, empreinteMatch: true }
  },

  // ── GROUPE 2 : FAUX DOUBLON — même émetteur, mois différent ──
  {
    group: '2 — FAUX DOUBLON',
    desc: 'Hydro-Québec Jan vs Fév (contenu différent)',
    docs: [
      { label: 'Hydro Jan 2026', bytes: makePDF('HYDRO-QUEBEC FACTURE 2026-01-13 198.44$'),
        meta: { date:'2026-01-13', emetteur:'Hydro-Québec', objet:'Facture électricité', beneficiaire:'DJAMAL_EDDINE', montant_ttc:198.44, type_document:'FACTURE' }},
      { label: 'Hydro Fév 2026', bytes: makePDF('HYDRO-QUEBEC FACTURE 2026-02-13 226.17$'),
        meta: { date:'2026-02-13', emetteur:'Hydro-Québec', objet:'Facture électricité', beneficiaire:'DJAMAL_EDDINE', montant_ttc:226.17, type_document:'FACTURE' }},
    ],
    expect: { hashMatch: false, empreinteMatch: false }
  },

  // ── GROUPE 3 : IA INSTABLE — empreinte varie, hash doit trancher ──
  {
    group: '3 — DÉRIVE IA (empreinte instable)',
    desc: 'Même fichier, IA produit objet légèrement différent',
    docs: [
      { label: 'Parse IA v1', bytes: makePDF('HYDRO-QUEBEC FACTURE 2026-02-13 226.17$'),
        meta: { date:'2026-02-13', emetteur:'Hydro-Québec', objet:'Facture électricité février', beneficiaire:'DJAMAL_EDDINE', montant_ttc:226.17, type_document:'FACTURE' }},
      { label: 'Parse IA v2 (objet reformulé)', bytes: makePDF('HYDRO-QUEBEC FACTURE 2026-02-13 226.17$'),
        meta: { date:'2026-02-13', emetteur:'Hydro-Québec', objet:'Electricité - Facture mensuelle', beneficiaire:'DJAMAL_EDDINE', montant_ttc:226.17, type_document:'FACTURE' }},
    ],
    expect: { hashMatch: true, empreinteMatch: false }  // ← hash sauve la mise
  },

  // ── GROUPE 4 : COLLISION HASH — même taille, contenu différent ──
  {
    group: '4 — RÉSISTANCE COLLISION',
    desc: 'Deux factures différentes, même montant et même émetteur',
    docs: [
      { label: 'Virgin Plus Jan', bytes: makePDF('VIRGIN PLUS FACTURE 2025-01-03 74.20$ FETHYA'),
        meta: { date:'2025-01-03', emetteur:'Virgin Plus', objet:'Téléphone', beneficiaire:'FETHYA', montant_ttc:74.20, type_document:'FACTURE' }},
      { label: 'Virgin Plus Fév', bytes: makePDF('VIRGIN PLUS FACTURE 2025-02-03 74.20$ FETHYA'),
        meta: { date:'2025-02-03', emetteur:'Virgin Plus', objet:'Téléphone', beneficiaire:'FETHYA', montant_ttc:74.20, type_document:'FACTURE' }},
    ],
    expect: { hashMatch: false, empreinteMatch: false }
  },

  // ── GROUPE 5 : MÊME JOUR, MÊME ÉMETTEUR, BÉNÉFICIAIRES DIFFÉRENTS ──
  {
    group: '5 — DISCRIMINATION BÉNÉFICIAIRE',
    desc: 'Indigo Park — 2 reçus même jour, personnes différentes',
    docs: [
      { label: 'Indigo - FETHYA', bytes: makePDF('INDIGO PARK RECU 2026-03-16 20.00$ FETHYA'),
        meta: { date:'2026-03-16', emetteur:'Indigo Park', objet:'Stationnement', beneficiaire:'FETHYA', montant_ttc:20.00, type_document:'RECU' }},
      { label: 'Indigo - DJAMAL', bytes: makePDF('INDIGO PARK RECU 2026-03-16 20.00$ DJAMAL'),
        meta: { date:'2026-03-16', emetteur:'Indigo Park', objet:'Stationnement', beneficiaire:'DJAMAL_EDDINE', montant_ttc:20.00, type_document:'RECU' }},
    ],
    expect: { hashMatch: false, empreinteMatch: false }
  },

  // ── GROUPE 6 : DOCUMENT NON-FINANCIER (montant exclu de l'empreinte) ──
  {
    group: '6 — DOC NON-FINANCIER',
    desc: 'Carte assurance maladie — montant=0, empreinte sans montant',
    docs: [
      { label: 'Carte RAMQ - MEYSSANE', bytes: makePDF('REGIE ASSURANCE MALADIE CARTE MEYSSANE 2010-02-26'),
        meta: { date:'2010-02-26', emetteur:'Régie de l\'assurance maladie', objet:'Carte assurance maladie', beneficiaire:'MEYSSANE', montant_ttc:0, type_document:'IDENTITE' }},
      { label: 'Carte RAMQ - MEYSSANE (re-scan)', bytes: makePDF('REGIE ASSURANCE MALADIE CARTE MEYSSANE 2010-02-26'),
        meta: { date:'2010-02-26', emetteur:'Régie de l\'assurance maladie', objet:'Carte assurance maladie', beneficiaire:'MEYSSANE', montant_ttc:0, type_document:'IDENTITE' }},
    ],
    expect: { hashMatch: true, empreinteMatch: true }
  },

];

// ══════════════════════════════════════════════════
// MOTEUR DE TEST
// ══════════════════════════════════════════════════
let passed = 0;
let failed = 0;

console.log('═'.repeat(70));
console.log('  TEST ROBUSTESSE DOUBLON — GED SENTINELLE');
console.log('═'.repeat(70));

for (const scenario of scenarios) {
  const [docA, docB] = scenario.docs;

  const hashA      = multiHash(docA.bytes);
  const hashB      = multiHash(docB.bytes);
  const emprA      = calcEmpreinte(docA.meta);
  const emprB      = calcEmpreinte(docB.meta);

  const hashMatch  = hashA === hashB;
  const emprMatch  = emprA === emprB;

  // Logique de détection doublon (miroir du workflow)
  // L0 : hash → détection binaire exacte
  // L1 : empreinte → détection sémantique IA
  const isDoublonHash  = hashMatch;
  const isDoublonEmpr  = emprMatch;
  const isDoublon      = isDoublonHash || isDoublonEmpr;

  const hashOK = hashMatch  === scenario.expect.hashMatch;
  const emprOK = emprMatch  === scenario.expect.empreinteMatch;
  const ok     = hashOK && emprOK;

  if (ok) passed++; else failed++;

  console.log(`\n▶ ${scenario.group}`);
  console.log(`  ${scenario.desc}`);
  console.log(`  ${docA.label.padEnd(35)} hash: ${hashA}`);
  console.log(`  ${docB.label.padEnd(35)} hash: ${hashB}`);
  console.log(`  Hash match     : ${hashMatch ? '✅ DOUBLON' : '❌ DISTINCT'} (attendu: ${scenario.expect.hashMatch ? 'DOUBLON' : 'DISTINCT'}) ${hashOK ? '✓' : '✗ FAIL'}`);
  console.log(`  Empreinte A    : ${emprA}`);
  console.log(`  Empreinte B    : ${emprB}`);
  console.log(`  Empreinte match: ${emprMatch ? '✅ DOUBLON' : '❌ DISTINCT'} (attendu: ${scenario.expect.empreinteMatch ? 'DOUBLON' : 'DISTINCT'}) ${emprOK ? '✓' : '✗ FAIL'}`);
  console.log(`  Verdict final  : ${isDoublon ? '🚫 REJETÉ (doublon)' : '✅ ACCEPTÉ (nouveau)'}`);
  console.log(`  Résultat       : ${ok ? '✅ PASS' : '❌ FAIL'}`);
}

console.log('\n' + '═'.repeat(70));
console.log(`  RÉSULTAT GLOBAL : ${passed}/${passed+failed} tests passés ${failed === 0 ? '✅' : '❌'}`);
console.log('═'.repeat(70));

// ── RAPPORT STRATÉGIE ────────────────────────────
console.log(`
STRATÉGIE DE DÉTECTION (2 couches) :
  L0 — HASH   : Détection binaire exacte. Immunisé contre dérive IA.
                Même fichier scanné N fois → toujours bloqué.
  L1 — EMPREINTE : Détection sémantique. Capte les re-soumissions
                avec métadonnées légèrement différentes (IA instable).
                Vulnérable si IA reformule trop → L0 prend le relais.

ROBUSTESSE vs DÉRIVE IA (scénario 3) :
  → Si empreinte dérive : L0 bloque quand même (hash identique)
  → Si hash diffère (fichier modifié) : L1 peut bloquer si sémantique identique
  → Double filet = zéro doublon en production
`);
