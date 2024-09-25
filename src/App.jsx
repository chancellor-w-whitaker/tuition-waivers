import {
  ResponsiveContainer,
  CartesianGrid,
  ComposedChart,
  PieChart,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  Cell,
  Line,
  Pie,
  Bar,
} from "recharts";
import { useCallback, useState, useMemo, useRef } from "react";

import { renderCustomizedLabel } from "./components/renderCustomizedLabel";
import { AgGridReactMemoized } from "./components/AgGridReactMemoized";
import { gridOneColumnDefs } from "./constants/gridOneColumnDefs";
import { groupRowsByColumns } from "./helpers/groupRowsByColumns";
import { gridTwoColumnDefs } from "./constants/gridTwoColumnDefs";
import { onSelectionChanged } from "./helpers/onSelectionChanged";
import { autoSizeStrategy } from "./constants/autoSizeStrategy";
import { MainContainer } from "./components/MainContainer";
import { AgThemeBalham } from "./components/AgThemeBalham";
import { validateArray } from "./helpers/validateArray";
import { MainSection } from "./components/MainSection";
import { dataPromise } from "./constants/dataPromise";
import { getTermCode } from "./helpers/getTermCode";
import { selection } from "./constants/selection";
import { usePromise } from "./hooks/usePromise";
import { colors } from "./constants/colors";
import { Row } from "./components/Row";

// dropdown to filter on term
// default to only most recent selected

// move graphs underneath tables
// [] []
// [] []

// sort terms asc in graphs

// no need to show subset in pie chart
// what to do in bar chart when one student? (something simpler)

// const selection = {
//   enableClickSelection: true,
//   mode: "singleRow",
//   checkboxes: false,
// };

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

let USDollar = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const formatWithCommas = (number) => number.toLocaleString();

const headerNames = {
  distinct_eku_id: "Distinct Students",
  distinct_term_desc: "Enrolled",
  student_waiver_type: "Type",
  student_amount: "Waiver $",
  first_name: "First Name",
  program_desc: "Program",
  enrolled_hours: "Hours",
  last_name: "Last Name",
  eku_id: "EKU ID",
};

const valueFormatters = {};

const chartProperties = {
  barChart: {
    xAxis: {
      right: {
        valueFormatter: (value) => value.toLocaleString(),
        label: "Students",
      },
      left: {
        valueFormatter: (value) => USDollar.format(value),
        label: "Waiver $",
      },
    },
    xAxisLabels: { right: "Students", left: "Waiver $" },
    colors: { lines: "#009681", bars: "#DC5829" },
    title: "Waivers & Students by Semester",
  },
  pieChart: {
    colors: { Dependent: "#861F41", Employee: "#E6A65D" },
    title: "Waiver Type",
  },
};

const getColumnDefs = (rowData) =>
  rowData.length > 0
    ? Object.keys(rowData[0]).map((field) => ({
        headerName: field in headerNames ? headerNames.field : field,
        field,
      }))
    : [];

