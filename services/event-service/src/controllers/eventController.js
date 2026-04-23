const Event = require("../models/Event");
const {
  sendEventEmailNotification,
  sendEventSmsNotification,
} = require("../utils/notificationClient");
const {
  cancelEventTickets,
  getEventTicketSummary,
} = require("../utils/ticketClient");
const { uploadBufferToCloudinary } = require("../utils/cloudinary");

const DEFAULT_EMAIL_LOGO_URL =
  "https://dummyimage.com/180x44/ffffff/111827.png&text=Event+Management";

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
    return formatHumanDate(value);
  }

  if (key === "time") {
    return formatHumanTime(value);
  }

  return String(value);
}

function formatHumanDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function formatHumanTime(value) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  if (value instanceof Date) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    }).format(value);
  }

  const raw = String(value).trim();

  // Convert 24-hour values like 19:00 or 19:00:00 to 7:00 PM.
  const twentyFourHourMatch = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (twentyFourHourMatch) {
    const hour = Number(twentyFourHourMatch[1]);
    const minute = Number(twentyFourHourMatch[2]);

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      const marker = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${String(minute).padStart(2, "0")} ${marker}`;
    }
  }

  // Normalize values like 7:00pm, 7 PM, 07:00 Am.
  const twelveHourMatch = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*([aApP][mM])$/);
  if (twelveHourMatch) {
    const hour = Number(twelveHourMatch[1]);
    const minute = Number(twelveHourMatch[2] || "0");
    const marker = twelveHourMatch[3].toUpperCase();

    if (hour >= 1 && hour <= 12 && minute >= 0 && minute <= 59) {
      return `${hour}:${String(minute).padStart(2, "0")} ${marker}`;
    }
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    }).format(parsed);
  }

  return raw;
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
        `<tr><td style=\"padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px; vertical-align: top;\">${escapeHtml(entry.label)}</td><td style=\"padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;\">${escapeHtml(entry.value)}</td></tr>`,
    )
    .join("");
}

function getEmailLogoUrl() {
  const configured = process.env.EMAIL_LOGO_URL;
  if (!configured) {
    return DEFAULT_EMAIL_LOGO_URL;
  }

  const trimmed = configured.trim();
  if (!trimmed) {
    return DEFAULT_EMAIL_LOGO_URL;
  }

  return trimmed;
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
  const logoUrl = getEmailLogoUrl();

  return `
<div style="margin: 0; padding: 24px 12px; background-color: #f3f4f6; font-family: Arial, Helvetica, sans-serif; color: #111827;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 680px; margin: 0 auto; border-collapse: collapse;">
    <tr>
      <td style="background: #111827; padding: 20px 24px; border-radius: 12px 12px 0 0;">
        <img src="${escapeHtml(logoUrl)}" alt="Event Management System" style="display: block; height: 34px; width: auto; max-width: 220px;" />
      </td>
    </tr>
    <tr>
      <td style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 12px 12px;">
        <h2 style="margin: 0 0 10px; font-size: 24px; color: #111827; line-height: 1.25;">${escapeHtml(heading)}</h2>
        <p style="margin: 0 0 18px; color: #374151; font-size: 15px; line-height: 1.6;">${escapeHtml(intro)}</p>

        ${messageText ? `<div style="background: ${messageBg}; border: 1px solid ${messageBorder}; border-radius: 10px; padding: 12px 14px; margin: 0 0 18px; color: #111827; font-size: 14px; line-height: 1.5;"><strong>${escapeHtml(messageText)}</strong></div>` : ""}

        ${extraSectionTitle && extraSectionHtml ? `<div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin: 0 0 18px; background: #fafafa;"><h3 style="margin: 0 0 10px; font-size: 16px; color: #111827;">${escapeHtml(extraSectionTitle)}</h3>${extraSectionHtml}</div>` : ""}

        <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin: 0 0 20px; background: #ffffff;">
          <h3 style="margin: 0 0 10px; font-size: 16px; color: #111827;">${escapeHtml(detailsTitle)}</h3>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
            ${buildDetailsHtml(detailsEntries)}
          </table>
        </div>

        <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.6; border-top: 1px solid #e5e7eb; padding-top: 12px;">
          This is an automated message from Event Management System.
        </p>
      </td>
    </tr>
  </table>
</div>`.trim();
}

function buildChangedFieldHtml(changedFieldEntries) {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
  ${changedFieldEntries
    .map(
      (change) =>
        `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px; vertical-align: top;">${escapeHtml(change.label)}</td><td style="padding: 8px 0; color: #111827; font-size: 14px;"><span style="color: #6b7280;">${escapeHtml(change.oldValue)}</span> <span style="color: #9ca3af;">-></span> <strong style="color: #111827;">${escapeHtml(change.newValue)}</strong></td></tr>`,
    )
    .join("")}
