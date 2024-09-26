export const CSSGrid = ({ children }) => {
  return (
    <div className="bd-example m-0 border-0 bd-example-cssgrid">
      <div className="grid">
        {children.map((child, index) => (
          <div className="g-col-6" key={index}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};
