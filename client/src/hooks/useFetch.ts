import { useEffect, useReducer, useState } from 'react';

import { getCachedData, isOverCacheTime, setCachedData } from 'storages/memory';

type Status = 'init' | 'loading' | 'pending' | 'fetched' | 'error';

interface State<T> {
  data?: T;
  status: Status;
  promise?: Promise<void>;
  error?: Error;
}

type Action<T> =
  | { type: 'loading' }
  | { type: 'pending'; payload: any }
  | { type: 'fetched'; payload: T }
  | { type: 'error'; payload: Error };

interface UseFetchProps<T> {
  fetcher: () => Promise<T>;
  cacheTime?: number;
  cacheKey: string;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

function useFetch<T = unknown>({
  fetcher,
  cacheKey,
  cacheTime,
  onSuccess,
  onError,
}: UseFetchProps<T>) {
  const initialState: State<T> = {
    error: undefined,
    data: undefined,
    status: 'init',
    promise: undefined,
  };

  const fetchReducer = (state: State<T>, action: Action<T>): State<T> => {
    switch (action.type) {
      case 'loading':
        return { ...initialState, status: 'loading' };
      case 'pending': {
        return { ...initialState, status: 'pending', promise: action.payload };
      }
      case 'fetched':
        return { ...initialState, status: 'fetched', data: action.payload };
      case 'error':
        return { ...initialState, status: 'error', error: action.payload };
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(fetchReducer, initialState);
  const [trigger, setTrigger] = useState(false);

  function refetch() {
    setTrigger((prevState) => !prevState);
  }

  function resolvePromise(data: T) {
    setCachedData({ key: cacheKey, data, cacheTime });
    dispatch({ type: 'fetched', payload: data });
    onSuccess?.(data);
  }
  function rejectPromise(error: Error) {
    dispatch({ type: 'error', payload: error });
    onError?.(error);
  }

  useEffect(() => {
    if (!fetcher) return;

    const abortController = new AbortController();

    dispatch({ type: 'loading' });

    const cachedData = getCachedData<T>(cacheKey);

    if (cachedData && !isOverCacheTime(cacheKey)) {
      dispatch({ type: 'fetched', payload: cachedData });
      return;
    }

    dispatch({ type: 'pending', payload: fetcher().then(resolvePromise, rejectPromise) });

    return () => {
      abortController.abort();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, trigger]);

  if (state.status === 'pending' && state.promise) {
    throw state.promise;
  }

  if (state.status === 'error') {
    throw state.error;
  }

  return { ...state, refetch };
}

export default useFetch;
