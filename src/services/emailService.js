const nodemailer = require('nodemailer')
const config = require('../../config/default')

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: parseInt(config.email.port || '465', 10),
  secure: config.email.secure, // true for port 465
  auth: {
    user: config.email.user,
    pass: config.email.pass
  }
})

// const sendEmail = async (recipientEmail, firstName, type, payload = {}) => {
//   try {
//     const senderEmail = config.email.user

//     let subject = ''
//     let mainHeading = ''
//     let bodyMessage = ''
//     let actionLink = ''
//     let buttonText = ''

//     switch (type) {
//       case 'verification':
//         subject = 'Verify Your Email - Yum-Express'
//         mainHeading = 'Email Verification'
//         bodyMessage = `Hi ${firstName},<br><br>You're almost set to start enjoying <b>Yum-Express</b>. Simply click the button below to verify your email address and get started. The link expires in <b>48 hours</b>.`
//         actionLink = `http://localhost:5000/api/${payload.entityType}/verify-email?token=${payload.token}`
//         buttonText = 'Verify my email address'
//         break

//       case 'support':
//         subject = 'Support Request Received - Yum-Express'
//         mainHeading = 'Support Request Received'
//         bodyMessage = `Hi ${firstName},<br><br>We've received your support request and will get back to you shortly. Thank you for reaching out!<br><br><b>Message:</b><br>${payload.message}`
//         actionLink = payload.supportTicketUrl || '#'
//         buttonText = 'View Ticket'
//         break

//       case 'passwordReset':
//         subject = 'Reset Your Password - Yum-Express'
//         mainHeading = 'Reset Your Password'
//         bodyMessage = `Hi ${firstName},<br><br>You requested to reset your password. Click the button below to continue. This link will expire in <b>1 hour</b>.`
//         actionLink = `http://localhost:5000/reset-password?token=${payload.token}`
//         buttonText = 'Reset Password'
//         break

//       default:
//         throw new Error('Invalid email type')
//     }

//     const emailData = {
//       from: senderEmail,
//       to: recipientEmail,
//       subject,
//       html: `
//         <div style="font-family: Arial, sans-serif; background-color: #f8f8f8; padding: 20px; text-align: center;">
//           <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 10px; box-shadow: 2px 2px 10px rgba(0,0,0,0.1);">

//             <div style="margin-bottom: 20px;">
//               <img src="https://your-logo-url.com/logo.png" alt="Yum-Express" style="max-width: 100px;">
//             </div>

//             <div style="background: #e63946; padding: 20px; border-radius: 5px;">
//               <img src="https://your-icon-url.com/icon.png" alt="${type}" style="max-width: 50px;">
//             </div>

//             <h2 style="color: #333; margin-top: 20px;">${mainHeading}</h2>
//             <p style="color: #555;">${bodyMessage}</p>

//             <a href="${actionLink}"
//               style="display: inline-block; padding: 12px 20px; margin: 10px 0; font-size: 16px;
//               color: #fff; background-color: #e63946; text-decoration: none; border-radius: 5px; font-weight: bold;">
//               ${buttonText}
//             </a>

//             <hr style="margin-top: 20px;">

//             <p style="color: #777; font-size: 14px;">800 Broadway Suite 1500, New York, NY 000423, USA</p>
//             <p style="font-size: 12px;">
//               <a href="#" style="color: #777; text-decoration: none;">Privacy Policy</a> |
//               <a href="#" style="color: #777; text-decoration: none;">Contact Details</a>
//             </p>

//             <div style="margin-top: 10px;">
//               <a href="#"><img src="https://your-icon-url.com/facebook.png" style="width: 25px; margin: 0 5px;"></a>
//               <a href="#"><img src="https://your-icon-url.com/snapchat.png" style="width: 25px; margin: 0 5px;"></a>
//               <a href="#"><img src="https://your-icon-url.com/linkedin.png" style="width: 25px; margin: 0 5px;"></a>
//               <a href="#"><img src="https://your-icon-url.com/instagram.png" style="width: 25px; margin: 0 5px;"></a>
//             </div>
//           </div>
//         </div>
//       `
//     }

//     await transporter.sendMail(emailData)
//     console.log(`${type} email sent to: ${recipientEmail}`)
//   } catch (error) {
//     console.error(`Error sending ${type} email:`, error)
//   }
// }

// module.exports = { sendEmail }

const sendEmail = async ({ recipientEmail, firstName, type, payload = {} }) => {
  try {
    const senderEmail = config.email.user

    let subject = ''
    let mainHeading = ''
    let bodyMessage = ''
    let actionLink = ''
    let buttonText = ''

    switch (type) {
      case 'verification':
        subject = 'Verify Your Email - Yum-Express'
        mainHeading = 'Email Verification'
        bodyMessage = `Hi ${firstName},<br><br>You're almost set to start enjoying <b>Yum-Express</b>. Simply click the button below to verify your email address and get started. The link expires in <b>48 hours</b>.`
        actionLink = `http://localhost:5000/api/${payload.entityType}/verify-email?token=${payload.token}`
        buttonText = 'Verify my email address'
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

    const emailData = {
      from: senderEmail,
      to: recipientEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f8f8f8; padding: 20px; text-align: center;">
          <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 10px; box-shadow: 2px 2px 10px rgba(0,0,0,0.1);">

            <h2 style="color: #333; margin-top: 20px;">${mainHeading}</h2>
            <p style="color: #555;">${bodyMessage}</p>

            <a href="${actionLink}" 
              style="display: inline-block; padding: 12px 20px; margin: 10px 0; font-size: 16px; 
              color: #fff; background-color: #e63946; text-decoration: none; border-radius: 5px; font-weight: bold;">
              ${buttonText}
            </a>

          </div>
        </div>
      `
    }

    await transporter.sendMail(emailData)
    console.log(`${type} email sent to: ${recipientEmail}`)
  } catch (error) {
    console.error(`Error sending ${type} email:`, error)
  }
}

module.exports = { sendEmail }
