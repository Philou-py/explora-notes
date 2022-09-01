import Head from "next/head";
import { Container } from "../components";

export default function Home() {
  return (
    <Container>
      <Head>
        <title>Page d&rsquo;accueil - ExploraNotes</title>
      </Head>

      <h1 className="pageTitle text-center">Bienvenue dans ExploraNotes!</h1>
      <p className="text-justify">
        Cette application est destinée aux professeurs qui pourront créer leurs groupes
        d&rsquo;élèves, saisir le barème des évaluations et renseigner les résultats.
      </p>
    </Container>
  );
}
