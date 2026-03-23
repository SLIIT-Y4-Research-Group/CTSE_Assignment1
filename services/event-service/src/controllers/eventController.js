const Event = require("../models/Event");
const {
  sendEventEmailNotification,
  sendEventSmsNotification,
} = require("../utils/notificationClient");

function getEventDisplayName(event) {
  return event.title || event.event_name || "Your event";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatFieldValue(key, value) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  if (key === "date") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return String(value);
}

function getCurrentEventDetailEntries(event) {
  return [
    {
      label: "Title",
      value: formatFieldValue("title", event.title || event.event_name),
    },
    { label: "Date", value: formatFieldValue("date", event.date) },
    { label: "Time", value: formatFieldValue("time", event.time) },
    {
      label: "Venue",
      value: formatFieldValue("venue_name", event.venue_name),
    },
    { label: "City", value: formatFieldValue("city", event.city) },
    {
      label: "Category",
      value: formatFieldValue("category", event.category),
    },
    { label: "Status", value: formatFieldValue("status", event.status) },
  ];
}

function buildDetailsText(entries) {
  return entries.map((entry) => `${entry.label}: ${entry.value}`).join("\n");
}

function buildDetailsHtml(entries) {
  return entries
    .map(
      (entry) =>
        `<p style=\"margin: 6px 0;\"><strong>${escapeHtml(entry.label)}:</strong> ${escapeHtml(entry.value)}</p>`,
    )
    .join("");
}

