export const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let sessionId = localStorage.getItem('anks_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('anks_session_id', sessionId);
  }
  return sessionId;
};

export const getAdminAuth = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('adminAuthenticated') === 'true';
};

export const setAdminAuth = (status: boolean) => {
  if (typeof window === 'undefined') return;
  if (status) {
    localStorage.setItem('adminAuthenticated', 'true');
  } else {
    localStorage.removeItem('adminAuthenticated');
  }
};
