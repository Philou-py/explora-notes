import { useContext, useMemo, useState, useCallback, ReactNode, memo } from "react";
import { BreakpointsContext } from "../../contexts/BreakpointsContext";
import { Icon, InputField } from "..";
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
  const { currentBreakpoint: cbp } = useContext(BreakpointsContext);
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
        if (sortedOrder === SortOrder.ASC) {
          return itemA[sortedBy].rawContent < itemB[sortedBy].rawContent ? -1 : 1;
        } else {
          return itemA[sortedBy].rawContent > itemB[sortedBy].rawContent ? -1 : 1;
        }
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
    <tr key={item.key.rawContent}>
      {lineNumbering && (
        <td className={cx(cbp === "xs" ? "mobileDisplay" : "desktopDisplay")}>
          <div className={cx("tdContent")}>
            {cbp === "xs" && <div className={cx("tdHeader")}>Numéro de ligne</div>}
            <div className={cx("valDisplay", "center")}>{lineNumber + 1}</div>
          </div>
        </td>
      )}

      {headers.map(({ value: headerVal, text: headerText, alignContent = "start", unitSuffix }) => (
        <td
          key={`${headerVal}-${item.key}`}
          className={cx(cbp === "xs" ? "mobileDisplay" : "desktopDisplay")}
        >
          <div className={cx("tdContent")}>
            {cbp === "xs" && <div className={cx("tdHeader")}>{headerText}</div>}
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
      {cbp !== "xs" && <thead>{headersTemplate}</thead>}
      {cbp === "xs" && (
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
            <td colSpan={headers.length} className={cx("noData")}>
              Aucune donnée !
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export default memo(DataTable);
