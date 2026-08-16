const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_USER || 'mock_user',
      pass: process.env.SMTP_PASS || 'mock_pass',
    },
  });

  const message = {
    from: `${process.env.FROM_NAME || 'Exam Portal'} <${process.env.SMTP_FROM || 'no-reply@examportal.edu'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || `<p>${options.message}</p>`,
  };

  try {
    const info = await transporter.sendMail(message);
    console.log(`Email sent: %s`, info.messageId);
    return info;
  } catch (err) {
    console.warn(`[Nodemailer Fallback] Email to ${options.email} could not be dispatched via SMTP (${err.message}). Logging message instead:`);
    console.log(`SUBJECT: ${options.subject}\nMESSAGE: ${options.message}`);
    return { mock: true };
  }
};

module.exports = sendEmail;
