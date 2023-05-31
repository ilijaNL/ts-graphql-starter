import Router from 'next/router';
import { useEffect, useRef } from 'react';

type RedirectProps = {
  redirectTo: string;
  redirectToPrevious?: boolean;
  loadingComp?: JSX.Element;
};

const LOCAL_KEY = 'redirectFromUrl';

export const getLastRedirectFrom = (): string | null => {
  try {
    return window.localStorage.getItem(LOCAL_KEY);
  } catch (e) {}
  return null;
};

/**
 * Component which redirects to `redirectTo` path
 * as side effect, it stores the current location in the localstorage
 * The location can be later retrieved by calling `getLastRedirectFrom`
 */
const Redirect = ({ redirectTo, loadingComp, redirectToPrevious }: RedirectProps) => {
  const hasRedirected = useRef(false);
  // when redirecting, always store the current location, such that it can be used by other components
  // note: should we really use localstorage or can we just use in memory ?
  useEffect(() => {
    if (hasRedirected.current) {
      return;
    }

    const to = !!redirectToPrevious ? getLastRedirectFrom() ?? redirectTo : redirectTo;
    try {
      window.localStorage.setItem(LOCAL_KEY, window.location.pathname + window.location.search);
    } catch (e) {}

    Router.replace(to);
    hasRedirected.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loadingComp) {
    return loadingComp;
  }

  return null;
};

export default Redirect;
