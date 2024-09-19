import { AgGridReact } from "ag-grid-react";
import { useMemo } from "react";
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

const groupHeaderName = "Program";

const amountHeaderName = "Distinct Students";

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

  const gridOne = useMemo(
    () => ({
      columnDefs: [
        { headerName: groupHeaderName, field: "group" },
        { headerName: amountHeaderName, field: "amount", sort: "asc" },
      ],
      rowData: Object.entries(tree).map(([group, object]) => ({
        amount: Object.keys(object).length,
        group,
      })),
    }),
    [tree]
  );

  return (
    <main className="container">
      <div className="my-3 p-3 bg-body rounded shadow-sm">
        <div className="ag-theme-quartz" style={{ height: 500 }}>
          <AgGridReact
            autoSizeStrategy={{ type: "fitCellContents" }}
            {...gridOne}
          />
        </div>
      </div>
    </main>
  );
}
