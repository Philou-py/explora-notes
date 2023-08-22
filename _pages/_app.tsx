import "../styles/globals.scss";
import "../styles/typography.scss";
import "../styles/colours.scss";
import toccatechLogo from "../public/images/logo.png";
import BreakpointsProvider from "../contexts/BreakpointsContext";
import AuthProvider from "../contexts/AuthContext";
import SnackProvider from "../contexts/SnackContext";
import TeacherProvider from "../contexts/TeacherContext";
import Footer from "../layouts/Footer";
import { NavBar, SideBar } from "../components";
import { useCallback, useMemo, useState } from "react";

export default function MyApp({ Component, pageProps }) {
  const [sideBarOpen, setSideBarOpen] = useState(false);

  const breakpointsList = useMemo(
    () => ({
      xs: 600, // xs < 600px : Small to big phones
      sm: 960, // 600px < sm < 960px : Small to big tablets
      md: 1264, // 960px < md < 1264px : Big tablets to small computers
      lg: 1904, // 1264px < lg < 1904px : Desktops
      xl: Infinity, // xl > 1904px : 4k screens and ultra-large
    }),
    []
  );

  const navBarHeight = 60;

  const handleNavIconClick = useCallback(() => {
    setSideBarOpen((prev) => !prev);
  }, []);

  const handleBgClick = useCallback(() => {
    setSideBarOpen(false);
  }, []);

  return (
    <SnackProvider>
      <AuthProvider>
        <TeacherProvider>
          <BreakpointsProvider breakpointsList={breakpointsList}>
            <NavBar
              title="ExploraNotes"
              logoPath={toccatechLogo}
              navLinks={[
                ["Évaluations", "/evaluations"],
                ["Groupes", "/groups"],
              ]}
              centerNavSmScreens
              onNavIconClick={handleNavIconClick}
              handleAuth
            />
            <SideBar
              showSideBar={sideBarOpen}
              onClose={handleBgClick}
              navLinks={[
                ["Évaluations", "/evaluations"],
                ["Groupes", "/groups"],
              ]}
              handleAuth
            />
            <div
              style={{
                paddingTop: navBarHeight,
                display: "grid",
                gridTemplateRows: "auto min-content",
                height: "100vh",
              }}
            >
              <div style={{ marginTop: 10, marginBottom: 30 }}>
                <Component {...pageProps} />
              </div>
              <Footer />
            </div>
          </BreakpointsProvider>
        </TeacherProvider>
      </AuthProvider>
    </SnackProvider>
  );
}

// function RenderComp({
//   Component,
//   pageProps,
//   sideBarOpen,
// }: Partial<AppProps> & { sideBarOpen: boolean }) {
//   const navBarHeight = 60;
//   const sideBarWidth = 250;

//   // For clipped SideBar
//   const pushContentStyle =
//     cbp !== "xs"
//       ? {
//           paddingLeft: sideBarOpen ? sideBarWidth : 0,
//           transition: "padding-left 300ms ease",
//         }
//       : {};

//   return (
//     <div
//       style={{
//         paddingTop: navBarHeight,
//         display: "grid",
//         gridTemplateRows: "auto min-content",
//         height: "100vh",
//         // ...pushContentStyle,
//       }}
//     >
//       <div style={{ marginTop: 10, marginBottom: 10 }}>
//         <Component {...pageProps} />
//       </div>
//       <Footer />
//     </div>
//   );
// }
