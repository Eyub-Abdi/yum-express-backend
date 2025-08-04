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

//   case 'rejectOrder':
//         const subject = payload.subject || `Order #${payload.orderId} Rejected by Vendor`

//         const mainHeading = payload.title || 'Order Rejected Notification'

//         const bodyMessage = `
//   <p style="font-size: 16px; color: #333; text-align: left; line-height: 1.6;">
//     Order <strong>#${payload.orderId}</strong> has been rejected by vendor <strong>${payload.vendorName}</strong>.<br><br>
//     <strong>Reason:</strong> ${payload.reason}<br><br>
//     Please contact the vendor or the customer to handle the refund and next steps.
//   </p>
// `

//         // Immediately send and return here since this is a fully custom email
//         return await transporter.sendMail({
//           from: `"Yum Express" <${senderEmail}>`,
//           to: Array.isArray(recipientEmail) ? recipientEmail.join(', ') : recipientEmail,
//           subject,
//           html: `
//                <div style="font-family: Arial, sans-serif; background-color: #f8f8f8; padding: 20px; text-align: center;">
//   <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 10px; box-shadow: 2px 2px 10px rgba(0,0,0,0.1);">
//     <h2 style="color: #333; margin-top: 20px;">${mainHeading}</h2>
//     <p style="color: #555;">${bodyMessage}</p>

//     <div style="display: flex; justify-content: center; flex-wrap: wrap; margin-top: 20px;">
//       <a href="tel:${payload.vendorPhone}"
//         style="display: inline-block; width: 45%; margin: 5px; text-align: center; padding: 10px 0; font-size: 16px;
//         color: #fff; background-color: #e63946; text-decoration: none; border-radius: 5px; font-weight: bold;">
//         Call Vendor
//       </a>
//       <a href="tel:${payload.customerPhone}"
//         style="display: inline-block; width: 45%; margin: 5px; text-align: center; padding: 10px 0; font-size: 16px;
//         color: #fff; background-color: #457b9d; text-decoration: none; border-radius: 5px; font-weight: bold;">
//         Call Customer
//       </a>
//     </div>
//   </div>
// </div>

//                 `
//         })
