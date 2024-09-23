export const createComponent = ({
  className: inheritedClassName,
  as: defaultElement = "div",
  style: inheritedStyle,
  ...defaultProps
}) => {
  const joinClassNames = (...classNames) =>
    classNames
      .filter(
        (className) => typeof className === "string" && className.length > 0
      )
      .join(" ");

  const kebabCase = (string) =>
    string
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .replace(/[\s_]+/g, "-")
      .toLowerCase();

  const kebabCaseSplit = (string) => kebabCase(string).split("-");

  const isPrefixProp = (propName) => {
    const propNameSplit = kebabCaseSplit(propName);

    return propNameSplit[0] === "prefix" && propNameSplit.length > 1;
  };

  const getActualPrefix = (propName) =>
    kebabCaseSplit(propName).slice(1).join("-");

  const getActualSuffix = (propValue) => kebabCaseSplit(propValue).join("-");

  const getPrefixProps = (props) =>
    Object.fromEntries(
      Object.entries(props).filter(([propName]) => isPrefixProp(propName))
    );

  const getStandardProps = (props) =>
    Object.fromEntries(
      Object.entries(props).filter(([propName]) => !isPrefixProp(propName))
    );

  const collectExtraClasses = (prefixProps) =>
    Object.entries(prefixProps)
      .map(([propName, suffixes]) => {
        const actualPrefix = getActualPrefix(propName);

        const suffixesArray = [suffixes].flat();

        return suffixesArray.map((propValue) =>
          [actualPrefix, getActualSuffix(propValue)]
            .filter(
              (kebabCasedString) =>
                typeof kebabCasedString === "string" &&
                `${kebabCasedString}`.length > 0
            )
            .join("-")
        );
      })
      .flat();

  const defaultPrefixProps = getPrefixProps(defaultProps);

  // before appending prefixed classes to inherited className, default prefix props actually need to be overwritten by declared props if applicable

  const defaultStandardProps = getStandardProps(defaultProps);

  // const extraDefaultClasses = collectExtraClasses(defaultPrefixProps);

  const combineClassNames = (declaredClassName) =>
    joinClassNames(inheritedClassName, declaredClassName);

  const combineStyles = (declaredStyle) => ({
    ...inheritedStyle,
    ...declaredStyle,
  });

  const consumeDefaultProps = (declaredProps) => ({
    ...Object.fromEntries(
      Object.entries(defaultStandardProps).filter(
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

    const finalPropsPassed = {
      className: combineClassNames(declaredClassName),
      style: combineStyles(declaredStyle),
      ...consumeDefaultProps(declaredProps),
    };

    return <As {...finalPropsPassed}></As>;
  };

  return Component;
};
