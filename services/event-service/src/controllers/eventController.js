const Event = require("../models/Event");

async function createEvent(req, res) {
  const payload = { ...req.body };

  if (!payload.title && payload.event_name) {
    payload.title = payload.event_name;
  }

  if (!payload.slug) {
    return res.status(400).json({ message: "slug is required" });
  }

  try {
    const event = await Event.create(payload);
    return res.status(201).json({ event });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }

    return res
      .status(500)
      .json({ message: "Failed to create event", error: err.message });
  }
}

async function getAllEvents(req, res) {
  try {
    const events = await Event.find({ status: "published" }).sort({
      createdAt: -1,
    });
    return res.json({ events });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to fetch events", error: err.message });
  }
}

async function getEventById(req, res) {
  const { id } = req.params;

  try {
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    return res.json({ event });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    return res
      .status(500)
      .json({ message: "Failed to fetch event", error: err.message });
  }
}

async function updateEvent(req, res) {
  const { id } = req.params;

  try {
    const event = await Event.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    return res.json({ event });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }

    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    return res
      .status(500)
      .json({ message: "Failed to update event", error: err.message });
  }
}

async function deleteEvent(req, res) {
  const { id } = req.params;

  try {
    const event = await Event.findByIdAndDelete(id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    return res.json({ message: "Event deleted successfully" });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    return res
      .status(500)
      .json({ message: "Failed to delete event", error: err.message });
  }
}

async function searchEvents(req, res) {
  const { city, category, date } = req.query;

  try {
    const filter = {};

    if (city) {
      filter.city = { $regex: city.trim(), $options: "i" };
    }

    if (category) {
      filter.category = { $regex: category.trim(), $options: "i" };
    }

    if (date) {
      const parsedDate = new Date(date);

      if (Number.isNaN(parsedDate.getTime())) {
        return res
          .status(400)
          .json({ message: "Invalid date query parameter" });
      }

      const startOfDay = new Date(parsedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(parsedDate);
      endOfDay.setHours(23, 59, 59, 999);

      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const events = await Event.find(filter).sort({ date: 1 });
    return res.json({ events });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to search events", error: err.message });
  }
}

async function validateEvent(req, res) {
  const { id } = req.params;

  try {
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ exists: false });
    }

    const isActive = event.status === "published";
    const isFutureDate = new Date(event.date) > new Date();

    return res.json({
      exists: true,
      status: event.status,
      date: event.date,
      bookable: isActive && isFutureDate,
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    return res
      .status(500)
      .json({ message: "Failed to validate event", error: err.message });
  }
}

async function getFeaturedEvents(req, res) {
  try {
    const events = await Event.find({
      is_featured: true,
      status: "published",
    }).sort({ date: 1 });
    return res.json({ events });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to fetch featured events", error: err.message });
  }
}

async function publishEvent(req, res) {
  const { id } = req.params;

  try {
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.status = "published";
    event.is_published = true;
    await event.save();

    return res.json({ event });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    return res
      .status(500)
      .json({ message: "Failed to publish event", error: err.message });
  }
}

async function cancelEvent(req, res) {
  const { id } = req.params;

  try {
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.status = "cancelled";
    event.is_published = false;
    await event.save();

    return res.json({ event });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    return res
      .status(500)
      .json({ message: "Failed to cancel event", error: err.message });
  }
}

async function getEventsByOrganizer(req, res) {
  const { organizerId } = req.params;

  try {
    const events = await Event.find({ organizer_id: organizerId }).sort({
      createdAt: -1,
    });
    return res.json({ events });
  } catch (err) {
    return res
      .status(500)
      .json({
        message: "Failed to fetch organizer events",
        error: err.message,
      });
  }
}

async function getUpcomingEvents(req, res) {
  try {
    const now = new Date();
    const events = await Event.find({
      status: "published",
      date: { $gt: now },
    }).sort({ date: 1 });

    return res.json({ events });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to fetch upcoming events", error: err.message });
  }
}

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  searchEvents,
  validateEvent,
  getFeaturedEvents,
  publishEvent,
  cancelEvent,
  getEventsByOrganizer,
  getUpcomingEvents,
};
