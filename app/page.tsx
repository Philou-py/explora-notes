import { Metadata } from "next";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import NavBar from "@/components/NavBar";
import Container from "@/components/Container";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { readFileSync } from "fs";

const publicKey = readFileSync("public.key");

export const metadata: Metadata = {
  title: "ExploraNotes - Page d'accueil",
};

function checkAccountType() {
  const cookieStore = cookies();
  const jwt = cookieStore.get("X-ExploraNotes-Auth");
  if (!jwt) return;
  const payload = verify(jwt.value, publicKey, { algorithms: ["RS256"] });
  if (typeof payload !== "object") return;

  const { email, accountType } = payload;
  redirect(`/${accountType}/${email}`);
}

export default function Home() {
  checkAccountType();
  return (
    <>
      <NavBar />
      <Container>
        <h1 className="pageTitle text-center">Bienvenue dans ExploraNotes!</h1>
        <p className="text-justify">
          Cette application s&rsquo;adresse aux professeurs à la recherche d&rsquo;un outil
          informatique de saisie, de synthèse et d&rsquo;archivage des notes de leurs élèves. Elle
          permet de créer ses groupes d&rsquo;élèves, définir le barème de ses évaluations, saisir
          les résultats détaillés de chaque copie, consulter les moyennes de classes et les moyennes
          individuelles.
        </p>
        <p className="text-justify">
          Ce site a été créé pour répondre à la demande d&rsquo;un professeur. Son créateur sera
          ravi de l&rsquo;enrichir pour en faire l&rsquo;outil le plus utile possible.
          N&rsquo;hésitez pas à faire remonter vos remarques et vos suggestions en écrivant à
          l&rsquo;adresse indiquée ci-dessous.
        </p>
      </Container>
      <Footer />
    </>
  );
}
