// Custom hook: when the component that uses it appears on screen, scroll it
// into view and put the keyboard focus on its first field.
//
// Why: on the Exercises page the form is shown at the TOP of the page. If the
// user clicks "Edit" on a row far down the list, the form opens out of sight
// and it looks like nothing happened. Scrolling to it fixes that.
//
// Usage:   const formRef = useScrollIntoViewOnMount<HTMLFormElement>();
//          <form ref={formRef}> ... </form>

import { useEffect, useRef } from "react";

export function useScrollIntoViewOnMount<T extends HTMLElement>() {
  // A ref gives us direct access to the real DOM element after it is rendered.
  const ref = useRef<T>(null);

  // An effect with an empty dependency list ([]) runs ONCE, right after the
  // component first appears. That is exactly "on mount".
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Optional call (?.) because some environments, like the jsdom used in
    // tests, do not implement scrollIntoView.
    // We jump instantly ("auto") rather than animate: a smooth scroll can be
    // cancelled by the browser when the layout changes at the same moment.
    element.scrollIntoView?.({ behavior: "auto", block: "start" });

    // Focus the first field so the user can type immediately.
    // preventScroll: the scroll was already done above, no second jump.
    element
      .querySelector<HTMLElement>("input, select, textarea")
      ?.focus({ preventScroll: true });
  }, []);

  return ref;
}
