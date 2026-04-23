const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    short_description: { type: String },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },

    venue_name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },

    category: { type: String, required: true, trim: true },

    banner_image: { type: String },

    is_featured: { type: Boolean, default: false },

    organizer_id: { type: String, required: true },
    organizer_contact_email: { type: String },

    status: {
      type: String,
      enum: ["draft", "published", "cancelled", "completed"],
      default: "draft",
    },
  },
  { timestamps: true },
 { collection: 'events' });

module.exports = mongoose.model("Event", EventSchema);
