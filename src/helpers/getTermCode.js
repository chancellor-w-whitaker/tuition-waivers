export const getTermCode = (termDesc) => {
  let semester = termDesc.split(" ")[0].toLowerCase();

  if (semester === "fall") {
    semester = 3;
  }

  if (semester === "summer") {
    semester = 2;
  }

  if (semester === "spring") {
    semester = 1;
  }

  return Number(termDesc.split(" ")[1] + semester);
};
