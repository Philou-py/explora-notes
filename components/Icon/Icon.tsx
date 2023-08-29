"use client";

import cn from "classnames/bind";
import iconStyles from "./Icon.module.scss";
import { memo } from "react";

const cx = cn.bind(iconStyles);

interface IconProps {
  iconName: string;
  className?: string;
  [prop: string]: any;
}

function Icon({ iconName, className, ...otherAttributes }: IconProps) {
  return (
    <span
      className={cn("icon", "material-symbols-rounded", className, cx("icon"))}
      {...otherAttributes}
    >
      {iconName}
    </span>
  );
}

export default memo(Icon);
