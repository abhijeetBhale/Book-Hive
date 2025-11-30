import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for infinite scroll pagination
 * @param {Function} fetchFunction - Function to fetch data (should accept page parameter)
 * @param {Object} options - Configuration options
 * @returns {Object} - { data, loading, error, hasMore, loadMore, reset }
 */
export const useInfiniteScroll = (fetchFunction, options = {}) => {
  const {
    initialPage = 1,
    pageSize = 20,
    enabled = true
  } = options;

  const [data, setData] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction(page, pageSize);
      
      if (!isMounted.current) return;

      const newData = result.data || result;
      const pagination = result.pagination;

      if (newData.length === 0 || (pagination && page >= pagination.pages)) {
        setHasMore(false);
      }

      setData(prev => [...prev, ...newData]);
      setPage(prev => prev + 1);
    } catch (err) {
      if (isMounted.current) {
        setError(err);
        console.error('Error loading more data:', err);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [fetchFunction, page, pageSize, loading, hasMore, enabled]);

  const reset = useCallback(() => {
    setData([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
  }, [initialPage]);

  // Load initial data
  useEffect(() => {
    if (enabled && data.length === 0 && !loading) {
      loadMore();
    }
  }, [enabled]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    reset
  };
};

export default useInfiniteScroll;
