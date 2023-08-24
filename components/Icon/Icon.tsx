import cn from "classnames";

interface IconProps {
  iconName: string;
  className?: string;
  [prop: string]: any;
}

export default function Icon({ iconName, className, ...otherAttributes }: IconProps) {
  return (
    <span
      className={cn("icon", className)}
      style={{ fontFamily: "var(--material-symbols)", fontSize: 24, lineHeight: 1 }}
      {...otherAttributes}
    >
      {iconName}
    </span>
  );
}
