import { useCallback, useContext, useRef, MouseEvent, memo } from "react";
import Link from "next/link";
import sideBarStyles from "./SideBar.module.scss";
import cn from "classnames/bind";
import { BreakpointsContext } from "../../contexts/BreakpointsContext";
import { AuthContext } from "../../contexts/AuthContext";
import { Button, Avatar } from "..";

interface SideBarProps {
  isClippedIfPossible?: boolean;
  showSideBar: boolean;
  navLinks: [string, string][];
  handleAuth?: boolean;
  onClose: () => void;
}

let cx = cn.bind(sideBarStyles);

function SideBar({
  showSideBar,
  navLinks,
  handleAuth,
  onClose,
  isClippedIfPossible,
}: SideBarProps) {
  const { currentBreakpoint: cbp } = useContext(BreakpointsContext);
  const { isAuthenticated, setModalOpen, signOut, currentUser } = useContext(AuthContext);

  const bgRef = useRef(null);
  const refForTransition2 = useRef(null);

  const showClipped = cbp !== "xs" && isClippedIfPossible;

  const handleSideBarClose = useCallback(
    (event: MouseEvent) => {
      if ((event.target as HTMLDivElement).isSameNode(bgRef.current)) {
        onClose();
      } else {
        console.info("You clicked on the sidebar!");
      }
    },
    [onClose]
  );

  const signInSignOut = useCallback(() => {
    if (isAuthenticated) {
      signOut();
    } else {
      setModalOpen(true);
    }
  }, [setModalOpen, isAuthenticated, signOut]);

  const sideBarContent = (
    <div
      className={cx("content", { show: showSideBar, clipped: showClipped })}
      ref={refForTransition2}
    >
      {!isAuthenticated && (
        <Link href="/" style={{ textDecoration: "none" }}>
          <h3 className={sideBarStyles.title}>ExploraNotes</h3>
        </Link>
      )}
      {isAuthenticated && (
        <Avatar
          type="initials-avatar"
          className={sideBarStyles.avatar}
          initials={currentUser!.username
            .split(" ")
            .map((part) => part[0].toUpperCase())
            .join("")}
          borderColour="#33c9ff"
          size={150}
        />
      )}

      <nav className={sideBarStyles.navList}>
        {navLinks.map(([name, url]) => (
          <Link href={url} key={name}>
            {name}
          </Link>
        ))}
      </nav>
      {handleAuth && (
        <Button className={cn("blue-grey", cx("authButton"))} onClick={signInSignOut}>
          {isAuthenticated ? "Déconnexion" : "Connexion"}
        </Button>
      )}
    </div>
  );

  return (
    <>
      {!showClipped && (
        <div className={cx("bg", { show: showSideBar })} ref={bgRef} onClick={handleSideBarClose}>
          {sideBarContent}
        </div>
      )}
      {showClipped && sideBarContent}
    </>
  );
}

export default memo(SideBar);
