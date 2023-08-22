import "@/styles/globals.scss";
import "@/styles/typography.scss";
import "@/styles/colours.scss";
import SnackProvider from "@/contexts/SnackContext";
// import AuthProvider from "@/contexts/AuthContext";
// import TeacherProvider from "@/contexts/TeacherContext";
import Footer from "@/components/Footer";
import NavBar from "@/components/NavBar";
import { Metadata } from "next";
import { Cormorant_Upright } from "next/font/google";
import localFont from "next/font/local";
import { ReactNode } from "react";

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

export default function AppLayout({ children, auth }: { children: ReactNode; auth: ReactNode }) {
  const navBarHeight = 60;

  return (
    <html lang="fr" className={cormorantUpright.className}>
      <body style={{ "--material-symbols": materialSymbols.style.fontFamily } as any}>
        <NavBar hasClippedSideBar />
        <div style={{ paddingTop: navBarHeight }}>
          <SnackProvider>
            {children}
            {auth}
          </SnackProvider>
          <Footer />
        </div>
      </body>
    </html>
  );
}
