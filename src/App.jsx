import { AgGridReact } from "ag-grid-react";

import { ActiveShapePieChart } from "./components/ActiveShapePieChart";
import { BiaxialBarChart } from "./components/BiaxialBarChart";
import { useAppContext } from "./context/utils/useAppContext";
import { EvenOddGrid } from "./components/EvenOddGrid";

export default function App() {
  const { waiverTypeData, semesterData, programData, studentData } =
    useAppContext();

  return (
    <div>
      <div className="mb-3 border-bottom">
        <h1>Employee Tuition Waivers</h1>
      </div>
      <EvenOddGrid>
        <div className="ag-theme-balham" style={{ height: 500 }}>
          <AgGridReact {...programData} />
        </div>
        <div className="ag-theme-balham" style={{ height: 500 }}>
          <AgGridReact {...studentData} />
        </div>
        <ActiveShapePieChart {...waiverTypeData}></ActiveShapePieChart>
        <BiaxialBarChart {...semesterData}></BiaxialBarChart>
      </EvenOddGrid>
    </div>
  );
}
