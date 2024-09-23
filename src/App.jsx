import { useCallback, useState, useMemo, useRef } from "react";
import { ResponsiveContainer, PieChart, Pie } from "recharts";

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

  const isExternalFilterPresent = useCallback(
    () => clickedRows.api && clickedRows.nodes.length > 0,
    [clickedRows]
  );

  if (isExternalFilterPresent()) {
    clickedRows.api.setNodesSelected({
      nodes: clickedRows.nodes,
      newValue: true,
    });
  }

  const gridOneIsFiltered =
    isExternalFilterPresent() && clickedRows.api === gridTwoRef.current.api;

  const gridTwoIsFiltered =
    isExternalFilterPresent() && clickedRows.api === gridOneRef.current.api;

  const gridOneIDsSubset = useMemo(
    () =>
      gridOneIsFiltered &&
      new Set(
        clickedRows.nodes
          .map(({ data: { eku_id } }) => [...studentProgramMap[eku_id]])
          .flat()
      ),
    [clickedRows, studentProgramMap, gridOneIsFiltered]
  );

  const gridTwoIDsSubset = useMemo(
    () =>
      gridTwoIsFiltered &&
      new Set(
        clickedRows.nodes
          .map(({ data: { group } }) => [...programStudentMap[group]])
          .flat()
      ),
    [clickedRows, programStudentMap, gridTwoIsFiltered]
  );

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
    groupRowsByColumns(filteredGridTwoRowData, ["student_waiver_type"]).tree
  ).map(([name, { data }]) => ({ value: data.length, name }));

  console.log(pieChartData);

  const pinnedTopRowData = useMemo(
    () => clickedRows.nodes.map(({ data }) => data),
    [clickedRows]
  );

  const gridOnePinnedTopRowData = useMemo(
    () => (gridTwoIsFiltered ? pinnedTopRowData : []),
    [gridTwoIsFiltered, pinnedTopRowData]
  );

  const gridTwoPinnedTopRowData = useMemo(
    () => (gridOneIsFiltered ? pinnedTopRowData : []),
    [gridOneIsFiltered, pinnedTopRowData]
  );

  return (
    <MainContainer>
      <MainSection>
        <Row>
          <Col>
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
          </Col>
          <Col>
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
          </Col>
        </Row>
        <Row>
          <Col>
            <ResponsiveContainer height={400}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  outerRadius={80}
                  dataKey="value"
                  fill="#8884d8"
                  cx="50%"
                  cy="50%"
                  label
                />
              </PieChart>
            </ResponsiveContainer>
          </Col>
          <Col></Col>
        </Row>
      </MainSection>
    </MainContainer>
  );
}
