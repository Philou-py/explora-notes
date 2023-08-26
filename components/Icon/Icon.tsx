import cn from "classnames/bind";
import iconStyles from "./Icon.module.scss";

const cx = cn.bind(iconStyles);

interface IconProps {
  iconName: string;
  className?: string;
  [prop: string]: any;
}

export default function Icon({ iconName, className, ...otherAttributes }: IconProps) {
  return (
    <span className={cn("icon", className, cx("icon"))} {...otherAttributes}>
      {iconName}
    </span>
  );
}
