import { useEffect, useState } from "react";

export const usePromise = (promise) => {
  const [state, setState] = useState(null);

  useEffect(() => {
    if (promise) {
      let ignore = false;

      promise.then((value) => !ignore && setState(value));

      return () => {
        ignore = true;
      };
    }
  }, [promise]);

  return state;
};
