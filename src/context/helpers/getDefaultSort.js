const defaultSort = {
  distinct_eku_id: "desc",
  student_amount: "desc",
};

export const getDefaultSort = (field) =>
  field in defaultSort ? defaultSort[field] : null;
