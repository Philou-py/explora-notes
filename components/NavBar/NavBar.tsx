import { useContext, useCallback } from "react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import navBarStyles from "./NavBar.module.scss";
import cn from "classnames";
import { Container, Button, Avatar } from "..";
import { BreakpointsContext } from "../../contexts/BreakpointsContext";
import { AuthContext } from "../../contexts/AuthContext";

interface NavBarProps {
  logoPath: string | StaticImageData;
  title: string;
  navLinks: [string, string][];
  centerNavSmScreens?: boolean;
  onNavIconClick?: () => void;
  fixed?: boolean;
  flat?: boolean;
  handleAuth?: boolean;
  hasClippedSideBar?: boolean;
}

export default function NavBar({
  centerNavSmScreens,
  logoPath,
  title,
  navLinks,
  onNavIconClick,
  fixed = true,
  flat,
  handleAuth,
  hasClippedSideBar,
}: NavBarProps) {
  const { currentBreakpoint: cbp } = useContext(BreakpointsContext);
  const { setModalOpen, isAuthenticated, signOut, currentUser } = useContext(AuthContext);

  const signInSignOut = useCallback(() => {
    if (isAuthenticated) {
      signOut();
    } else {
      setModalOpen(true);
    }
  }, [setModalOpen, isAuthenticated, signOut]);

  const navMenu = (
    <nav className={navBarStyles.navMenu}>
      {navLinks.map(([name, url]) => (
        <Link href={url} key={name}>
          <a>{name}</a>
        </Link>
      ))}
      {handleAuth && (
        <div onClick={signInSignOut} key="sign-in-sign-out" className={navBarStyles.authTrigger}>
          {isAuthenticated ? "Déconnexion" : "Connexion"}
        </div>
      )}
    </nav>
  );

  return (
    <div
      className={cn(navBarStyles.navBar, {
        [navBarStyles.flat]: flat,
        [navBarStyles.fixed]: fixed,
      })}
    >
      <Container className={navBarStyles.navBarContainer}>
        <div
          className={cn(navBarStyles.presentation, {
            [navBarStyles.centerNav]: centerNavSmScreens && ["xs", "sm"].includes(cbp),
          })}
        >
          {(["xs", "sm"].includes(cbp) || hasClippedSideBar) && (
            <Button
              className={cn(navBarStyles.navIconButton, "white--text")}
              type="icon"
              iconName="menu"
              onClick={onNavIconClick}
              isFlat
            />
          )}
          <Link href="/">
            <a
              style={{
                textDecoration: "none",
                position: "relative",
                left: ["xs", "sm"].includes(cbp) ? "-28px" : "0",
                margin: "0 auto",
              }}
            >
              <div className={navBarStyles.logoAndTitle}>
                <div className={navBarStyles.logoContainer}>
                  <Image src={logoPath} alt="Logo" width={50} height={50} />
                </div>
                <h4 className={navBarStyles.title}>{title}</h4>
              </div>
            </a>
          </Link>
        </div>
        {["md", "lg", "xl"].includes(cbp) && navMenu}
        {["md", "lg", "xl"].includes(cbp) && isAuthenticated && currentUser!.avatarURL && (
          <div className={navBarStyles.avatarContainer}>
            <Avatar
              type="image-avatar"
              borderColour="#33c9ff"
              src={currentUser!.avatarURL}
              size={50}
            />
          </div>
        )}
        {["md", "lg", "xl"].includes(cbp) && isAuthenticated && !currentUser!.avatarURL && (
          <div className={navBarStyles.avatarContainer}>
            <Avatar
              type="initials-avatar"
              initials={currentUser!.username
                .split(" ")
                .map((part) => part[0].toUpperCase())
                .join("")}
              borderColour="#33c9ff"
              size={50}
            />
          </div>
        )}
      </Container>
    </div>
  );
}
