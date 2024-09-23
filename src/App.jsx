import {
  ResponsiveContainer,
  CartesianGrid,
  ComposedChart,
  PieChart,
  BarChart,
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
import { selection } from "./constants/selection";
import { usePromise } from "./hooks/usePromise";
import { Row } from "./components/Row";
import { Col } from "./components/Col";

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

export default function App() {
  const data = usePromise(dataPromise);

  const rows = useMemo(() => validateArray(data), [data]);

  // console.log(rows);

  // filter out empty waiver type
  // small font
  // right table wider column than left
  // charts underneath can be same width column (pie chart might need to be shrunk)

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

  // console.log(groupRows);

  const getTermCode = (termDesc) => {
    let semester = termDesc.split(" ")[0].toLowerCase();

    if (semester === "fall") {
      semester = 3;
    }

    if (semester === "summer") {
      semester = 2;
    }

    if (semester === "spring") {
      semester = 1;
    }

    return Number(termDesc.split(" ")[1] + semester);
  };

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

  console.log(barChartData);

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

  // console.log(
  //   groupRowsByColumns(
  //     somePieCellIsClicked ? gridTwoRowData : filteredGridTwoRowData,
  //     ["student_waiver_type"]
  //   )
  // );

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
                      fill={COLORS[index % COLORS.length]}
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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({
  innerRadius,
  outerRadius,
  midAngle,
  percent,
  cx,
  cy,
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fill="white"
      x={x}
      y={y}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};
