import type { Metadata } from "next";
import Link from "next/link";
import ArticleLayout from "../components/ArticleLayout";

export const metadata: Metadata = {
  title: "Votre fiche Google est invisible ? Voici les 7 raisons (et comment y remedier) | GmbPro",
  description:
    "Si votre fiche Google n'apparait pas dans les resultats, l'une de ces 7 causes est probablement responsable. Diagnostic et solutions.",
  alternates: { canonical: "/blog/fiche-google-invisible" },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Votre fiche Google est invisible ? Voici les 7 raisons (et comment y remedier)",
    datePublished: "2026-04-01",
    dateModified: "2026-04-01",
    author: { "@type": "Organization", name: "GmbPro" },
    publisher: { "@type": "Organization", name: "GmbPro", url: "https://gmbpro.fr" },
    description: "Si votre fiche Google n'apparait pas, voici les 7 causes les plus frequentes.",
    mainEntityOfPage: "https://gmbpro.fr/blog/fiche-google-invisible",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ArticleLayout slug="fiche-google-invisible">
        <h2>Comment savoir si votre fiche Google est vraiment invisible</h2>

        <p>
          Avant de paniquer, faisons un diagnostic. Ouvrez une fenetre de navigation privee
          (incognito) et tapez le nom exact de votre entreprise sur Google. Si votre fiche
          n&apos;apparait pas du tout, il y a un probleme serieux. Si elle apparait pour votre nom
          mais pas pour des recherches generiques (&quot;boulangerie + votre ville&quot;), c&apos;est
          un probleme d&apos;optimisation, pas d&apos;invisibilite.
        </p>

        <p>
          La distinction est importante : <strong>invisibilite totale</strong> (votre fiche
          n&apos;existe pas dans l&apos;index Google) vs <strong>mauvais classement</strong> (votre
          fiche existe mais est enterree en page 3 de Google Maps). Les solutions sont differentes.
        </p>

        <blockquote>
          <p>
            Le <Link href="/scanner">scanner GmbPro</Link> detecte automatiquement si votre fiche
            est indexee et visible, et identifie les blocages en 30 secondes.
          </p>
        </blockquote>

        <h2>Les 7 causes d&apos;une fiche Google invisible</h2>

        <h3>1. Votre fiche n&apos;est pas verifiee</h3>

        <p>
          C&apos;est la cause numero 1. Google n&apos;affiche pas les fiches non verifiees dans
          les resultats. La verification se fait generalement par courrier postal (un code envoye
          a votre adresse), par telephone, par email, ou par video pour certaines categories.
        </p>

        <p>
          <strong>Solution :</strong> connectez-vous a votre Google Business Profile et lancez
          le processus de verification. Si vous avez perdu le code, vous pouvez en redemander.
          La verification prend generalement 5 a 14 jours par courrier.
        </p>

        <h3>2. Votre fiche a ete suspendue par Google</h3>

        <p>
          Google suspend les fiches qui enfreignent ses regles. Les causes les plus frequentes :
          mots-cles ajoutes dans le nom de l&apos;entreprise, adresse fictive ou partagee avec
          trop d&apos;entreprises, avis achetes detectes, contenu inapproprie.
        </p>

        <p>
          <strong>Solution :</strong> consultez votre tableau de bord Google Business Profile.
          Si votre fiche est suspendue, vous verrez un message explicatif. Corrigez l&apos;infraction
          et soumettez un formulaire de reinstatement. Comptez 3 a 7 jours pour la reactivation.
        </p>

        <h3>3. Informations NAP incoherentes</h3>

        <p>
          NAP = Nom, Adresse, Telephone. Si ces informations different entre votre fiche Google,
          votre site web, et vos annuaires, Google perd confiance et peut deprioriser votre
          fiche. L&apos;incoherence la plus courante : une virgule en plus, un &quot;Rue&quot;
          abrege en &quot;R.&quot;, un ancien numero de telephone sur un annuaire oublie.
        </p>

        <p>
          <strong>Solution :</strong> faites un audit NAP complet. Verifiez Pages Jaunes, Yelp,
          Facebook, votre site web, et tout annuaire ou vous etes inscrit. Harmonisez tout a
          l&apos;identique — au caractere pres. C&apos;est fastidieux mais critique pour votre{" "}
          <Link href="/blog/referencement-local-google">referencement local</Link>.
        </p>

        <h3>4. Categorie principale incorrecte ou trop generique</h3>

        <p>
          Si vous avez choisi &quot;Entreprise&quot; comme categorie au lieu de &quot;Plombier&quot;
          ou &quot;Boulangerie&quot;, Google ne sait pas pour quelles recherches vous afficher.
          Resultat : vous n&apos;apparaissez pour aucune.
        </p>

        <p>
          <strong>Solution :</strong> changez votre categorie principale pour la plus specifique
          possible. Consultez la liste officielle des categories Google Business (il en existe
          plus de 4 000). Ajoutez des categories secondaires pour couvrir vos activites
          complementaires.
        </p>

        <h3>5. Concurrence trop forte dans votre zone</h3>

        <p>
          Google n&apos;affiche que 3 fiches dans le Local Pack. Si vous etes dans un secteur
          concurrentiel dans une grande ville, il est possible que votre fiche soit simplement
          en 4e position ou plus loin. Elle n&apos;est pas invisible — elle est juste devancee.
        </p>

        <p>
          <strong>Solution :</strong> c&apos;est ici que l&apos;
          <Link href="/blog/optimiser-fiche-google-my-business">optimisation complete de votre fiche</Link>{" "}
          fait la difference. Plus d&apos;avis, de meilleures photos, des{" "}
          <Link href="/blog/google-posts-guide">Google Posts reguliers</Link>, des{" "}
          <Link href="/blog/avis-google-importance">reponses aux avis</Link> — chaque detail
          compte dans une competition serree.
        </p>

        <h3>6. Fiche en doublon</h3>

        <p>
          Il arrive qu&apos;une meme entreprise ait plusieurs fiches Google (suite a un
          demenagement, un changement de proprietaire, ou une creation accidentelle). Les doublons
          se cannibalisent mutuellement et Google peut choisir d&apos;ignorer les deux.
        </p>

        <p>
          <strong>Solution :</strong> recherchez votre entreprise sur Google Maps. Si vous trouvez
          un doublon, signalez-le comme &quot;doublon&quot; via le menu de la fiche. Si c&apos;est
          votre propre fiche, fusionnez-la depuis votre tableau de bord Google Business Profile.
        </p>

        <h3>7. Site web penalise ou inexistant</h3>

        <p>
          Votre fiche Google Business est liee a votre site web. Si votre site est penalise par
          Google (spam, malware, contenu duplique) ou si vous n&apos;avez tout simplement pas
          de site web, votre fiche en patit. Google utilise votre site pour confirmer la legitimite
          et la pertinence de votre fiche.
        </p>

        <p>
          <strong>Solution :</strong> verifiez l&apos;etat de votre site dans Google Search
          Console. Si vous n&apos;avez pas de site, creez au minimum une page d&apos;atterrissage
          avec vos informations de contact, votre adresse, et une description de vos services.
          Meme un site d&apos;une seule page aide.
        </p>

        <h2>Les outils pour diagnostiquer l&apos;invisibilite</h2>

        <p>
          <strong>Google Search Console :</strong> verifiez que votre site n&apos;a pas de
          penalite manuelle (section &quot;Actions manuelles&quot;). Verifiez aussi que votre
          site est bien indexe.
        </p>

        <p>
          <strong>Google Business Profile dashboard :</strong> votre tableau de bord vous donne
          des metriques de visibilite : combien de fois votre fiche a ete vue, sur quelles
          recherches, combien d&apos;actions ont ete realisees. Si tous les chiffres sont a
          zero depuis plus de 30 jours, il y a un probleme.
        </p>

        <p>
          <strong>Recherche en navigation privee :</strong> la methode la plus simple. Ouvrez un
          onglet incognito et cherchez votre entreprise par nom, puis par categorie + ville.
          Notez votre position.
        </p>

        <p>
          <strong>Le scanner GmbPro :</strong> notre outil analyse automatiquement 27 criteres
          de visibilite et vous donne un diagnostic precis avec un plan d&apos;action priorise.
          Gratuit et en 30 secondes.
        </p>

        <p>
          Une fiche Google invisible est un manque a gagner quotidien. Chaque jour ou vous
          n&apos;apparaissez pas, vos concurrents captent les clients qui auraient pu etre les
          votres. La bonne nouvelle : dans la majorite des cas, le probleme est resolvable en
          moins d&apos;une semaine.{" "}
          <Link href="/scanner">Lancez un diagnostic gratuit maintenant</Link> pour identifier
          exactement ce qui bloque votre visibilite.
        </p>
      </ArticleLayout>
    </>
  );
}
