"use client";

import { MouseEventHandler, ReactNode, useEffect, useRef, useState } from "react";
import sideBarStyles from "./SideBar.module.scss";
import cn from "classnames/bind";

let cx = cn.bind(sideBarStyles);

interface SideBarWrapperProps {
  showSideBar: boolean;
  hasClippedSideBar: boolean;
  closeSideBar: () => void;
  children: ReactNode;
}

export default function SideBarWrapper({
  showSideBar,
  closeSideBar,
  hasClippedSideBar,
  children,
}: SideBarWrapperProps) {
  const [cbpXS, setCbpXS] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 600px)");
    mql.addEventListener("change", (event) => {
      setCbpXS(event.matches);
    });
  }, []);

  const isSideBarClipped = hasClippedSideBar && !cbpXS;

  const handleSideBarClose: MouseEventHandler<HTMLDivElement> = (event) => {
    if ((event.target as HTMLDivElement).isSameNode(bgRef.current)) {
      closeSideBar();
    } else {
      console.info("You clicked on the sidebar!");
    }
  };

  const bgRef = useRef(null);

  return (
    <>
      {!isSideBarClipped && (
        <div
          className={cx("bg", { show: showSideBar, clippedSideBar: isSideBarClipped })}
          ref={bgRef}
          onClick={handleSideBarClose}
        >
          {children}
        </div>
      )}
      {isSideBarClipped && children}
    </>
  );
}
