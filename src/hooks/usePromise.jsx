import { useEffect, useState } from "react";

// inspired by custom useData hook found here: https://react.dev/learn/reusing-logic-with-custom-hooks#when-to-use-custom-hooks

export const usePromise = (promise) => {
  const [state, setState] = useState(null);

  useEffect(() => {
    if (promise) {
      let ignore = false;

      promise.then((json) => !ignore && setState(json));

      return () => {
        ignore = true;
      };
    }
  }, [promise]);

  return state;
};
