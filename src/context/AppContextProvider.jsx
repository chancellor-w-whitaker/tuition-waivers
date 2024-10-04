import { useCallback, useState, useMemo, useRef } from "react";

import { lesserFillOpacityValue } from "./constants/lesserFillOpacityValue";
import { formatNumberWithCommas } from "./helpers/formatNumberWithCommas";
import { formatCompactNumber } from "./helpers/formatCompactNumber";
import { visualizationIDs } from "./constants/visualizationIDs";
import { onGridSizeChanged } from "./helpers/onGridSizeChanged";
import { getDataGridProps } from "./helpers/getDataGridProps";
import { getPieCellColor } from "./helpers/getPieCellColor";
import { getPieCellName } from "./helpers/getPieCellName";
import { dataPromise } from "./constants/dataPromise";
import { quantifyTerm } from "./helpers/quantifyTerm";
import { getRowData } from "./helpers/getRowData";
import { usePromise } from "../hooks/usePromise";
import { AppContext } from "./utils/AppContext";
import { groupBy } from "./helpers/groupBy";

// change bg color of pinned ones
// filter out selected

export const AppContextProvider = ({ children }) => {
  const programGridRef = useRef();

  const studentGridRef = useRef();

  const [activeValues, setActiveValues] = useState([]);

  const resetButtonIsDisabled = activeValues.length === 0;

  const onClickResetButton = () => setActiveValues([]);

  const resetButtonData = {
    disabled: resetButtonIsDisabled,
    onClick: onClickResetButton,
  };

  const getPinnedTopRowData = useCallback(
    ({ visualizationID, rowData }) => {
      const activeKey = activeValues.length > 0 ? activeValues[0].key : null;

      if (visualizationID === activeKey) {
        const setOfActiveValues = new Set(
          activeKey ? activeValues.map(({ value }) => value) : []
        );

        return rowData.filter((row) =>
          setOfActiveValues.has(row[visualizationID])
        );
      }

      return [];
    },
    [activeValues]
  );

  const isCellIrrelevant = useCallback(
    ({ entry, id }) => {
      if (activeValues.some(({ key }) => key === id)) {
        return !activeValues.some(
          ({ value, key }) => key === id && value === entry[id]
        );
      }
    },
    [activeValues]
  );

  const handleActiveBarCell = useCallback(
    (entry) => {
      const id = visualizationIDs.semester;

      if (isCellIrrelevant({ entry, id })) {
        return { fillOpacity: lesserFillOpacityValue };
      }

      return { fillOpacity: 1 };
    },
    [isCellIrrelevant]
  );

  const handleActivePieCell = useCallback(
    (entry) => {
      const id = visualizationIDs.waiverType;

      if (isCellIrrelevant({ entry, id })) {
        return { fillOpacity: lesserFillOpacityValue };
      }

      return { fillOpacity: 1 };
    },
    [isCellIrrelevant]
  );

  const updateActiveRow = (nextActiveValue) =>
    setActiveValues((state) => {
      if (state.some(({ key }) => key === nextActiveValue.key)) {
        if (
          state.some(
            ({ value, key }) =>
              key === nextActiveValue.key && value === nextActiveValue.value
          )
        ) {
          return state.filter(
            ({ value, key }) =>
              !(key === nextActiveValue.key && value === nextActiveValue.value)
          );
        } else {
          return [...state, nextActiveValue];
        }
      } else {
        return [nextActiveValue];
      }
    });

  const onRowClicked = useCallback((e) => {
    let id;

    if (e.api === programGridRef.current.api) id = visualizationIDs.program;

    if (e.api === studentGridRef.current.api) id = visualizationIDs.student;

    const nextActiveValue = { value: e.data[id], key: id };

    e.node.rowPinned !== "bottom" && updateActiveRow(nextActiveValue);
  }, []);

  // const onRowDataUpdated = useCallback(
  //   (e) => {
  //     let id;

  //     if (e.api === programGridRef.current.api) id = visualizationIDs.program;

  //     if (e.api === studentGridRef.current.api) id = visualizationIDs.student;

  //     if (activeValues.some(({ key }) => key === id)) {
  //       e.api.ensureNodeVisible(
  //         (node) =>
  //           node.data[id] === activeValues[activeValues.length - 1].value
  //       );
  //     }
  //   },
  //   [activeValues]
  // );

  const handleActiveRowClass = useCallback(
    (e) => {
      let id;

      if (e.api === programGridRef.current.api) id = visualizationIDs.program;

      if (e.api === studentGridRef.current.api) id = visualizationIDs.student;

      if (!e.node.rowPinned && isCellIrrelevant({ entry: e.data, id })) {
        return "opacity-25";
      }

      return "opacity-100";
    },
    [isCellIrrelevant]
  );

  const updateActiveCell = (nextActiveValue) =>
    setActiveValues((state) =>
      state.length === 1 &&
      state[0].value === nextActiveValue.value &&
      state[0].key === nextActiveValue.key
        ? []
        : [nextActiveValue]
    );

  const onPieClicked = useCallback((e) => {
    const id = visualizationIDs.waiverType;

    const nextActiveValue = { value: e[id], key: id };

    updateActiveCell(nextActiveValue);
  }, []);

  const onBarClicked = useCallback((e) => {
    const id = visualizationIDs.semester;

    const nextActiveValue = { value: e[id], key: id };

    updateActiveCell(nextActiveValue);
  }, []);

  const dataPromised = usePromise(dataPromise);

  const data = useMemo(
    () =>
      dataPromised &&
      dataPromised.filter(({ student_waiver_type }) => student_waiver_type),
    [dataPromised]
  );

  const { props: termFilterProps, active: activeTerms } = useValuesFilter({
    sortMethod: (a, b) => quantifyTerm(a) - quantifyTerm(b),
    key: "term_desc",
    data,
  });

  const { props: typeFilterProps, active: activeTypes } = useValuesFilter({
    key: "student_waiver_type",
    data,
  });

  const originalData = useMemo(
    () =>
      data && activeTerms && activeTypes
        ? data.filter(
            ({ student_waiver_type, term_desc }) =>
              activeTerms.has(term_desc) && activeTypes.has(student_waiver_type)
          )
        : null,
    [data, activeTerms, activeTypes]
  );

  const filteredData = useMemo(() => {
    if (Array.isArray(originalData)) {
      const filters = [activeValues].flat();

      return originalData.filter((row) => {
        return filters.some(({ value, key }) => row[key] === value);
      });
    }
  }, [activeValues, originalData]);

  const getVisualizationData = useCallback(
    (visualizationID) =>
      activeValues.length === 0 ||
      activeValues.some(({ key }) => key === visualizationID)
        ? originalData
        : filteredData,
    [filteredData, originalData, activeValues]
  );

  const programData = useMemo(() => {
    const visualizationID = visualizationIDs.program;

    const data = getVisualizationData(visualizationID);

    const defaultReturn = {
      onRowDataUpdated: onGridSizeChanged,
      getRowClass: handleActiveRowClass,
      pinnedBottomRowData: [],
      pinnedTopRowData: [],
      ref: programGridRef,
      onGridSizeChanged,
      // onRowDataUpdated,
      columnDefs: [],
      onRowClicked,
      rowData: [],
    };

    if (Array.isArray(data)) {
      const groupedData = groupBy(data, [visualizationID, "eku_id"]);

      const dataGridProps = getDataGridProps({ visualizationID, groupedData });

      const pinnedTopRowData = getPinnedTopRowData({
        rowData: dataGridProps.rowData,
        visualizationID,
      });

      const topPinnedSet = new Set(pinnedTopRowData);

      const filteredRowData = dataGridProps.rowData.filter(
        (row) => !topPinnedSet.has(row)
      );

      return {
        ...defaultReturn,
        ...dataGridProps,
        rowData: filteredRowData,
        pinnedTopRowData,
      };
    }

    return defaultReturn;
  }, [
    getVisualizationData,
    onRowClicked,
    handleActiveRowClass,
    // onRowDataUpdated,
    getPinnedTopRowData,
  ]);

  const studentData = useMemo(() => {
    const visualizationID = visualizationIDs.student;

    const data = getVisualizationData(visualizationID);

    const defaultReturn = {
      onRowDataUpdated: onGridSizeChanged,
      getRowClass: handleActiveRowClass,
      pinnedBottomRowData: [],
      pinnedTopRowData: [],
      ref: studentGridRef,
      onGridSizeChanged,
      // onRowDataUpdated,
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

      const fieldsSorted = [
        "eku_id",
        "last_name",
        "first_name",
        "student_waiver_type",
        "student_amount",
        "distinct_term_desc",
        "enrolled_hours",
      ];

      const evaluateFieldPosition = (field) =>
        fieldsSorted.includes(field)
          ? fieldsSorted.indexOf(field)
          : Number.MAX_SAFE_INTEGER;

      const sortColumnDefs = ({ field: fieldA }, { field: fieldB }) =>
        evaluateFieldPosition(fieldA) - evaluateFieldPosition(fieldB);

      const pinnedTopRowData = getPinnedTopRowData({
        rowData: dataGridProps.rowData,
        visualizationID,
      });

      const topPinnedSet = new Set(pinnedTopRowData);

      const filteredRowData = dataGridProps.rowData.filter(
        (row) => !topPinnedSet.has(row)
      );

      return {
        ...defaultReturn,
        ...dataGridProps,
        columnDefs: dataGridProps.columnDefs.sort(sortColumnDefs),
        rowData: filteredRowData,
        pinnedTopRowData,
      };
    }

    return defaultReturn;
  }, [
    getVisualizationData,
    onRowClicked,
    handleActiveRowClass,
    // onRowDataUpdated,
    getPinnedTopRowData,
  ]);

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

    const formatDataKeys = (value) => {
      if (value === "distinct_eku_id") {
        return "Students";
      }

      if (value === "student_amount") {
        return "Waiver $";
      }
    };

    const valueFormatter = (value) => formatNumberWithCommas({ value });

    const defaultReturn = {
      barProps: {
        tickFormatter: formatCompactNumber,
        dataKey: "student_amount",
        onClick: onBarClicked,
        color: "#E6A65D",
      },
      lineProps: {
        tickFormatter: valueFormatter,
        dataKey: "distinct_eku_id",
        color: "#009681",
      },
      xAxisProps: { dataKey: visualizationID },
      handleActiveCell: handleActiveBarCell,
      valueFormatter,
      formatDataKeys,
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

  const context = {
    termData: termFilterProps,
    typeData: typeFilterProps,
    resetButtonData,
    waiverTypeData,
    semesterData,
    studentData,
    programData,
  };

  return <AppContext.Provider value={context}>{children}</AppContext.Provider>;
};

const useValuesFilter = ({ sortMethod, data, key }) => {
  const values = useMemo(
    () =>
      Array.isArray(data)
        ? new Set(data.map(({ [key]: value }) => value))
        : null,
    [data, key]
  );

  const valuesList =
    values && values.size > 0 ? [...values].sort(sortMethod) : [];

  const [activeValues, setActiveValues] = useState();

  const allValuesAreChecked =
    activeValues && valuesList && activeValues.size === valuesList.length;

  const onAllValuesChange = () =>
    setActiveValues(allValuesAreChecked ? new Set() : new Set(valuesList));

  const onValueChange = ({ target: { value } }) =>
    setActiveValues((state) =>
      state.has(value)
        ? new Set([...state].filter((element) => element !== value))
        : new Set([value, ...state])
    );

  const isValueItemActive = (value) => activeValues.has(value);

  if (!activeValues && values) setActiveValues(values);

  const valueData = {
    allAreChecked: allValuesAreChecked,
    onAllChange: onAllValuesChange,
    isChecked: isValueItemActive,
    onChange: onValueChange,
    list: valuesList,
  };

  return { active: activeValues, props: valueData };
};
