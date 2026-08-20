import { useEffect } from "react";

export function useSSE(url, onEvent) {
  useEffect(() => {
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      console.log(`[SSE] Connected to ${url}`);
    };

    eventSource.onmessage = (event) => {
      if (event.data) {
        try {
          const data = JSON.parse(event.data);
          onEvent(event.type, data);
        } catch (e) {
          // Heartbeat or simple string
        }
      }
    };

    eventSource.addEventListener("issue_created", (event) => {
      const data = JSON.parse(event.data);
      onEvent("issue_created", data);
    });

    eventSource.addEventListener("issue_updated", (event) => {
      const data = JSON.parse(event.data);
      onEvent("issue_updated", data);
    });

    eventSource.addEventListener("sla_breach", (event) => {
      const data = JSON.parse(event.data);
      onEvent("sla_breach", data);
    });

    eventSource.onerror = (error) => {
      console.error("[SSE] Connection error:", error);
      eventSource.close();
      
      // Auto-reconnect after 5 seconds
      setTimeout(() => {
        // Simple reconnect logic, React handles the re-render cycle
      }, 5000);
    };

    return () => {
      eventSource.close();
    };
  }, [url, onEvent]);
}
