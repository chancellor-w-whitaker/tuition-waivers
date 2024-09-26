export const distinguishDistinctKeys = (object) =>
  Object.fromEntries(
    Object.entries(object).map(([key, value]) => [`distinct_${key}`, value])
  );
