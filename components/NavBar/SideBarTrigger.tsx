"use client";

import { useState, useCallback, ReactNode } from "react";
import nBStyles from "./NavBar.module.scss";
import cn from "classnames/bind";
import Button from "../Button";
import { SideBarWrapper } from "../SideBar";

const cx = cn.bind(nBStyles);

interface SideBarTriggerProps {
  hasClippedSideBar: boolean;
  children: ReactNode;
}

export default function SideBarTrigger({ hasClippedSideBar, children }: SideBarTriggerProps) {
  const [sideBarOpen, setSideBarOpen] = useState(false);
  const closeSideBar = useCallback(() => {
    setSideBarOpen(false);
  }, []);

  return (
    <>
      <Button
        className={cn(cx("navIconButton", { showAlways: hasClippedSideBar }), "white--text")}
        type="icon"
        iconName="menu"
        onClick={() => setSideBarOpen((prev) => !prev)}
        isFlat
      />
      <SideBarWrapper
        showSideBar={sideBarOpen}
        closeSideBar={closeSideBar}
        hasClippedSideBar={hasClippedSideBar}
      >
        {children}
      </SideBarWrapper>
    </>
  );
}
