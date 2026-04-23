const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Event Service API",
      version: "1.0.0",
      description:
        "Event ticketing platform microservice for managing events, publication, and discovery",
    },
    servers: [
      {
        url: "/",
        description: "Default server",
      },
    ],
    components: {
      schemas: {
        Event: {
          type: "object",
          properties: {
            _id: { type: "string" },
            event_name: { type: "string" },
            slug: { type: "string" },
            short_description: { type: "string" },
            description: { type: "string" },
            date: { type: "string", format: "date-time" },
            time: { type: "string" },
            venue_name: { type: "string" },
            city: { type: "string" },
            location: { type: "string" },
            category: { type: "string" },
            banner_image: { type: "string" },
            is_featured: { type: "boolean" },
            is_published: { type: "boolean" },
            organizer_id: { type: "string" },
            status: {
              type: "string",
              enum: ["draft", "published", "cancelled", "completed"],
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        EventResponse: {
          type: "object",
          properties: {
            event: { $ref: "#/components/schemas/Event" },
          },
        },
        EventsResponse: {
          type: "object",
          properties: {
            events: {
              type: "array",
              items: { $ref: "#/components/schemas/Event" },
            },
          },
        },
        EventValidationResponse: {
          type: "object",
          properties: {
            exists: { type: "boolean" },
            status: { type: "string" },
            date: { type: "string", format: "date-time" },
            bookable: { type: "boolean" },
          },
        },
        EventExistsFalseResponse: {
          type: "object",
          properties: {
            exists: { type: "boolean", example: false },
          },
        },
        MessageResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
            error: { type: "string" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };
