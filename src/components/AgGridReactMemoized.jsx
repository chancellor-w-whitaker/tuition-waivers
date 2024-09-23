import { AgGridReact } from "ag-grid-react";
import { forwardRef, memo } from "react";

export const AgGridReactMemoized = memo(
  forwardRef((props, ref) => <AgGridReact {...props} ref={ref}></AgGridReact>)
);
