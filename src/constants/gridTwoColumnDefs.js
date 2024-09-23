import { formatValue2DecimalPlaces } from "../helpers/formatValue2DecimalPlaces";

export const gridTwoColumnDefs = [
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