function buildEmailHtml({
  heading,
  intro,
  detailsTitle,
  detailsEntries,
  messageType,
  messageText,
  extraSectionTitle,
  extraSectionHtml,
}) {
  const messageBg =
    messageType === "success"
      ? "#e8f8ef"
      : messageType === "warning"
        ? "#fff4e5"
        : "#f3f4f6";
  const messageBorder =
    messageType === "success"
      ? "#b7e4c7"
      : messageType === "warning"
        ? "#ffd59e"
        : "#d1d5db";

  return `
<div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; max-width: 640px; margin: 0 auto;">
  <h2 style="margin: 0 0 12px; color: #111827;">${escapeHtml(heading)}</h2>
  <p style="margin: 0 0 16px;">${escapeHtml(intro)}</p>
  ${messageText ? `<div style="background: ${messageBg}; border: 1px solid ${messageBorder}; border-radius: 8px; padding: 12px; margin: 0 0 16px;"><strong>${escapeHtml(messageText)}</strong></div>` : ""}
  ${extraSectionTitle && extraSectionHtml ? `<div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin: 0 0 16px;"><h3 style="margin: 0 0 10px; font-size: 16px;">${escapeHtml(extraSectionTitle)}</h3>${extraSectionHtml}</div>` : ""}
  <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin: 0 0 16px;">
    <h3 style="margin: 0 0 10px; font-size: 16px;">${escapeHtml(detailsTitle)}</h3>
    ${buildDetailsHtml(detailsEntries)}
  </div>
  <p style="margin: 0; color: #6b7280; font-size: 13px;">Event Management System</p>
</div>`.trim();
}

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

    if (event.organizer_contact_email) {
      const eventName = getEventDisplayName(event);

      try {
        const detailsEntries = getCurrentEventDetailEntries(event);
        await sendEventEmailNotification({
          to: event.organizer_contact_email,
          subject: `Event Created: ${eventName}`,
          text: [
            "Hello,",
            "",
            `Your event \"${eventName}\" was created successfully.`,
            "",
            "Current event details:",
            buildDetailsText(detailsEntries),
            "",
            "Regards,",
            "Event Management System",
          ].join("\n"),
          html: buildEmailHtml({
            heading: `Event Created: ${eventName}`,
            intro: `Your event \"${eventName}\" was created successfully.`,
            detailsTitle: "Current event details",
            detailsEntries,
          }),
        });
        console.log(
          `[createEvent] creation notification sent for event ${event._id} to ${event.organizer_contact_email}`,
        );
      } catch (notifyErr) {
        console.error(
          `[createEvent] failed to send creation notification for event ${event._id}: ${notifyErr.message}`,
        );
      }
    } else {
      console.log(
        `[createEvent] notification skipped for event ${event._id}: organizer_contact_email is missing`,
      );
    }

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
    const originalEvent = await Event.findById(id);
    if (!originalEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    const event = await Event.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const trackedFields = [
      { key: "title", label: "Title" },
      { key: "date", label: "Date" },
      { key: "time", label: "Time" },
      { key: "venue_name", label: "Venue" },
      { key: "city", label: "City" },
      { key: "category", label: "Category" },
      { key: "status", label: "Status" },
    ];

    const changedFieldEntries = trackedFields
      .map(({ key, label }) => {
        const oldValue = formatFieldValue(key, originalEvent[key]);
        const newValue = formatFieldValue(key, event[key]);

        if (oldValue === newValue) {
          return null;
        }

        return { label, oldValue, newValue };
      })
      .filter(Boolean);

    const hasImportantChanges = changedFieldEntries.length > 0;

    if (hasImportantChanges) {
      if (event.organizer_contact_email) {
        const eventName = getEventDisplayName(event);
        const detailsEntries = getCurrentEventDetailEntries(event);
        const changedDetailsText = changedFieldEntries
          .map(
            (change) =>
              `${change.label}: ${change.oldValue} -> ${change.newValue}`,
          )
          .join("\n");
        const changedDetailsHtml = changedFieldEntries
          .map(
            (change) =>
              `<p style=\"margin: 6px 0;\"><strong>${escapeHtml(change.label)}:</strong> ${escapeHtml(change.oldValue)} -> ${escapeHtml(change.newValue)}</p>`,
          )
          .join("");

        try {
          await sendEventEmailNotification({
            to: event.organizer_contact_email,
            subject: `Event Updated: ${eventName}`,
            text: [
              "Hello,",
              "",
              `Important details for your event \"${eventName}\" were updated.`,
              "",
              "Updated details:",
              changedDetailsText,
              "",
              "Current event details:",
              buildDetailsText(detailsEntries),
              "",
              "Regards,",
              "Event Management System",
            ].join("\n"),
            html: buildEmailHtml({
              heading: `Event Updated: ${eventName}`,
              intro: `Important details for your event \"${eventName}\" were updated.`,
              detailsTitle: "Current event details",
              detailsEntries,
              extraSectionTitle: "Updated details",
              extraSectionHtml: changedDetailsHtml,
            }),
          });
          console.log(
            `[updateEvent] update notification sent for event ${event._id} to ${event.organizer_contact_email}`,
          );
        } catch (notifyErr) {
          console.error(
            `[updateEvent] failed to send update notification for event ${event._id}: ${notifyErr.message}`,
          );
        }
      } else {
        console.log(
          `[updateEvent] notification skipped for event ${event._id}: organizer_contact_email is missing`,
        );
      }
    } else {
      console.log(
        `[updateEvent] notification skipped for event ${event._id}: no important fields changed`,
      );
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

    if (event.organizer_contact_email) {
      const eventName = getEventDisplayName(event);

      try {
        const detailsEntries = getCurrentEventDetailEntries(event);
        await sendEventEmailNotification({
          to: event.organizer_contact_email,
          subject: `Event Deleted: ${eventName}`,
          text: [
            "Hello,",
            "",
            `Your event \"${eventName}\" has been deleted from the platform.`,
            "",
            "Last known event details:",
            buildDetailsText(detailsEntries),
            "",
            "Regards,",
            "Event Management System",
          ].join("\n"),
          html: buildEmailHtml({
            heading: `Event Deleted: ${eventName}`,
            intro: `Your event \"${eventName}\" has been deleted from the platform.`,
            detailsTitle: "Last known event details",
            detailsEntries,
            messageType: "warning",
            messageText: "This event is no longer available.",
          }),
        });
        console.log(
          `[deleteEvent] deletion notification sent for event ${event._id} to ${event.organizer_contact_email}`,
        );
      } catch (notifyErr) {
        console.error(
          `[deleteEvent] failed to send deletion notification for event ${event._id}: ${notifyErr.message}`,
        );
      }
    } else {
      console.log(
        `[deleteEvent] notification skipped for event ${event._id}: organizer_contact_email is missing`,
      );
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

    if (req.body?.organizer_contact_email) {
      event.organizer_contact_email = req.body.organizer_contact_email;
    }

    event.status = "published";
    event.is_published = true;
    await event.save();

    console.log(
      `[publishEvent] organizer_contact_email for event ${event._id}: ${event.organizer_contact_email || "<empty>"}`,
    );

    if (event.organizer_contact_email) {
      const eventName = getEventDisplayName(event);

      try {
        const detailsEntries = getCurrentEventDetailEntries(event);
        await sendEventEmailNotification({
          to: event.organizer_contact_email,
          subject: `Event Published: ${eventName}`,
          text: [
            "Hello,",
            "",
            `Your event \"${eventName}\" is now published and visible to users.`,
            "",
            "Current event details:",
            buildDetailsText(detailsEntries),
            "",
            "Regards,",
            "Event Management System",
          ].join("\n"),
          html: buildEmailHtml({
            heading: `Event Published: ${eventName}`,
            intro: `Your event \"${eventName}\" is now published and visible to users.`,
            detailsTitle: "Current event details",
            detailsEntries,
            messageType: "success",
            messageText: "This event is live and visible to users.",
          }),
        });
        console.log(
          `[publishEvent] publish notification sent for event ${event._id} to ${event.organizer_contact_email}`,
        );
      } catch (notifyErr) {
        console.error(
          `Failed to send publish notification: ${notifyErr.message}`,
        );
      }
    } else {
      console.log(
        `[publishEvent] notification skipped for event ${event._id}: organizer_contact_email is missing`,
      );
    }

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

    if (req.body?.organizer_contact_email) {
      event.organizer_contact_email = req.body.organizer_contact_email;
    }

    event.status = "cancelled";
    event.is_published = false;
    await event.save();

    console.log(
      `[cancelEvent] organizer_contact_email for event ${event._id}: ${event.organizer_contact_email || "<empty>"}`,
    );

    if (event.organizer_contact_email) {
      const eventName = getEventDisplayName(event);

      try {
        const detailsEntries = getCurrentEventDetailEntries(event);
        await sendEventEmailNotification({
          to: event.organizer_contact_email,
          subject: `Event Cancelled: ${eventName}`,
          text: [
            "Hello,",
            "",
            `Your event \"${eventName}\" has been cancelled.`,
            "",
            "Current event details:",
            buildDetailsText(detailsEntries),
            "",
            "Regards,",
            "Event Management System",
          ].join("\n"),
          html: buildEmailHtml({
            heading: `Event Cancelled: ${eventName}`,
            intro: `Your event \"${eventName}\" has been cancelled.`,
            detailsTitle: "Current event details",
            detailsEntries,
            messageType: "warning",
            messageText: "This event has been cancelled.",
          }),
        });
        console.log(
          `[cancelEvent] cancellation notification sent for event ${event._id} to ${event.organizer_contact_email}`,
        );
      } catch (notifyErr) {
        console.error(
          `Failed to send cancellation notification: ${notifyErr.message}`,
        );
      }
    } else {
      console.log(
        `[cancelEvent] notification skipped for event ${event._id}: organizer_contact_email is missing`,
      );
    }

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
    return res.status(500).json({
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
