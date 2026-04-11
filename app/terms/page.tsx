import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions generales d'utilisation - GmbPro",
  description: "CGU du service GmbPro.fr",
  robots: { index: true, follow: true },
};

export default function Terms() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-32">
      <h1 className="text-3xl font-extrabold mb-8">Conditions generales d&apos;utilisation</h1>
      <div className="space-y-6 text-[var(--text-muted)] leading-relaxed">
        <p>Derniere mise a jour : avril 2026</p>

        <section>
          <h2 className="text-xl font-bold text-[var(--text)] mb-3">Article 1 - Objet</h2>
          <p>Les presentes CGU regissent l&apos;utilisation du service GmbPro, plateforme d&apos;optimisation automatique de fiches Google Business Profile.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text)] mb-3">Article 2 - Acces au service</h2>
          <p>L&apos;acces au service necessite la creation d&apos;un compte et la souscription a un forfait. L&apos;utilisateur s&apos;engage a fournir des informations exactes et a jour.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text)] mb-3">Article 3 - Forfaits et tarification</h2>
          <p>GmbPro propose trois forfaits : Starter (29 euros, paiement unique), Pro (39 euros/mois) et Premium (59 euros/mois). Les prix sont indiques TTC. Les forfaits mensuels sont sans engagement et resiliables a tout moment.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text)] mb-3">Article 4 - Obligations de l&apos;utilisateur</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Fournir un acces valide a sa fiche Google Business via OAuth</li>
            <li>Ne pas utiliser le service a des fins illegales ou abusives</li>
            <li>Ne pas tenter de contourner les mesures de securite</li>
            <li>Respecter les conditions d&apos;utilisation de Google</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text)] mb-3">Article 5 - Responsabilite</h2>
          <p>GmbPro s&apos;engage a mettre en oeuvre les moyens necessaires pour fournir un service de qualite. Toutefois, GmbPro ne garantit pas de resultats specifiques en termes de classement Google, celui-ci dependant de nombreux facteurs externes.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text)] mb-3">Article 6 - Resiliation</h2>
          <p>L&apos;utilisateur peut resilier son abonnement a tout moment depuis son dashboard. La resiliation prend effet a la fin de la periode de facturation en cours. Les optimisations deja appliquees restent en place.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text)] mb-3">Article 7 - Propriete intellectuelle</h2>
          <p>Le service GmbPro, ses algorithmes, son interface et ses contenus sont proteges par le droit de la propriete intellectuelle. Toute reproduction non autorisee est interdite.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text)] mb-3">Article 8 - Droit applicable</h2>
          <p>Les presentes CGU sont soumises au droit francais. Tout litige sera soumis aux tribunaux competents de Paris.</p>
        </section>
      </div>
      <div className="mt-12">
        <a href="/" className="text-primary hover:underline text-sm">Retour a l&apos;accueil</a>
      </div>
    </main>
  );
}
