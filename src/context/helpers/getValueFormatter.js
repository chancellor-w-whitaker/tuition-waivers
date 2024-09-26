import { formatNumber2DecimalPlaces } from "./formatNumber2DecimalPlaces";
import { formatNumberWithCommas } from "./formatNumberWithCommas";

const valueFormatters = {
  distinct_term_desc: formatNumberWithCommas,
  student_amount: formatNumber2DecimalPlaces,
  enrolled_hours: formatNumber2DecimalPlaces,
  distinct_eku_id: formatNumberWithCommas,
};

const defaultValueFormatter = ({ value }) => value;

export const getValueFormatter = (field) =>
  field in valueFormatters ? valueFormatters[field] : defaultValueFormatter;
