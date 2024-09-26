const headerNames = {
  distinct_term_desc: "Enrolled",
  distinct_eku_id: "Students",
  student_waiver_type: "Type",
  student_amount: "Waiver $",
  first_name: "First Name",
  program_desc: "Program",
  enrolled_hours: "Hours",
  last_name: "Last Name",
  eku_id: "EKU ID",
};

export const getHeaderName = (field) =>
  field in headerNames ? headerNames[field] : field;
