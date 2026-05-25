import { useState, useEffect } from "react";

export function useSessionId() {
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    let id = localStorage.getItem("anks_session_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("anks_session_id", id);
    }
    setSessionId(id);
  }, []);

  return sessionId;
}
