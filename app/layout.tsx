import "@material-symbols/font-600/rounded.scss";
import "@/styles/globals.scss";
import "@/styles/typography.scss";
import "@/styles/colours.scss";
import SnackProvider from "@/contexts/SnackContext";
import ConfirmationProvider from "@/contexts/ConfirmationContext";
import { Metadata } from "next";
import { Cormorant_Upright } from "next/font/google";

const cormorantUpright = Cormorant_Upright({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
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
      <body>
        <SnackProvider>
          <ConfirmationProvider>
            <main style={{ paddingTop: 60 }}>
              {auth}
              {children}
            </main>
          </ConfirmationProvider>
        </SnackProvider>
      </body>
    </html>
  );
}
