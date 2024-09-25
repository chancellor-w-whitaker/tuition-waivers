import { useCallback, useState, useMemo, useRef } from "react";
import { csv } from "d3-fetch";

import { usePromise } from "../hooks/usePromise";
import { AppContext } from "./AppContext";

const groupBy = (
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

const formatNumberWithCommas = ({ value }) => value.toLocaleString();

const formatNumber2DecimalPlaces = ({ value }) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const headerNames = {
  distinct_term_desc: "Enrolled",
  distinct_eku_id: "Students",
  student_waiver_type: "Type",
  student_amount: "Waiver $",
  first_name: "First Name",
  program_desc: "Program",
  enrolled_hours: "Hours",
  last_name: "Last Name",
  eku_id: "EKU ID",
};

const defaultSort = {
  student_amount: "desc",
  distinct_eku_id: "asc",
};

const getDefaultSort = (field) =>
  field in defaultSort ? defaultSort[field] : null;

const valueFormatters = {
  distinct_term_desc: formatNumberWithCommas,
  student_amount: formatNumber2DecimalPlaces,
  enrolled_hours: formatNumber2DecimalPlaces,
  distinct_eku_id: formatNumberWithCommas,
};

const defaultValueFormatter = ({ value }) => value;

const getValueFormatter = (field) =>
  field in valueFormatters ? valueFormatters[field] : defaultValueFormatter;

const getHeaderName = (field) =>
  field in headerNames ? headerNames[field] : field;

// const chartProperties = {
//   barChart: {
//     valueFormatters: {
//       student_amount: (value) => formatNumber2DecimalPlaces({ value }),
//       distinct_eku_id: (value) => formatNumberWithCommas({ value }),
//     },
//     displayNames: {
//       distinct_eku_id: "Students",
//       student_amount: "Waiver $",
//       term_desc: "Semester",
//     },
//     colors: { lines: "#009681", bars: "#DC5829" },
//     title: "Waivers & Students by Semester",
//   },
//   pieChart: {
//     // need to define how label & tooltip show percentage
//     // need to define how number is formatted in tooltip (with commas)
//     displayNames: {
//       distinct_eku_id: "Distinct Students",
//       student_waiver_type: "Waiver Type",
//     },
//     colors: { Dependent: "#861F41", Employee: "#E6A65D" },
//     title: "Waiver Type",
//   },
// };

const getColumnDefs = (rowData) =>
  rowData.length > 0
    ? Object.keys(rowData[0]).map((field) => ({
        valueFormatter: getValueFormatter(field),
        headerName: getHeaderName(field),
        sort: getDefaultSort(field),
        field,
      }))
    : [];

const dataPromise = csv("data/data.csv");

const distinguishDistinctKeys = (object) =>
  Object.fromEntries(
    Object.entries(object).map(([key, value]) => [`distinct_${key}`, value])
  );

const getRowData = ({ visualizationID, groupedData }) =>
  groupedData.array
    .filter(({ level }) => level === visualizationID)
    .map(({ distinct, row }) => ({
      ...row,
      ...distinguishDistinctKeys(distinct),
    }));

const getPinnedBottomRowData = ({ visualizationID, groupedData }) =>
  [groupedData.array[0]].map(({ distinct, row }) => ({
    ...row,
    ...distinguishDistinctKeys(distinct),
    [visualizationID]: "Total",
  }));

const getDataGridProps = ({ visualizationID, groupedData }) => {
  const rowData = getRowData({ visualizationID, groupedData });

  const pinnedBottomRowData = getPinnedBottomRowData({
    visualizationID,
    groupedData,
  });

  const columnDefs = getColumnDefs(rowData);

  return { pinnedBottomRowData, columnDefs, rowData };
};

const visualizationIDs = {
  waiverType: "student_waiver_type",
  program: "program_desc",
  semester: "term_desc",
  student: "eku_id",
};

const getPieCellColor = (entry) => {
  const colors = { Dependent: "#861F41", Employee: "#DC5829" };

  const id = visualizationIDs.waiverType;

  return colors[entry[id]];
};

const getPieCellName = (entry) => {
  const id = visualizationIDs.waiverType;

  return entry[id];
};

export const AppContextProvider = ({ children }) => {
  // need scrollPosition to un-reset when clicking a selection on a grid
  // need the ability to filter by many options on grid again
  // term dropdown filter
  // bar y axis labels
  // other ease-of-use & style changes
  // consider stacking filters with ctrl button like in power-bi

  const programGridRef = useRef();

  const studentGridRef = useRef();

  const [filterBy, setFilterBy] = useState();

  const handleActiveBarCell = useCallback(
    (entry) => {
      const id = visualizationIDs.semester;

      if (filterBy && filterBy.key === id && filterBy.value !== entry[id]) {
        return { fillOpacity: 0.5 };
      }

      return { fillOpacity: 1 };
    },
    [filterBy]
  );

  const handleActivePieCell = useCallback(
    (entry) => {
      const id = visualizationIDs.waiverType;

      if (filterBy && filterBy.key === id && filterBy.value !== entry[id]) {
        return { fillOpacity: 0.5 };
      }

      return { fillOpacity: 1 };
    },
    [filterBy]
  );

  const updateFilterBy = (nextState) =>
    setFilterBy((state) =>
      state && state.value === nextState.value && state.key === nextState.key
        ? null
        : nextState
    );

  const onRowClicked = useCallback((e) => {
    let id;

    if (e.api === programGridRef.current.api) id = visualizationIDs.program;

    if (e.api === studentGridRef.current.api) id = visualizationIDs.student;

    const nextFilterBy = { value: e.data[id], key: id };

    updateFilterBy(nextFilterBy);
  }, []);

  const handleActiveRowClass = useCallback(
    (e) => {
      let id;

      if (e.api === programGridRef.current.api) id = visualizationIDs.program;

      if (e.api === studentGridRef.current.api) id = visualizationIDs.student;

      if (
        filterBy &&
        filterBy.key === id &&
        filterBy.value !== e.data[id] &&
        !e.node.rowPinned
      ) {
        return "opacity-50";
      }

      return "opacity-100";
    },
    [filterBy]
  );

  const onPieClicked = useCallback((e) => {
    const id = visualizationIDs.waiverType;

    const nextFilterBy = { value: e[id], key: id };

    updateFilterBy(nextFilterBy);
  }, []);

  const onBarClicked = useCallback((e) => {
    const id = visualizationIDs.semester;

    const nextFilterBy = { value: e[id], key: id };

    updateFilterBy(nextFilterBy);
  }, []);

  const originalData = usePromise(dataPromise);

  const filteredData = useMemo(() => {
    if (filterBy && Array.isArray(originalData)) {
      const { value, key } = filterBy;

      return originalData.filter((row) => row[key] === value);
    }
  }, [filterBy, originalData]);

  const getVisualizationData = useCallback(
    (visualizationID) =>
      filterBy && filterBy.key !== visualizationID
        ? filteredData
        : originalData,
    [filteredData, originalData, filterBy]
  );

  const programData = useMemo(() => {
    const visualizationID = visualizationIDs.program;

    const data = getVisualizationData(visualizationID);

    const defaultReturn = {
      getRowClass: handleActiveRowClass,
      pinnedBottomRowData: [],
      ref: programGridRef,
      columnDefs: [],
      onRowClicked,
      rowData: [],
    };

    if (Array.isArray(data)) {
      const groupedData = groupBy(data, [visualizationID, "eku_id"]);

      const dataGridProps = getDataGridProps({ visualizationID, groupedData });

      return { ...defaultReturn, ...dataGridProps };
    }

    return defaultReturn;
  }, [getVisualizationData, onRowClicked, handleActiveRowClass]);

  const studentData = useMemo(() => {
    const visualizationID = visualizationIDs.student;

    const data = getVisualizationData(visualizationID);

    const defaultReturn = {
      getRowClass: handleActiveRowClass,
      pinnedBottomRowData: [],
      ref: studentGridRef,
      columnDefs: [],
      onRowClicked,
      rowData: [],
    };

    if (Array.isArray(data)) {
      const groupedData = groupBy(
        data,
        [visualizationID, "term_desc"],
        ["student_amount", "enrolled_hours"],
        ["last_name", "first_name", "student_waiver_type"]
      );

      const dataGridProps = getDataGridProps({ visualizationID, groupedData });

      return { ...defaultReturn, ...dataGridProps };
    }

    return defaultReturn;
  }, [getVisualizationData, onRowClicked, handleActiveRowClass]);

  const waiverTypeData = useMemo(() => {
    const visualizationID = visualizationIDs.waiverType;

    const data = getVisualizationData(visualizationID);

    const defaultReturn = {
      handleActiveCell: handleActivePieCell,
      getCellColor: getPieCellColor,
      getCellName: getPieCellName,
      dataKey: "distinct_eku_id",
      onClick: onPieClicked,
      label: "Students",
      data: [],
    };

    if (data) {
      const groupedData = groupBy(data, [visualizationID, "eku_id"]);

      const rowData = getRowData({ visualizationID, groupedData });

      return { ...defaultReturn, data: rowData };
    }

    return defaultReturn;
  }, [getVisualizationData, onPieClicked, handleActivePieCell]);

  const semesterData = useMemo(() => {
    const visualizationID = visualizationIDs.semester;

    const data = getVisualizationData(visualizationID);

    const formatTicks = (value) => formatNumberWithCommas({ value });

    const formatDataKeys = (value) => {
      if (value === "distinct_eku_id") {
        return "Students";
      }

      if (value === "student_amount") {
        return "Waiver $";
      }
    };

    const defaultReturn = {
      barProps: {
        dataKey: "student_amount",
        onClick: onBarClicked,
        color: "#E6A65D",
      },
      lineProps: {
        dataKey: "distinct_eku_id",
        color: "#009681",
      },
      xAxisProps: { dataKey: visualizationID },
      handleActiveCell: handleActiveBarCell,
      formatDataKeys,
      formatTicks,
      data: [],
    };

    if (data) {
      const groupedData = groupBy(
        data,
        [visualizationID, "eku_id"],
        ["student_amount"],
        ["TERM_CODE"]
      );

      const rowData = getRowData({ visualizationID, groupedData }).sort(
        ({ TERM_CODE: a }, { TERM_CODE: b }) => Number(a) - Number(b)
      );

      return { ...defaultReturn, data: rowData };
    }

    return defaultReturn;
  }, [getVisualizationData, onBarClicked, handleActiveBarCell]);

  const context = { waiverTypeData, semesterData, studentData, programData };

  return <AppContext.Provider value={context}>{children}</AppContext.Provider>;
};
