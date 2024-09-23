import { isStringNumeric } from "./isStringNumeric";

export const groupRowsByColumns = (
  rows = [],
  groupColumns = [],
  valueColumns = [],
  extraColumns = []
) => {
  const tree = {};

  const groupRows = [];

  const isIndexOfLastGroupColumn = (index) => index === groupColumns.length - 1;

  rows.forEach((row) => {
    let branch = tree;

    let leaf = Object.fromEntries([
      ...valueColumns.map((valueColumn) => [valueColumn, 0]),
      ...extraColumns.map((extraColumn) => [extraColumn, row[extraColumn]]),
    ]);

    groupColumns.forEach((groupColumn, index) => {
      const segment = row[groupColumn];

      leaf[groupColumn] = segment;

      if (!(segment in branch)) {
        if (!isIndexOfLastGroupColumn(index)) {
          branch[segment] = {};
        } else {
          branch[segment] = { row: leaf, data: [] };
        }
      }

      branch = branch[segment];
    });

    branch.data.push(row);

    groupRows.push(branch.row);

    valueColumns.forEach(
      (valueColumn) =>
        (branch.row[valueColumn] += isStringNumeric(row[valueColumn])
          ? Number(row[valueColumn])
          : 0)
    );
  });

  return { groupRows, tree };
};
