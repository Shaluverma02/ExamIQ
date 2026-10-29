import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import API, { getApiErrorMessage } from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function useCollegeOverview({ includeGroups = true } = {}) {
  const { activeCollege } = useContext(AuthContext);
  const latestRequest = useRef(0);
  const [state, setState] = useState({ analytics: null, users: [], groups: [], loading: true, error: '' });
  const reload = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setState(previous => ({ ...previous, loading: true, error: '' }));
    try {
      const [analytics, users, groups] = await Promise.all([API.get('/admin/analytics'), API.get('/admin/users?limit=6'), includeGroups ? API.get('/groups') : Promise.resolve({ data: { groups: [] } })]);
      if (requestId !== latestRequest.current) return;
      setState({ analytics: analytics.data.analytics, users: users.data.users || [], groups: groups.data.groups || [], loading: false, error: '' });
    } catch (error) {
      if (requestId !== latestRequest.current) return;
      setState(previous => ({ ...previous, loading: false, error: getApiErrorMessage(error, 'Unable to load your college overview.') }));
    }
  }, [activeCollege?._id, includeGroups]);
  useEffect(() => { reload(); return () => { latestRequest.current += 1; }; }, [reload]);
  return { ...state, reload };
}
