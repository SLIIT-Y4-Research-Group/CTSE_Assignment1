const nodemailer = require("nodemailer");

function buildTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: String(process.env.SMTP_SECURE || "false") === "true",
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
      }
    });
  }

  if (process.env.EMAIL_SERVICE) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

async function sendEmail({ to, subject, text, html, opts = {} }) {
  if (!to || !subject || (!text && !html)) {
    const err = new Error("to, subject, and text or html are required");
    err.code = "EMAIL_INVALID";
    throw err;
  }

  const transporter = buildTransport();
  const defaultFrom = process.env.EMAIL_USER
    ? `EventHub <${process.env.EMAIL_USER}>`
    : undefined;
  const fromAddress =
    opts.from ||
    process.env.EMAIL_FROM ||
    process.env.MAIL_FROM ||
    defaultFrom;

  if (!fromAddress) {
    const err = new Error("EMAIL_FROM or EMAIL_USER is not configured");
    err.code = "SMTP_NOT_CONFIGURED";
    throw err;
  }

  const mailOptions = {
    from: fromAddress,
    to,
    subject,
    text
  };

  if (html) {
    mailOptions.html = html;
  }

  const info = await transporter.sendMail(mailOptions);
  return { messageId: info.messageId, response: info.response };
}

module.exports = { sendEmail };
