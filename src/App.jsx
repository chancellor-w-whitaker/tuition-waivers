import { AgGridReact } from "ag-grid-react";

import { ActiveShapePieChart } from "./components/ActiveShapePieChart";
import { BiaxialBarChart } from "./components/BiaxialBarChart";
import { useAppContext } from "./context/utils/useAppContext";
import { EvenOddGrid } from "./components/EvenOddGrid";
import { Popover } from "./components/Popover";

export default function App() {
  const { waiverTypeData, semesterData, programData, studentData, termData } =
    useAppContext();

  return (
    <div>
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3 border-bottom">
        <h1 className="h2">Employee Tuition Waivers</h1>
        <Popover
          openUp={
            <div className="list-group text-nowrap">
              <label className="list-group-item d-flex gap-2">
                <input
                  className="form-check-input flex-shrink-0"
                  checked={termData.allAreChecked}
                  onChange={termData.onAllChange}
                  type="checkbox"
                  name="terms"
                />
                <span>{"All"}</span>
              </label>
              {termData.list.map((term) => {
                return (
                  <label className="list-group-item d-flex gap-2" key={term}>
                    <input
                      className="form-check-input flex-shrink-0"
                      checked={termData.isChecked(term)}
                      onChange={termData.onChange}
                      type="checkbox"
                      value={term}
                      name="terms"
                    />
                    <span>{term}</span>
                  </label>
                );
              })}
            </div>

            // <ul className="dropdown-menu d-block">
            //   {termData.list.map((term) => (
            //     <li key={term}>
            //       <button
            //         className={`dropdown-item${
            //           termData.isActive(term) ? " active" : ""
            //         }`}
            //         onClick={() => termData.onClick(term)}
            //         type="button"
            //       >
            //         {term}
            //       </button>
            //     </li>
            //   ))}
            // </ul>
          }
          openWith={
            <button className="btn btn-secondary dropdown-toggle" type="button">
              Terms
            </button>
          }
        ></Popover>
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
