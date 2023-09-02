"use client";

import { useEffect, useMemo, useState, useCallback, ReactNode, memo } from "react";
import Icon from "../Icon";
import InputField from "../InputField";
import dtStyles from "./DataTable.module.scss";
import cn from "classnames/bind";

export interface TableHeader {
  text: string;
  value: string;
  isSortable?: boolean;
  align?: "start" | "center" | "end";
  alignContent?: "start" | "center" | "end";
  unitSuffix?: string;
}

export enum SortOrder {
  ASC,
  DESC,
}

interface DataTableProps<TableItem> {
  headers: TableHeader[];
  items: TableItem[];
  sortBy?: string;
  sortOrder?: SortOrder;
  className?: string;
  lineNumbering?: boolean;
}

let cx = cn.bind(dtStyles);

function DataTable<
  TableItem extends {
    key: { rawContent: string; isHighlighted?: boolean };
    [key: string]: {
      rawContent: string | number;
      content?: ReactNode;
    };
  }
>({
  headers,
  items,
  sortBy = "key",
  sortOrder = SortOrder.ASC,
  className,
  lineNumbering,
}: DataTableProps<TableItem>) {
  const [smScreen, setSmScreen] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 960px)");
    setSmScreen(mql.matches); // Test initially
    mql.addEventListener("change", (event) => {
      setSmScreen(event.matches);
    });
  }, []);

  const [sortedBy, setSortedBy] = useState(sortBy);
  const [sortedOrder, setSortedOrder] = useState(sortOrder);

  const handleSortToggle = useCallback(
    (headerVal: string) => {
      if (sortedBy === headerVal) {
        if (sortedOrder === SortOrder.ASC) setSortedOrder(SortOrder.DESC);
        else {
          setSortedBy("key");
        }
      } else {
        setSortedBy(headerVal);
        setSortedOrder(SortOrder.ASC);
      }
    },
    [sortedBy, sortedOrder]
  );

  const sortedItems = useMemo(() => {
    if (sortedBy !== "") {
      const sortedArray = [...items];
      sortedArray.sort((itemA, itemB) => {
        let decision = 0;
        if (itemA[sortedBy].rawContent < itemB[sortedBy].rawContent) {
          decision = -1;
        } else if (itemA[sortedBy].rawContent > itemB[sortedBy].rawContent) {
          decision = 1;
        }
        return sortedOrder === SortOrder.ASC ? decision : -decision;
      });
      return sortedArray;
    } else return items;
  }, [items, sortedBy, sortedOrder]);

  const headersTemplate = (
    <tr className={cx("headers")}>
      {lineNumbering && <th className={cx("center", "noSorting")}></th>}

      {headers.map(({ value, text, align = "center", isSortable }) => (
        <th
          key={value}
          className={cx(align, { activeSort: sortedBy === value, noSorting: isSortable === false })}
          onClick={() => {
            if (isSortable !== false) handleSortToggle(value);
          }}
        >
          {text}
          {isSortable !== false && (
            <Icon
              iconName="arrow_upward"
              className={cx("sortIcon", "ml-1", {
                reversedIcon: sortedBy === value && sortedOrder === SortOrder.DESC,
              })}
            />
          )}
        </th>
      ))}
    </tr>
  );

  const itemsTemplate = sortedItems.map((item, lineNumber) => (
    <tr key={item.key.rawContent} className={cx({ highlighted: item.key.isHighlighted })}>
      {lineNumbering && (
        <td className={cx(smScreen ? "mobileDisplay" : "")}>
          <div className={cx("tdContent")}>
            {smScreen && <div className={cx("tdHeader")}>Numéro de ligne</div>}
            <div className={cx("valDisplay", "center")}>{lineNumber + 1}</div>
          </div>
        </td>
      )}

      {headers.map(({ value: headerVal, text: headerText, alignContent = "start", unitSuffix }) => (
        <td key={`${headerVal}-${item.key}`} className={cx(smScreen ? "mobileDisplay" : "")}>
          <div className={cx("tdContent")}>
            {smScreen && <div className={cx("tdHeader")}>{headerText}</div>}
            <div className={cx("valDisplay", alignContent)}>
              {item[headerVal].content ? item[headerVal].content : item[headerVal].rawContent}
              {unitSuffix ? unitSuffix : ""}
            </div>
          </div>
        </td>
      ))}
    </tr>
  ));

  const mobileHeaderList = useMemo(
    () =>
      [["Aucun tri", "key"]].concat(
        headers
          .filter((header) => header.isSortable !== false)
          .map((header) => [header.text, header.value])
      ),
    [headers]
  );

  const mobileSelectOrder = useMemo(
    () => [
      ["Croissant", "ascending"],
      ["Décroissant", "descending"],
    ],
    []
  );

  const handleSortOrderChange = useCallback((newValue: string) => {
    setSortedOrder(newValue === "ascending" ? SortOrder.ASC : SortOrder.DESC);
  }, []);

  return (
    <table className={cn(cx("table"), className)}>
      {!smScreen && <thead>{headersTemplate}</thead>}
      {smScreen && (
        <thead>
          <tr className={cx("mobileSortInputFields")}>
            <td>
              <InputField
                type="select"
                value={sortedBy}
                setValue={setSortedBy}
                label="Trier les données..."
                selectItems={mobileHeaderList}
              />
              <InputField
                type="select"
                value={sortedOrder === SortOrder.ASC ? "ascending" : "descending"}
                setValue={handleSortOrderChange}
                label="Modifier le sens..."
                selectItems={mobileSelectOrder}
                isDisabled={sortedBy === ""}
              />
            </td>
          </tr>
        </thead>
      )}
      <tbody>
        {items.length !== 0 ? (
          itemsTemplate
        ) : (
          <tr>
            <td
              colSpan={lineNumbering ? headers.length + 1 : headers.length}
              className={cx("noData")}
            >
              Aucune donnée !
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export default memo(DataTable);
