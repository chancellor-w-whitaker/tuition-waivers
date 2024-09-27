import { useCallback, useEffect, useState, useRef } from "react";

export const Popover = ({
  openWith,
  onClose,
  onOpen,
  openUp,
  style,
  ...props
}) => {
  const { popover, isOpen, open } = usePopover({ onClose, onOpen });

  return (
    <div
      style={{ display: "inline-block", position: "relative", ...style }}
      {...props}
    >
      <div onClickCapture={open}>{openWith}</div>
      {isOpen && (
        <div style={{ position: "absolute", zIndex: 1000 }} ref={popover}>
          {openUp}
        </div>
      )}
    </div>
  );
};

const usePopover = ({ onClose, onOpen }) => {
  const popover = useRef();

  const [isOpen, toggle] = useState(false);

  const open = useCallback(() => {
    typeof onOpen === "function" && onOpen();

    toggle(true);
  }, [onOpen]);

  const close = useCallback(() => {
    typeof onClose === "function" && onClose();

    toggle(false);
  }, [onClose]);

  useClickOutside(popover, close);

  return { popover, isOpen, open };
};

// Improved version of https://usehooks.com/useOnClickOutside/
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    let startedInside = false;
    let startedWhenMounted = false;

    const listener = (event) => {
      // Do nothing if `mousedown` or `touchstart` started inside ref element
      if (startedInside || !startedWhenMounted) return;
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target)) return;

      handler(event);
    };

    const validateEventStart = (event) => {
      startedWhenMounted = ref.current;
      startedInside = ref.current && ref.current.contains(event.target);
    };

    document.addEventListener("mousedown", validateEventStart);
    document.addEventListener("touchstart", validateEventStart);
    document.addEventListener("click", listener);

    return () => {
      document.removeEventListener("mousedown", validateEventStart);
      document.removeEventListener("touchstart", validateEventStart);
      document.removeEventListener("click", listener);
    };
  }, [ref, handler]);
};
