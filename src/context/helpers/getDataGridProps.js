import { getPinnedBottomRowData } from "./getPinnedBottomRowData";
import { getColumnDefs } from "./getColumnDefs";
import { getRowData } from "./getRowData";

export const getDataGridProps = ({ visualizationID, groupedData }) => {
  const rowData = getRowData({ visualizationID, groupedData });

  const pinnedBottomRowData = getPinnedBottomRowData({
    visualizationID,
    groupedData,
  });

  const columnDefs = getColumnDefs(rowData);

  return { pinnedBottomRowData, columnDefs, rowData };
};