export default function App() {
  const originalData = usePromise(dataPromise);

  const [filterBy, setFilterBy] = useState();

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

  const updateFilterBy = ({ value, key }) =>
    setFilterBy((state) =>
      state && state.value === value && state.key === key
        ? null
        : { value, key }
    );

  const programData = useMemo(() => {
    const visualizationID = "program_desc";

    const data = getVisualizationData(visualizationID);

    if (Array.isArray(data)) {
      const groupedData = groupBy(data, [visualizationID, "eku_id"]);

      const rowData = groupedData.array
        .filter(({ level }) => level === visualizationID)
        .map(({ distinct, row }) => ({
          ...row,
          distinct_eku_id: distinct.eku_id,
        }));

      const pinnedBottomRowData = [
        {
          ...groupedData.array[0].row,
          ...groupedData.array[0].distinct,
          [visualizationID]: "Total",
        },
      ];

      const columnDefs = getColumnDefs(rowData);

      return {
        id: visualizationID,
        pinnedBottomRowData,
        columnDefs,
        rowData,
      };
    }

    return {
      pinnedBottomRowData: [],
      id: visualizationID,
      columnDefs: [],
      rowData: [],
    };
  }, [getVisualizationData]);

  console.log(programData);

  const studentData = useMemo(() => {
    const visualizationID = "eku_id";

    const data = getVisualizationData(visualizationID);

    if (Array.isArray(data)) {
      const groupedData = groupBy(
        data,
        [visualizationID, "term_desc"],
        ["student_amount", "enrolled_hours"],
        ["last_name", "first_name", "student_waiver_type"]
      );

      const rowData = groupedData.array
        .filter(({ level }) => level === visualizationID)
        .map(({ distinct, row }) => ({
          ...row,
          distinct_term_desc: distinct.term_desc,
        }));

      const pinnedBottomRowData = [
        {
          ...groupedData.array[0].row,
          ...groupedData.array[0].distinct,
          [visualizationID]: "Total",
        },
      ];

      const columnDefs = getColumnDefs(rowData);

      return { id: visualizationID, pinnedBottomRowData, columnDefs, rowData };
    }

    return {
      pinnedBottomRowData: [],
      id: visualizationID,
      columnDefs: [],
      rowData: [],
    };
  }, [getVisualizationData]);

  const waiverTypeData = useMemo(() => {
    const visualizationID = "student_waiver_type";

    const data = getVisualizationData(visualizationID);

    if (data) {
      const groupedData = groupBy(data, [visualizationID, "eku_id"]);

      const rowData = groupedData.array
        .filter(({ level }) => level === visualizationID)
        .map(({ distinct, row }) => ({
          ...row,
          distinct_eku_id: distinct.eku_id,
        }));

      return { id: visualizationID, rowData };
    }

    return { id: visualizationID, rowData: [] };
  }, [getVisualizationData]);

  const semesterData = useMemo(() => {
    const visualizationID = "term_desc";

    const data = getVisualizationData(visualizationID);

    if (data) {
      const groupedData = groupBy(
        data,
        [visualizationID, "eku_id"],
        ["student_amount"],
        ["TERM_CODE"]
      );

      const rowData = groupedData.array
        .filter(({ level }) => level === visualizationID)
        .map(({ distinct, row }) => ({
          ...row,
          distinct_eku_id: distinct.eku_id,
        }))
        .sort(({ TERM_CODE: a }, { TERM_CODE: b }) => Number(a) - Number(b));

      return { id: visualizationID, rowData };
    }

    return { id: visualizationID, rowData: [] };
  }, [getVisualizationData]);

  // on click pie cell, set filter by to student_waiver_type === pie cell value
  // pie chart id: student_waiver_type

  // on click bar cell, set filter by to term_desc === bar cell value (y axis)
  // bar chart id: term_desc

  // on click student table row, set filter by to eku_id === eku_id of row
  // student table id: eku_id

  // on click program table row, set filter by to program_desc === program_desc of row
  // program table id: program_desc

  // using filterBy, get filteredData

  // of each visualization data, if filterBy.key === visualization id, visualization data remains based on originalData
  // if filterBy.key !== visualization id, visualization data becomes based on filteredData instead

  const rows = useMemo(() => validateArray(originalData), [originalData]);

  const { groupRows, tree } = useMemo(
    () =>
      groupRowsByColumns(
        rows,
        ["program_desc", "eku_id", "term_desc"],
        ["student_amount", "enrolled_hours"],
        ["last_name", "first_name", "student_waiver_type"]
      ),
    [rows]
  );

  const barChartData = Object.values(
    groupRowsByColumns(
      groupRows.map((row) => ({
        ...row,
        student_term_quantity: 1,
      })),
      ["term_desc"],
      ["student_amount", "student_term_quantity"]
    ).tree
  )
    .map(({ row }) => row)
    .sort(
      ({ term_desc: a }, { term_desc: b }) => getTermCode(a) - getTermCode(b)
    );

  const studentIndexedRows = useMemo(() => {
    const beforeGrouping = groupRows.map((row) => ({
      ...row,
      student_term_quantity: 1,
    }));

    return Object.fromEntries(
      groupRowsByColumns(
        beforeGrouping,
        ["eku_id"],
        ["student_amount", "student_term_quantity", "enrolled_hours"],
        ["last_name", "first_name", "student_waiver_type"]
      ).groupRows.map((row) => [row.eku_id, row])
    );
  }, [groupRows]);

  const programStudentMap = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(tree).map(([group, object]) => [
          group,
          new Set(Object.keys(object)),
        ])
      ),
    [tree]
  );

  const programIndexedRows = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(programStudentMap).map(([group, set]) => [
          group,
          { amount: set.size, group },
        ])
      ),
    [programStudentMap]
  );

  const studentProgramMap = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(
          groupRowsByColumns(rows, ["eku_id", "program_desc"]).tree
        ).map(([group, object]) => [group, new Set(Object.keys(object))])
      ),
    [rows]
  );

  const gridOneRowData = useMemo(
    () => Object.values(programIndexedRows),
    [programIndexedRows]
  );

  const gridTwoRowData = useMemo(
    () => Object.values(studentIndexedRows),
    [studentIndexedRows]
  );

  const gridOneRef = useRef();

  const gridTwoRef = useRef();

  const [clickedRows, setClickedRows] = useState({ nodes: [], api: null });

  const onRowClicked = useCallback((params) => {
    const { node: clickedNode, rowPinned, api } = params;

    let node = clickedNode;

    if (rowPinned === "top") {
      api.forEachNode((unPinnedNode) => {
        if (clickedNode.data === unPinnedNode.data) {
          node = unPinnedNode;
        }
      });
    }

    api.deselectAll();

    setClickedRows((state) => {
      if (state.api) state.api.deselectAll();

      return {
        nodes:
          state.api !== api
            ? [node]
            : state.nodes.some((element) => element === node)
            ? state.nodes.filter((element) => element !== node)
            : [...state.nodes, node],
        api,
      };
    });
  }, []);

  const [activePieCell, setActivePieCell] = useState(null);

  const someRowsAreClicked = clickedRows.api && clickedRows.nodes.length > 0;

  const somePieCellIsClicked = activePieCell !== null;

  const isExternalFilterPresent = useCallback(
    () => someRowsAreClicked || somePieCellIsClicked,
    [someRowsAreClicked, somePieCellIsClicked]
  );

  if (someRowsAreClicked) {
    clickedRows.api.setNodesSelected({
      nodes: clickedRows.nodes,
      newValue: true,
    });
  }

  const gridTwoHasClickedRows =
    someRowsAreClicked && clickedRows.api === gridTwoRef.current.api;

  const gridOneHasClickedRows =
    someRowsAreClicked && clickedRows.api === gridOneRef.current.api;

  const gridTwoIDsSubset = useMemo(() => {
    if (gridOneHasClickedRows) {
      return new Set(
        clickedRows.nodes
          .map(({ data: { group } }) => [...programStudentMap[group]])
          .flat()
      );
    }

    if (somePieCellIsClicked) {
      return new Set(
        gridTwoRowData
          .filter(
            ({ student_waiver_type }) => student_waiver_type === activePieCell
          )
          .map(({ eku_id }) => eku_id)
      );
    }
  }, [
    clickedRows,
    activePieCell,
    gridTwoRowData,
    programStudentMap,
    somePieCellIsClicked,
    gridOneHasClickedRows,
  ]);

  const gridOneIDsSubset = useMemo(() => {
    if (gridTwoHasClickedRows) {
      return new Set(
        clickedRows.nodes
          .map(({ data: { eku_id } }) => [...studentProgramMap[eku_id]])
          .flat()
      );
    }

    if (somePieCellIsClicked) {
      return new Set(
        [...gridTwoIDsSubset]
          .map((eku_id) => [...studentProgramMap[eku_id]])
          .flat()
      );
    }
  }, [
    clickedRows,
    gridTwoIDsSubset,
    studentProgramMap,
    somePieCellIsClicked,
    gridTwoHasClickedRows,
  ]);

  const gridOneDoesExternalFilterPass = useCallback(
    (node) => !gridOneIDsSubset || gridOneIDsSubset.has(node.data.group),
    [gridOneIDsSubset]
  );

  const gridTwoDoesExternalFilterPass = useCallback(
    (node) => !gridTwoIDsSubset || gridTwoIDsSubset.has(node.data.eku_id),
    [gridTwoIDsSubset]
  );

  const filteredGridTwoRowData = gridTwoRowData.filter(
    ({ eku_id }) => !gridTwoIDsSubset || gridTwoIDsSubset.has(eku_id)
  );

  const pieChartData = Object.entries(
    groupRowsByColumns(
      somePieCellIsClicked ? gridTwoRowData : filteredGridTwoRowData,
      ["student_waiver_type"]
    ).tree
  ).map(([name, { data }]) => ({ value: data.length, name }));

  const handlePieCellClick = (e) => {
    setActivePieCell((name) => (e.name === name ? null : e.name));

    setClickedRows({ nodes: [], api: null });
  };

  if (someRowsAreClicked && somePieCellIsClicked) setActivePieCell(null);

  const getPieCellFillOpacity = (name) =>
    activePieCell !== null && name !== activePieCell ? 0.375 : 1;

  const pinnedTopRowData = useMemo(
    () => clickedRows.nodes.map(({ data }) => data),
    [clickedRows]
  );

  const gridOnePinnedTopRowData = useMemo(
    () => (gridOneHasClickedRows ? pinnedTopRowData : []),
    [gridOneHasClickedRows, pinnedTopRowData]
  );

  const gridTwoPinnedTopRowData = useMemo(
    () => (gridTwoHasClickedRows ? pinnedTopRowData : []),
    [gridTwoHasClickedRows, pinnedTopRowData]
  );

  return (
    <MainContainer style={{ fontSize: 14 }}>
      <MainSection>
        <Row>
          <div className="col-4">
            <AgThemeBalham>
              <AgGridReactMemoized
                doesExternalFilterPass={gridOneDoesExternalFilterPass}
                isExternalFilterPresent={isExternalFilterPresent}
                // pinnedTopRowData={gridOnePinnedTopRowData}
                onSelectionChanged={onSelectionChanged}
                autoSizeStrategy={autoSizeStrategy}
                columnDefs={gridOneColumnDefs}
                onRowClicked={onRowClicked}
                rowData={gridOneRowData}
                selection={selection}
                ref={gridOneRef}
              ></AgGridReactMemoized>
            </AgThemeBalham>
          </div>
          <div className="col-8">
            <AgThemeBalham>
              <AgGridReactMemoized
                doesExternalFilterPass={gridTwoDoesExternalFilterPass}
                isExternalFilterPresent={isExternalFilterPresent}
                // pinnedTopRowData={gridTwoPinnedTopRowData}
                onSelectionChanged={onSelectionChanged}
                autoSizeStrategy={autoSizeStrategy}
                columnDefs={gridTwoColumnDefs}
                onRowClicked={onRowClicked}
                rowData={gridTwoRowData}
                selection={selection}
                ref={gridTwoRef}
              ></AgGridReactMemoized>
            </AgThemeBalham>
          </div>
        </Row>
        <Row>
          <div className="col-4">
            <ResponsiveContainer height={400}>
              <PieChart>
                <Pie
                  label={renderCustomizedLabel}
                  onClick={handlePieCellClick}
                  data={pieChartData}
                  labelLine={false}
                  outerRadius={100}
                  dataKey="value"
                  fill="#8884d8"
                  cx="50%"
                  cy="50%"
                >
                  {pieChartData.map(({ name }, index) => (
                    <Cell
                      fillOpacity={getPieCellFillOpacity(name)}
                      fill={colors[index % colors.length]}
                      key={`cell-${index}`}
                      cursor="pointer"
                    />
                  ))}
                </Pie>
                <Tooltip></Tooltip>
                <Legend></Legend>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="col-8">
            <ResponsiveContainer height={400}>
              <ComposedChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="term_desc" />
                <YAxis orientation="left" stroke="#8884d8" yAxisId="left" />
                <YAxis orientation="right" stroke="#82ca9d" yAxisId="right" />
                <Tooltip />
                <Legend />
                <Bar dataKey="student_amount" yAxisId="left" fill="#8884d8" />
                <Line
                  dataKey="student_term_quantity"
                  stroke="#82ca9d"
                  yAxisId="right"
                  strokeWidth={2}
                  // type="monotone"
                  fill="#82ca9d"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Row>
      </MainSection>
    </MainContainer>
  );
}
