import { memo } from "react";
import { Button, Icon } from "..";
import cn from "classnames/bind";
import breadCrumbsStyles from "./BreadCrumbs.module.scss";

const cx = cn.bind(breadCrumbsStyles);

interface BreadCrumbsProps {
  items: [string, string][];
}

function BreadCrumbs({ items }: BreadCrumbsProps) {
  return (
    <ul className={cx("breadCrumbs")}>
      {items.map(([text, href], index) => (
        <>
          <li key={href + "-link"}>
            <Button
              type={index !== items.length - 1 ? "outlined" : "raised"}
              href={href}
              className={cn({
                "cyan--text text--darken-2": index !== items.length - 1,
                "cyan darken-2": index === items.length - 1,
              })}
              isLink
              isFlat
            >
              {text}
            </Button>
          </li>
          {index !== items.length - 1 && (
            <li key={href + "-link"} className={cx("divider")}>
              <Icon iconName="chevron_right" />
            </li>
          )}
        </>
      ))}
    </ul>
  );
}

export default memo(BreadCrumbs);
