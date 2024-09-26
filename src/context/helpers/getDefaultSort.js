const defaultSort = {
  student_amount: "desc",
  distinct_eku_id: "asc",
};

export const getDefaultSort = (field) =>
  field in defaultSort ? defaultSort[field] : null;
