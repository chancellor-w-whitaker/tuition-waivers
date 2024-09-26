import { getValueFormatter } from "./getValueFormatter";
import { getDefaultSort } from "./getDefaultSort";
import { getHeaderName } from "./getHeaderName";

export const getColumnDefs = (rowData) =>
  rowData.length > 0
    ? Object.keys(rowData[0]).map((field) => ({
        valueFormatter: getValueFormatter(field),
        headerName: getHeaderName(field),
        sort: getDefaultSort(field),
        field,
      }))
    : [];
