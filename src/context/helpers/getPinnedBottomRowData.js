import { distinguishDistinctKeys } from "./distinguishDistinctKeys";

export const getPinnedBottomRowData = ({ visualizationID, groupedData }) =>
  [groupedData.array[0]].map(({ distinct, row }) => ({
    ...row,
    ...distinguishDistinctKeys(distinct),
    [visualizationID]: "Total",
  }));
