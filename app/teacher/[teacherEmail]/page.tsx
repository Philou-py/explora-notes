import Container from "@/components/Container";

export default function TeacherHome() {
  return (
    <Container>
      <h1 className="pageTitle text-center">Professeur, Bienvenue dans ExploraNotes!</h1>
      <p className="text-justify">
        Cette application s&rsquo;adresse aux professeurs à la recherche d&rsquo;un outil
        informatique de saisie, de synthèse et d&rsquo;archivage des notes de leurs élèves. Elle
        permet de créer ses groupes d&rsquo;élèves, définir le barème de ses évaluations, saisir les
        résultats détaillés de chaque copie, consulter les moyennes de classes et les moyennes
        individuelles.
      </p>
      <p className="text-justify">
        Ce site a été créé pour répondre à la demande d&rsquo;un professeur. Son créateur sera ravi
        de l&rsquo;enrichir pour en faire l&rsquo;outil le plus utile possible. N&rsquo;hésitez pas
        à faire remonter vos remarques et vos suggestions en écrivant à l&rsquo;adresse indiquée
        ci-dessous.
      </p>
    </Container>
  );
}
