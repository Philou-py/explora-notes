import { memo } from "react";
import cn from "classnames/bind";

interface IconProps {
  iconName: string;
  className?: string;
  [prop: string]: any;
}

function Icon({ iconName, className, ...otherAttributes }: IconProps) {
  return (
    <span className={cn("material-symbols-rounded", className)} {...otherAttributes}>
      {iconName}
    </span>
  );
}

export default memo(Icon);
