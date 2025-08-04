const nodemailer = require('nodemailer')
const config = require('../../config/default')
const logger = require('../utils/logger')
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: parseInt(config.email.port || '465', 10),
  secure: config.email.secure, // true for port 465
  auth: {
    user: config.email.user,
    pass: config.email.pass
  }
})

const sendEmail = async ({ recipientEmail, firstName, type, payload = {} }) => {
  try {
    const senderEmail = config.email.user

    let subject = ''
    let mainHeading = ''
    let bodyMessage = ''
    let actionLink = ''
    let buttonText = ''

    switch (type) {
      case 'info':
        subject = payload.subject || 'Update from Yum-Express'
        mainHeading = payload.title || 'Important Update'
        bodyMessage = `Hi ${firstName},<br><br>${payload.message}`
        actionLink = payload.actionLink || ''
        buttonText = payload.buttonText || ''
        break

      case 'rejectOrder':
        subject = payload.subject || `Order #${payload.orderId} Rejected by Vendor`
        mainHeading = payload.title || 'Order Rejected Notification'
        bodyMessage = `
    Order <strong>#${payload.orderId}</strong> has been rejected by vendor <strong>${payload.vendorName}</strong>.<br>
    <strong>Reason:</strong> ${payload.reason}<br>
    Please contact the vendor or the customer to handle refund and next steps.
  `
        // Immediately send and return here since this is a fully custom email
        return await transporter.sendMail({
          from: `"Yum Express" <${senderEmail}>`,
          to: Array.isArray(recipientEmail) ? recipientEmail.join(', ') : recipientEmail,
          subject,
          html: `
               <div style="font-family: Arial, sans-serif; background-color: #f8f8f8; padding: 20px; text-align: center;">
  <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 10px; box-shadow: 2px 2px 10px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-top: 20px;">${mainHeading}</h2>
    <p style="color: #555;">${bodyMessage}</p>

    <div style="display: flex; justify-content: center; flex-wrap: wrap; margin-top: 20px;">
      <a href="tel:${payload.vendorPhone}" 
        style="display: inline-block; width: 45%; margin: 5px; text-align: center; padding: 10px 0; font-size: 16px; 
        color: #fff; background-color: #e63946; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Call Vendor
      </a>
      <a href="tel:${payload.customerPhone}" 
        style="display: inline-block; width: 45%; margin: 5px; text-align: center; padding: 10px 0; font-size: 16px; 
        color: #fff; background-color: #457b9d; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Call Customer
      </a>
    </div>
  </div>
</div>


                `
        })

      case 'verification':
        subject = 'Verify Your Email - Yum-Express'
        mainHeading = 'Email Verification'
        bodyMessage = `Hi ${firstName},<br><br>You're almost set to start enjoying <b>Yum-Express</b>. Simply click the button below to verify your email address and get started. The link expires in <b>48 hours</b>.`
        actionLink = `http://localhost:5000/api/${payload.entityType}/verify-email?token=${payload.token}`
        buttonText = 'Verify my email address'
        break

      case 'otp':
        subject = 'Your Yum-Express Verification Code'
        mainHeading = 'Email Verification Code'
        bodyMessage = `Hi ${firstName},<br><br>Your verification code is: <br><br>
      <div style="font-size: 24px; font-weight: bold; color: #e63946;">${payload.otp}</div>
      <br>This code will expire in <b>${payload.expiresIn || 10} minutes</b>.`
        actionLink = ''
        buttonText = ''
        break

      case 'support':
        subject = 'Support Request Received - Yum-Express'
        mainHeading = 'Support Request Received'
        bodyMessage = `Hi ${firstName},<br><br>We've received your support request and will get back to you shortly.<br><br><b>Message:</b><br>${payload.message}`
        actionLink = payload.supportTicketUrl || '#'
        buttonText = 'View Ticket'
        break

      case 'passwordReset':
        subject = 'Reset Your Password - Yum-Express'
        mainHeading = 'Reset Your Password'
        bodyMessage = `Hi ${firstName},<br><br>You requested to reset your password. Click the button below to continue. This link will expire in <b>1 hour</b>.`
        actionLink = `http://localhost:5000/reset-password?token=${payload.token}`
        buttonText = 'Reset Password'
        break

      default:
        throw new Error('Invalid email type')
    }

    const recipients = Array.isArray(recipientEmail) ? recipientEmail.join(', ') : recipientEmail

    const emailData = {
      from: `"Yum Express" <${senderEmail}>`,
      to: recipients,
      subject,
      html: `
    <div style="font-family: Arial, sans-serif; background-color: #f8f8f8; padding: 20px; text-align: center;">
      <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 10px; box-shadow: 2px 2px 10px rgba(0,0,0,0.1);">

        <h2 style="color: #333; margin-top: 20px;">${mainHeading}</h2>
        <p style="color: #555;">${bodyMessage}</p>

        ${
          actionLink && buttonText
            ? `
  <a href="${actionLink}" 
    style="display: inline-block; padding: 12px 20px; margin: 10px 0; font-size: 16px; 
    color: #fff; background-color: #e63946; text-decoration: none; border-radius: 5px; font-weight: bold;">
    ${buttonText}
  </a>
`
            : ''
        }


      </div>
    </div>
  `
    }
    await transporter.sendMail(emailData)
    logger.info(`${type} email sent to: ${recipientEmail}`)
  } catch (error) {
    logger.error(`Error sending ${type} email:`, error)
  }
}

module.exports = { sendEmail }
