import {
  ReactNode,
  ReactElement,
  cloneElement,
  DetailedHTMLProps,
  HTMLAttributes,
  CSSProperties,
} from "react";
import cardStyles from "./Card.module.scss";
import cn from "classnames";

interface CardProps {
  cssWidth?: string;
  media?: ReactElement;
  mediaPosition?: "top" | "right" | "left";
  mediaClassName?: string;
  mainContentClassName?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

interface CSSWithVars extends CSSProperties {
  "--card-width"?: string;
}

export default function Card({
  cssWidth,
  media,
  mediaPosition,
  mediaClassName,
  mainContentClassName,
  className,
  style,
  children,
}: CardProps) {
  let styles: CSSWithVars = {};
  if (style) styles = style;
  if (cssWidth) styles["--card-width"] = cssWidth;
  const mediaPositionClass = mediaPosition
    ? cardStyles["media" + mediaPosition[0].toUpperCase() + mediaPosition.slice(1)]
    : undefined;
  return (
    <div className={cn(cardStyles.card, mediaPositionClass, className)} style={styles}>
      {media && <div className={cn(cardStyles.media, mediaClassName)}>{media}</div>}
      <div className={cn(cardStyles.mainContent, mainContentClassName)}>{children}</div>
    </div>
  );
}

interface CardHeaderProps {
  title: ReactElement;
  centerTitle?: boolean;
  subtitle?: ReactElement;
  action?: ReactElement;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className, centerTitle }: CardHeaderProps) {
  return (
    <div className={cn(cardStyles.cardHeader, className)}>
      <div className={cardStyles.content}>
        {cloneElement(title, {
          className: cn(cardStyles.title, title.props.className),
          style: centerTitle ? { textAlign: "center", ...title.props.style } : title.props.style,
        })}
        {subtitle &&
          cloneElement(subtitle, {
            className: cn(cardStyles.subtitle, subtitle.props.className),
          })}
      </div>
      <div className={cardStyles.action}>{action}</div>
    </div>
  );
}

interface CardContentProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  className?: string;
  children?: ReactNode;
}

export function CardContent({ className, children, ...otherProps }: CardContentProps) {
  return (
    <div className={cn(cardStyles.cardContent, className)} {...otherProps}>
      {children}
    </div>
  );
}

interface CardActionsProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  className?: string;
  children?: ReactNode;
}

export function CardActions({ className, children, ...otherProps }: CardActionsProps) {
  return (
    <div className={cn(cardStyles.cardActions, className)} {...otherProps}>
      {children}
    </div>
  );
}
