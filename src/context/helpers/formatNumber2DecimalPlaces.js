export const formatNumber2DecimalPlaces = ({ value }) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
