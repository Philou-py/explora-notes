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
  title: "ExploraNotes - Page d’accueil",
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
      <Container narrow>
        <h1 className="pageTitle text-center mx-0">Bienvenue dans ExploraNotes !</h1>
        <p className="text-justify">
          Cette application s&rsquo;adresse aux professeurs à la recherche d&rsquo;un outil
          informatique de saisie, de synthèse et d&rsquo;archivage des notes de leurs élèves. Elle
          permet de créer ses groupes d&rsquo;élèves, de définir le barème de ses évaluations et de
          saisir les résultats détaillés de chaque copie.
        </p>
        <p className="text-justify">
          Une fois les copies corrigées et les résultats publiés, les élèves possédant un compte
          peuvent rapidement consulter le détail de leurs notes. Pour rejoindre un groupe, rien de
          plus simple : il suffit de scanner un QR Code fourni par le professeur.
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
