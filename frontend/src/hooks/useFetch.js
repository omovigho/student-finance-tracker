import { useQuery } from '@tanstack/react-query';
import api from '../api/api.js';

const useFetch = (queryKey, endpointOrFetcher, options = {}) => {
  const { requestConfig, ...queryOptions } = options;

  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: async () => {
      if (typeof endpointOrFetcher === 'function') {
        return endpointOrFetcher();
      }
      const { data } = await api.get(endpointOrFetcher, requestConfig ?? {});
      return data;
    },
    ...queryOptions
  });
};

export default useFetch;
