// Server-Sent Events broadcast manager for real-time updates

const clients = new Set();

export function addSSEClient(req, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*"
  });

  // Send a heartbeat immediately
  res.write("event: connected\ndata: {\"status\":\"connected\"}\n\n");

  clients.add(res);

  // Heartbeat every 30 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
}

export function broadcast(eventType, data) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    client.write(message);
  }
}

export function getClientCount() {
  return clients.size;
}