</table>`.trim();
}

function getAuthenticatedUserId(req) {
  return req.user?.id || req.user?._id || req.user?.sub || null;
}

function getAuthenticatedUserRole(req) {
  return req.user?.role || req.user?.roleName || null;
}

function canManageEvent(req, event) {
  const userRole = getAuthenticatedUserRole(req);

  if (userRole === "admin" || userRole === "event_manager") {
    return true;
  }

  return false;
}

function buildEventSearchFilter(query, { allowStatus = false } = {}) {
  const { city, category, date, status } = query;
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
      return { error: "Invalid date query parameter" };
    }

    const startOfDay = new Date(parsedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(parsedDate);
    endOfDay.setHours(23, 59, 59, 999);

    filter.date = { $gte: startOfDay, $lte: endOfDay };
  }

  if (allowStatus && status) {
    const allowedStatuses = ["draft", "published", "cancelled", "completed"];

    if (!allowedStatuses.includes(status)) {
      return {
        error:
          "Invalid status query parameter. Allowed values: draft, published, cancelled, completed",
      };
    }

    filter.status = status;
  }

  return { filter };
}

async function uploadBanner(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No banner file uploaded" });
    }

    const uploadedImage = await uploadBufferToCloudinary(req.file.buffer);

    return res.status(201).json({
      message: "Banner uploaded successfully",
      imageUrl: uploadedImage.secure_url,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Banner upload failed", error: err.message });
  }
}

async function createEvent(req, res) {
  console.log(
    `[createEvent] controller start requestId=${req.headers["x-request-id"] || "n/a"} userId=${getAuthenticatedUserId(req) || "n/a"}`,
  );

  const payload = { ...req.body };
  const authenticatedUserId = getAuthenticatedUserId(req);

  if (!authenticatedUserId) {
    return res.status(401).json({ message: "Authenticated user ID not found" });
  }

  payload.organizer_id = authenticatedUserId;

  if (!payload.title && payload.event_name) {
    payload.title = payload.event_name;
  }

  if (!payload.slug) {
    console.warn("[createEvent] missing required field: slug");
    return res.status(400).json({ message: "slug is required" });
  }

  try {
    console.log(
      `[createEvent] before Event.create payload=${JSON.stringify({
        title: payload.title,
        slug: payload.slug,
        date: payload.date,
        category: payload.category,
        organizer_id: payload.organizer_id,
      })}`,
    );

    const event = await Event.create(payload);

    console.log(
      `[createEvent] after Event.create eventId=${event._id} organizer_contact_email=${event.organizer_contact_email || "<empty>"}`,
    );

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

    console.log(
      `[createEvent] before response status=201 eventId=${event._id}`,
    );
    return res.status(201).json({ event });
  } catch (err) {
    console.error(
      `[createEvent] catch errName=${err.name} errMessage=${err.message}`,
    );

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

async function getAllEventsForManagement(req, res) {
  try {
    const events = await Event.find({}).sort({ createdAt: -1 });
    return res.json({ events });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to fetch events", error: err.message });
  }
}

async function searchEventsForManagement(req, res) {
  try {
    const { filter, error } = buildEventSearchFilter(req.query, {
      allowStatus: true,
    });

    if (error) {
      return res.status(400).json({ message: error });
    }

    const events = await Event.find(filter).sort({ createdAt: -1 });
    return res.json({ events });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to search events", error: err.message });
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

    if (!canManageEvent(req, originalEvent)) {
      return res
        .status(403)
        .json({ message: "You are not allowed to manage this event" });
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
        const changedDetailsHtml = buildChangedFieldHtml(changedFieldEntries);

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
    const existingEvent = await Event.findById(id);

    if (!existingEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!canManageEvent(req, existingEvent)) {
      return res
        .status(403)
        .json({ message: "You are not allowed to manage this event" });
    }

    try {
      const ticketSummary = await getEventTicketSummary(id);
      console.log(
        `[deleteEvent] ticket summary for event ${id}: ${JSON.stringify(ticketSummary)}`,
      );

      const hasTickets = Boolean(ticketSummary?.has_tickets);
      const totalSold = Number(ticketSummary?.total_sold || 0);
      if (hasTickets || totalSold > 0) {
        return res.status(409).json({
          message:
            "Cannot delete event because tickets already exist or have been sold.",
        });
      }
    } catch (ticketErr) {
      console.error(
        `[deleteEvent] failed to verify ticket status for event ${id}: ${ticketErr.message}`,
      );
      return res.status(502).json({
        message:
          "Unable to verify ticket status from ticket-service before deleting event",
        error: ticketErr.message,
      });
    }

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
  try {
    const { filter, error } = buildEventSearchFilter(req.query);

    if (error) {
      return res.status(400).json({ message: error });
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
  const eventId = req.params.id || req.params.eventId;

  try {
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ exists: false, bookable: false });
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

    if (!canManageEvent(req, event)) {
      return res
        .status(403)
        .json({ message: "You are not allowed to manage this event" });
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

    if (!canManageEvent(req, event)) {
      return res
        .status(403)
        .json({ message: "You are not allowed to manage this event" });
    }

    if (req.body?.organizer_contact_email) {
      event.organizer_contact_email = req.body.organizer_contact_email;
    }

    event.status = "cancelled";
    event.is_published = false;
    await event.save();

    let ticketCancellationResult = null;
    let ticketCancellationError = null;

    // After the event is marked cancelled, request Ticket Service to cancel ticket sales.
    try {
      ticketCancellationResult = await cancelEventTickets(event._id.toString());
      console.log(
        `[cancelEvent] Ticket Service bulk cancel success for event ${event._id}: ${JSON.stringify(ticketCancellationResult)}`,
      );
    } catch (ticketErr) {
      ticketCancellationError = ticketErr.message;
      console.error(
        `[cancelEvent] Ticket Service bulk cancel failed for event ${event._id}: ${ticketErr.message}`,
      );
    }

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

    if (ticketCancellationError) {
      return res.status(502).json({
        message:
          "Event cancelled, but failed to cancel related tickets in ticket-service",
        event,
        ticketCancellation: {
          success: false,
          error: ticketCancellationError,
        },
      });
    }

    return res.json({
      event,
      ticketCancellation: {
        success: true,
        result: ticketCancellationResult,
      },
    });
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
  uploadBanner,
  createEvent,
  getAllEvents,
  getAllEventsForManagement,
  searchEventsForManagement,
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
