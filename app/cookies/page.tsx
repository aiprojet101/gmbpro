import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de cookies - GmbPro",
  description: "Politique d'utilisation des cookies sur GmbPro.fr",
  robots: { index: true, follow: true },
};

export default function CookiesPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-32">
      <h1 className="text-3xl font-extrabold mb-8">Politique de cookies</h1>
      <div className="space-y-6 text-[var(--text-muted)] leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-[var(--text)] mb-3">Qu&apos;est-ce qu&apos;un cookie ?</h2>
          <p>
            Un cookie est un petit fichier texte stocke par votre navigateur lorsque vous visitez un site web.
            Il permet au site de reconnaitre votre navigateur et de memoriser certaines informations
            pour faciliter votre experience.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text)] mb-3">Cookies utilises sur GmbPro</h2>
          <p className="mb-3">
            GmbPro n&apos;utilise <strong>aucun cookie publicitaire</strong> ni cookie de tracking tiers.
            Nous utilisons uniquement les cookies suivants, strictement necessaires au fonctionnement du service :
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Cookies de session (Supabase Auth)</strong> : permettent de maintenir votre connexion au tableau de bord.
              Duree : duree de la session.
            </li>
            <li>
              <strong>Cookies de securite (CSRF)</strong> : protegent contre les attaques inter-sites lors des paiements et des connexions OAuth.
              Duree : 10 minutes.
            </li>
            <li>
              <strong>Cookie de consentement</strong> : memorise votre choix relatif aux cookies pour ne pas vous redemander a chaque visite.
              Duree : 13 mois.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text)] mb-3">Cookies tiers</h2>
          <p className="mb-3">
            Lors d&apos;un paiement, vous etes redirige vers <strong>Stripe</strong> qui peut deposer
            ses propres cookies pour securiser la transaction. Ces cookies sont regis par la
            <a href="https://stripe.com/cookies-policy/legal" className="text-[var(--primary-light)] hover:underline" target="_blank" rel="noopener noreferrer"> politique de cookies de Stripe</a>.
          </p>
          <p>
            De la meme facon, la connexion a votre fiche Google Business Profile passe par
            <strong> Google OAuth</strong>, qui depose des cookies pour authentifier la session.
            Voir la <a href="https://policies.google.com/technologies/cookies" className="text-[var(--primary-light)] hover:underline" target="_blank" rel="noopener noreferrer">politique Google</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text)] mb-3">Gerer vos preferences</h2>
          <p className="mb-3">
            Lors de votre premiere visite, une banniere vous permet d&apos;accepter ou refuser les cookies.
            Vous pouvez a tout moment modifier votre choix en supprimant les cookies depuis les parametres de votre navigateur.
          </p>
          <p>
            Note : les cookies essentiels (session, securite) sont obligatoires pour utiliser GmbPro.
            Les refuser empeche l&apos;utilisation du service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text)] mb-3">Contact</h2>
          <p>
            Pour toute question relative a notre politique de cookies, vous pouvez nous contacter a
            <strong> contact@gmbpro.fr</strong> ou au <strong>07 43 34 11 17</strong>.
          </p>
        </section>
      </div>
      <div className="mt-12">
        <a href="/" className="text-primary hover:underline text-sm">Retour a l&apos;accueil</a>
      </div>
    </main>
  );
}
