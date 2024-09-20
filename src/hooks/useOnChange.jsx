import { useState } from "react";

export const useOnChange = (value, handleChange) => {
  const [previousValue, setPreviousValue] = useState(value);

  if (previousValue !== value) {
    setPreviousValue(value);

    typeof handleChange === "function" && handleChange(previousValue);
  }

  return previousValue;
};
