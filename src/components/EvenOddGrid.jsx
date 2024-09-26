export const EvenOddGrid = ({ children }) => {
  const isAtRightEnd = (index) => (index + 1) % 2 === 0;

  const spacingAmount = 4;

  return (
    <div className="d-flex flex-wrap">
      {children.map((child, index) => (
        <div
          className={`col-${isAtRightEnd(index) ? "8" : "4"} pe-${
            isAtRightEnd(index) ? "0" : spacingAmount
          } pb-${index > children.length - 3 ? "0" : spacingAmount}`}
          key={index}
        >
          {child}
        </div>
      ))}
    </div>
  );
};
