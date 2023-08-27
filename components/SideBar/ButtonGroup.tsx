"use client";

import { ReactNode, useState } from "react";
import cn from "classnames/bind";
import buttonGroupStyles from "./ButtonGroup.module.scss";
import Button from "../Button";
import Icon from "../Icon/Icon";

const cx = cn.bind(buttonGroupStyles);

interface ButtonGroupProps {
  openByDefault?: boolean;
  triggerText: string;
  triggerProps: object;
  children: ReactNode;
}

export default function ButtonGroup({
  openByDefault,
  triggerText,
  triggerProps,
  children,
}: ButtonGroupProps) {
  const [groupClosed, setGroupClosed] = useState(openByDefault);

  return (
    <>
      <Button
        type="text"
        onClick={() => setGroupClosed((oldVal) => !oldVal)}
        justifyContent="space-between"
        trailingIcon="expand_less"
        makeCustomIcon={(iconName) => (
          <Icon iconName={iconName} className={cx("expandArrow", { reverse: groupClosed })} />
        )}
        isFullWidth
        {...triggerProps}
      >
        {triggerText}
      </Button>
      <div className={cx("dropdown", { groupClosed })}>{children}</div>
    </>
  );
}
