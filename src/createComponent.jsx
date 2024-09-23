export const createComponent = ({
  className: inheritedClassName,
  as: defaultElement = "div",
  style: inheritedStyle,
  ...defaultProps
}) => {
  const combineClassNames = (declaredClassName) =>
    [inheritedClassName, declaredClassName]
      .filter(
        (className) => typeof className === "string" && className.length > 0
      )
      .join(" ");

  const combineStyles = (declaredStyle) => ({
    ...inheritedStyle,
    ...declaredStyle,
  });

  const consumeDefaultProps = (declaredProps) => ({
    ...Object.fromEntries(
      Object.entries(defaultProps).filter(
        ([propName]) => !(propName in declaredProps)
      )
    ),
    ...declaredProps,
  });

  const Component = ({
    className: declaredClassName,
    style: declaredStyle,
    as = defaultElement,
    ...declaredProps
  }) => {
    const As = as;

    const elementProps = {
      className: combineClassNames(declaredClassName),
      style: combineStyles(declaredStyle),
      ...consumeDefaultProps(declaredProps),
    };

    return <As {...elementProps}></As>;
  };

  return Component;
};
