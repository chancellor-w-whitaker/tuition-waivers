export const groupBy = (
  rows = [],
  groupByColumns = [],
  sumUpColumns = [],
  supplementalColumns = []
) => {
  const isStringNumeric = (param) => {
    const method1 = (string) => !Number.isNaN(string);

    const method2 = (string) => /^[+-]?\d+(\.\d+)?$/.test(string);

    const method3 = (string) => !Number.isNaN(Number(string));

    const method4 = (string) => Number.isFinite(+string);

    const method5 = (string) => string == Number.parseFloat(string);

    const methods = [method1, method2, method3, method4, method5];

    return !methods.some((method) => !method(param));
  };

  const getNumberEntries = (row) =>
    sumUpColumns
      .map((column) => [column, row[column]])
      .filter(([key, value]) => isStringNumeric(value));

  const getSupplementalValues = (row) =>
    Object.fromEntries(
      supplementalColumns.map((column) => [column, row[column]])
    );

  const zeroedSums = Object.fromEntries(
    sumUpColumns.map((column) => [column, 0])
  );

  const groupedRows = [];

  const tree = { parent: { ...zeroedSums }, distinct: {}, children: {} };

  groupedRows.push({ distinct: tree.distinct, row: tree.parent });

  rows.forEach((row) => {
    const numberEntries = getNumberEntries(row);

    let node = tree;

    numberEntries.forEach(
      ([column, number]) => (node.parent[column] += Number(number))
    );

    let pairs = {};

    let ancestorCounters = [];

    groupByColumns.forEach((column) => {
      const value = row[column];

      pairs[column] = value;

      ancestorCounters.push(node.distinct);

      if (!(value in node.children)) {
        node.children[value] = {
          parent: { ...pairs, ...zeroedSums, ...getSupplementalValues(row) },
          level: column,
          distinct: {},
          children: {},
        };

        const { distinct, parent, level } = node.children[value];

        groupedRows.push({
          row: parent,
          distinct,
          level,
        });

        ancestorCounters.forEach((object) => {
          if (!(column in object)) {
            object[column] = 0;
          }

          object[column]++;
        });
      }

      node = node.children[value];

      numberEntries.forEach(
        ([column, number]) => (node.parent[column] += Number(number))
      );
    });
  });

  return { array: groupedRows, tree };
};
