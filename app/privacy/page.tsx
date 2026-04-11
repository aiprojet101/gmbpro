import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialite - GmbPro",
  description: "Politique de confidentialite et protection des donnees personnelles de GmbPro.fr",
  robots: { index: true, follow: true },
};

export default function Privacy() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-32">
      <h1 className="text-3xl font-extrabold mb-8">Politique de confidentialite</h1>
      <div className="space-y-6 text-[var(--text-muted)] leading-relaxed">
        <p>Derniere mise a jour : avril 2026</p>

        <section>
          <h2 className="text-xl font-bold text-[var(--text)] mb-3">Responsable du traitement</h2>
          <p>GmbPro, SASU en cours d&apos;immatriculation. Contact : contact@gmbpro.fr</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text)] mb-3">Donnees collectees</h2>
          <p>Nous collectons les donnees suivantes :</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Donnees d&apos;identification : nom, prenom, email</li>
            <li>Donnees de connexion : adresse IP, logs de connexion</li>
            <li>Donnees Google Business : informations de votre fiche (via OAuth)</li>
            <li>Donnees de paiement : traitees exclusivement par Stripe</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text)] mb-3">Finalites</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Fourniture et amelioration du service GmbPro</li>
            <li>Gestion de votre compte et facturation</li>
            <li>Communication relative au service</li>
            <li>Analyses statistiques anonymisees</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text)] mb-3">Base legale</h2>
          <p>Le traitement est fonde sur l&apos;execution du contrat (article 6.1.b du RGPD) et votre consentement (article 6.1.a).</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text)] mb-3">Duree de conservation</h2>
          <p>Vos donnees sont conservees pendant la duree de votre abonnement et 3 ans apres la fin de la relation commerciale, conformement aux obligations legales.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text)] mb-3">Vos droits</h2>
          <p>Conformement au RGPD, vous disposez des droits suivants :</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Droit d&apos;acces a vos donnees</li>
            <li>Droit de rectification</li>
            <li>Droit a l&apos;effacement</li>
            <li>Droit a la portabilite</li>
            <li>Droit d&apos;opposition</li>
            <li>Droit de retirer votre consentement</li>
          </ul>
          <p className="mt-2">Pour exercer ces droits : contact@gmbpro.fr</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text)] mb-3">Hebergement et securite</h2>
          <p>Les donnees sont hebergees par Vercel (USA) avec des garanties adequates (clauses contractuelles types). Les connexions sont chiffrees via TLS/SSL.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text)] mb-3">Cookies</h2>
          <p>GmbPro utilise uniquement des cookies strictement necessaires au fonctionnement du service. Aucun cookie publicitaire ou de tracking tiers n&apos;est utilise.</p>
        </section>
      </div>
      <div className="mt-12">
        <a href="/" className="text-primary hover:underline text-sm">Retour a l&apos;accueil</a>
      </div>
    </main>
  );
}
