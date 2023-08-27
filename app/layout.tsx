import "@/styles/globals.scss";
import "@/styles/typography.scss";
import "@/styles/colours.scss";
import SnackProvider from "@/contexts/SnackContext";
import Footer from "@/components/Footer";
import NavBar from "@/components/NavBar";
import SideBar from "@/components/SideBar";
import SideBarWrapper from "@/components/SideBar/SideBarWrapper";
import { Metadata } from "next";
import { Cormorant_Upright } from "next/font/google";
import localFont from "next/font/local";
import SideBarProvider from "@/contexts/SideBarContext";
import Main from "./Main";

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

export default async function AppLayout({ children, auth }) {
  return (
    <html lang="fr" className={cormorantUpright.className}>
      <body style={{ "--material-symbols": materialSymbols.style.fontFamily } as any}>
        <SideBarProvider clippedSideBar={true} openByDefault={true}>
          <SnackProvider>
            <NavBar />
            <SideBarWrapper>
              <SideBar />
            </SideBarWrapper>
            <Main>
              {auth}
              {children}
              <Footer />
            </Main>
          </SnackProvider>
        </SideBarProvider>
      </body>
    </html>
  );
}
