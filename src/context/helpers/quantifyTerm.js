export const quantifyTerm = (termDesc) => {
  const [season, year] = termDesc.split(" ");

  const seasons = ["spring", "summer", "fall"];

  return Number(year + seasons.indexOf(season.toLowerCase()));
};
