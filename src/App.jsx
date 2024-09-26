import { AgGridReact } from "ag-grid-react";

import { ActiveShapePieChart } from "./components/ActiveShapePieChart";
import { BiaxialBarChart } from "./components/BiaxialBarChart";
import { useAppContext } from "./context/utils/useAppContext";
import { CSSGrid } from "./components/CSSGrid";

export default function NewApp() {
  const { waiverTypeData, semesterData, programData, studentData } =
    useAppContext();

  return (
    <main className="container">
      <div className="my-3 p-3 bg-body rounded shadow-sm">
        <CSSGrid>
          <div className="ag-theme-balham" style={{ height: 500 }}>
            <AgGridReact {...programData} />
          </div>
          <div className="ag-theme-balham" style={{ height: 500 }}>
            <AgGridReact {...studentData} />
          </div>
          <ActiveShapePieChart {...waiverTypeData}></ActiveShapePieChart>
          <BiaxialBarChart {...semesterData}></BiaxialBarChart>
        </CSSGrid>
      </div>
    </main>
  );
}
