function getIo(req) {
  const io = req.app.locals.io;
  if (!io) {
    const err = new Error("Socket.IO not initialized");
    err.code = "SOCKET_NOT_READY";
    throw err;
  }
  return io;
}

async function sendInAppNotification(req, res) {
  const { userId, title, message, data } = req.body;

  if (!title || !message) {
    return res.status(400).json({ message: "title and message are required" });
  }

  const io = getIo(req);
  const payload = {
    title,
    message,
    data: data || null,
    timestamp: new Date().toISOString()
  };

  if (userId) {
    io.to(userId).emit("notification", payload);
  } else {
    io.emit("notification", payload);
  }

  return res.json({ status: "sent", target: userId || "all", payload });
}

module.exports = { sendInAppNotification };
