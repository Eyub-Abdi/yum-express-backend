// services/emailTemplates.js
const getEmailTemplate = (type, { firstName, token, entityType, message }) => {
  switch (type) {
    case 'verification': {
      const link = `http://localhost:5000/api/${entityType}/verify-email?token=${token}`
      return `
        <div style="font-family: Arial; padding: 20px; background-color: #f8f8f8;">
          <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 10px;">
            <h2>Email Verification</h2>
            <p>Hi ${firstName},</p>
            <p>Please verify your email by clicking the link below:</p>
            <a href="${link}" style="background: #e63946; padding: 10px 20px; color: #fff; text-decoration: none;">Verify Email</a>
          </div>
        </div>
      `
    }

    case 'support': {
      return `
        <div style="font-family: Arial; padding: 20px; background-color: #f8f8f8;">
          <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 10px;">
            <h2>Support Message</h2>
            <p>Hi Admin,</p>
            <p>You received a new support message from ${firstName}:</p>
            <blockquote style="background-color: #f1f1f1; padding: 15px;">${message}</blockquote>
          </div>
        </div>
      `
    }

    default:
      return `<p>Unknown email type</p>`
  }
}

module.exports = { getEmailTemplate }
