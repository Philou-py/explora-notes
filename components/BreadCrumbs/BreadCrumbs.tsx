import { memo } from "react";
import Icon from "../Icon";
import Button from "../Button";
import cn from "classnames/bind";
import breadCrumbsStyles from "./BreadCrumbs.module.scss";

const cx = cn.bind(breadCrumbsStyles);

interface BreadCrumbsProps {
  items: [string, string][];
  namespace: string;
}

function BreadCrumbs({ items, namespace }: BreadCrumbsProps) {
  return (
    <ul className={cx("breadCrumbs")}>
      {items.map(([text, href], index) => [
        <li key={`${namespace}-${href}-link`}>
          <Button
            type={index !== items.length - 1 ? "outlined" : "filled"}
            href={href}
            className={cn("mb-2", {
              "cyan--text text--darken-2": index !== items.length - 1,
              "cyan darken-2": index === items.length - 1,
            })}
            isLink
          >
            {text}
          </Button>
        </li>,
        index !== items.length - 1 && (
          <li key={`${namespace}-${href}-divider`} className={cn("mb-2", cx("divider"))}>
            <Icon iconName="chevron_right" />
          </li>
        ),
      ])}
    </ul>
  );
}

export default memo(BreadCrumbs);
