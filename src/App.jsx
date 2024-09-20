import {
  useCallback,
  forwardRef,
  useState,
  useMemo,
  useRef,
  memo,
} from "react";
import { AgGridReact } from "ag-grid-react";
import { csv } from "d3-fetch";

import { usePromise } from "./hooks/usePromise";

const dataPromise = csv("data/data.csv");

const validateArray = (array) => (Array.isArray(array) ? array : []);

const isStringNumeric = (param) => {
  const method1 = (string) => !Number.isNaN(string);

  const method2 = (string) => /^[+-]?\d+(\.\d+)?$/.test(string);

  const method3 = (string) => !Number.isNaN(Number(string));

  const method4 = (string) => Number.isFinite(+string);

  const method5 = (string) => string == Number.parseFloat(string);

  const methods = [method1, method2, method3, method4, method5];

  return !methods.some((method) => !method(param));
};

const groupRowsByColumns = (
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

// dropdown to filter on term
// default to only most recent selected

// move graphs underneath tables
// [] []
// [] []

// sort terms asc in graphs

// no need to show subset in pie chart
// what to do in bar chart when one student? (something simpler)

const formatValue2DecimalPlaces = ({ value }) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const gridOneColumnDefs = [
  { headerName: "Program", field: "group" },
  { headerName: "Distinct Students", field: "amount", sort: "asc" },
];

const gridTwoColumnDefs = [
  { headerName: "EKU ID", field: "eku_id" },
  { headerName: "Last Name", field: "last_name" },
  { headerName: "First Name", field: "first_name" },
  { field: "student_waiver_type", headerName: "Type" },
  {
    valueFormatter: formatValue2DecimalPlaces,
    field: "student_amount",
    headerName: "Waiver $",
    sort: "desc",
  },
  { field: "student_term_quantity", headerName: "Enrolled" },
  {
    valueFormatter: formatValue2DecimalPlaces,
    field: "enrolled_hours",
    headerName: "Hours",
  },
];

// const selection = {
//   enableClickSelection: true,
//   mode: "singleRow",
//   checkboxes: false,
// };

const autoSizeStrategy = { type: "fitCellContents" };

const selection = { checkboxes: false, mode: "multiRow" };

const onSelectionChanged = ({ api }) => api.onFilterChanged();

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
    <main className="container">
      <div className="my-3 p-3 bg-body rounded shadow-sm">
        <div className="row">
          <div className="col">
            <div className="ag-theme-balham" style={{ height: 500 }}>
              <MemoizedGrid
                doesExternalFilterPass={gridOneDoesExternalFilterPass}
                isExternalFilterPresent={isExternalFilterPresent}
                pinnedTopRowData={gridOnePinnedTopRowData}
                onSelectionChanged={onSelectionChanged}
                autoSizeStrategy={autoSizeStrategy}
                columnDefs={gridOneColumnDefs}
                onRowClicked={onRowClicked}
                rowData={gridOneRowData}
                selection={selection}
                ref={gridOneRef}
              ></MemoizedGrid>
            </div>
          </div>
          <div className="col">
            <div className="ag-theme-balham" style={{ height: 500 }}>
              <MemoizedGrid
                doesExternalFilterPass={gridTwoDoesExternalFilterPass}
                isExternalFilterPresent={isExternalFilterPresent}
                pinnedTopRowData={gridTwoPinnedTopRowData}
                onSelectionChanged={onSelectionChanged}
                autoSizeStrategy={autoSizeStrategy}
                columnDefs={gridTwoColumnDefs}
                onRowClicked={onRowClicked}
                rowData={gridTwoRowData}
                selection={selection}
                ref={gridTwoRef}
              ></MemoizedGrid>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

const MemoizedGrid = memo(
  forwardRef((props, ref) => <AgGridReact {...props} ref={ref}></AgGridReact>)
);
