import { distinguishDistinctKeys } from "./distinguishDistinctKeys";

export const getRowData = ({ visualizationID, groupedData }) =>
  groupedData.array
    .filter(({ level }) => level === visualizationID)
    .map(({ distinct, row }) => ({
      ...row,
      ...distinguishDistinctKeys(distinct),
    }));
