import { visualizationIDs } from "../constants/visualizationIDs";

export const getPieCellName = (entry) => {
  const id = visualizationIDs.waiverType;

  return entry[id];
};
