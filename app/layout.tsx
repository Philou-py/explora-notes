import "@/styles/globals.scss";
import "@/styles/typography.scss";
import "@/styles/colours.scss";
import SnackProvider from "@/contexts/SnackContext";
import Footer from "@/components/Footer";
import NavBar from "@/components/NavBar";
import SideBar from "@/components/SideBar";
import SideBarWrapper from "@/components/SideBar/SideBarWrapper";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { readFileSync } from "fs";
import { Cormorant_Upright } from "next/font/google";
import localFont from "next/font/local";
import SideBarProvider from "@/contexts/SideBarContext";
import Main from "./Main";

const publicKey = readFileSync("public.key");

const cormorantUpright = Cormorant_Upright({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const materialSymbols = localFont({
  src: "./material-symbols-rounded.woff2",
  display: "block",
});

export const metadata: Metadata = {
  title: "ExploraNotes",
  manifest: "/manifest.json",
  applicationName: "ExploraNotes",
  appleWebApp: {
    title: "ExploraNotes",
    statusBarStyle: "default",
  },
  themeColor: "#9e1030",
};

async function getAccountType() {
  const cookieStore = cookies();
  const jwt = cookieStore.get("X-ExploraNotes-Auth");
  if (!jwt) return {};
  const payload = verify(jwt.value, publicKey, { algorithms: ["RS256"] });
  if (typeof payload !== "object") return {};
  return { isAuthenticated: true, accountType: payload.accountType };
}

export default async function AppLayout({ children, auth, student, teacher }) {
  const { isAuthenticated, accountType } = await getAccountType();

  return (
    <html lang="fr" className={cormorantUpright.className}>
      <body style={{ "--material-symbols": materialSymbols.style.fontFamily } as any}>
        <SideBarProvider clippedSideBar={true}>
          <NavBar />
          {/*
          <SideBarWrapper>
            <SideBar />
          </SideBarWrapper>
          */}
          <SideBarWrapper>
            <SideBar />
          </SideBarWrapper>
          <Main>
            <SnackProvider>
              {isAuthenticated ? (accountType === "student" ? student : teacher) : children}
              {auth}
            </SnackProvider>
            <Footer />
          </Main>
        </SideBarProvider>
      </body>
    </html>
  );
}
