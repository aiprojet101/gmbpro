import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions legales - GmbPro",
  description: "Mentions legales du site GmbPro.fr",
  robots: { index: true, follow: true },
};

export default function Legal() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-32">
      <h1 className="text-3xl font-extrabold mb-8">Mentions legales</h1>
      <div className="space-y-6 text-[var(--text-muted)] leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-[var(--text)] mb-3">Editeur du site</h2>
          <p>GmbPro - SASU en cours d&apos;immatriculation</p>
          <p>Adresse : France</p>
          <p>Email : contact@gmbpro.fr</p>
          <p>Telephone : 07 43 34 11 17</p>
          <p>Directeur de la publication : Le president de la societe</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-[var(--text)] mb-3">Hebergement</h2>
          <p>Vercel Inc.</p>
          <p>440 N Barranca Ave #4133, Covina, CA 91723, USA</p>
          <p>Site : vercel.com</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-[var(--text)] mb-3">Propriete intellectuelle</h2>
          <p>L&apos;ensemble des contenus presents sur le site GmbPro.fr (textes, images, logos, icones, logiciels) sont proteges par le droit de la propriete intellectuelle et sont la propriete exclusive de GmbPro ou de ses partenaires.</p>
          <p>Toute reproduction, representation, modification ou exploitation non autorisee est interdite.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-[var(--text)] mb-3">Responsabilite</h2>
          <p>GmbPro s&apos;efforce de fournir des informations aussi precises que possible. Toutefois, elle ne pourra etre tenue responsable des omissions, inexactitudes ou carences dans la mise a jour.</p>
        </section>
      </div>
      <div className="mt-12">
        <a href="/" className="text-primary hover:underline text-sm">Retour a l&apos;accueil</a>
      </div>
    </main>
  );
}
