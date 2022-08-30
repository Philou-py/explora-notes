// import cn from "classnames/bind";
// import pageStyles from "../pageStyles/Home.module.scss";
import { Container } from "../components";

// const cx = cn.bind(pageStyles);

export default function Home() {
  return (
    <>
      <h1 className="pageTitle text-center">Welcome to ExploraNotes!</h1>
      <Container>
        <p className="text-justify">
          Cette application est destinée aux professeurs qui pourront créer leurs groupes
          d&rsquo;élèves, saisir le barème des évaluations et renseigner les résultats.
        </p>
      </Container>
    </>
  );
}
