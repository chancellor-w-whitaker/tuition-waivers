import { visualizationIDs } from "../constants/visualizationIDs";

export const getPieCellColor = (entry) => {
  const colors = { Dependent: "#861F41", Employee: "#DC5829" };

  const id = visualizationIDs.waiverType;

  return colors[entry[id]];
};
