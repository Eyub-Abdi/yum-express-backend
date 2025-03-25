const Brevo = require('@getbrevo/brevo')
const config = require('../../config/default')

// Initialize API client
const apiInstance = new Brevo.TransactionalEmailsApi()

// Ensure `apiClient` exists before setting authentication
if (apiInstance.apiClient && apiInstance.apiClient.authentications) {
  apiInstance.apiClient.authentications['api-key'].apiKey = config.brevo.apiKey
} else {
  console.error('Brevo API client not properly initialized')
}

// Email sending function
const sendVerificationEmail = async (recipientEmail, verificationToken) => {
  try {
    const senderEmail = config.email.user

    const emailData = {
      sender: { email: senderEmail },
      to: [{ email: recipientEmail }],
      subject: 'Verify Your Email Address',
      htmlContent: `<p>Click the link below to verify your email:</p>
                    <a href="http://localhost:5000/verify-email?token=${verificationToken}">
                    Verify Email</a>`,
      textContent: `Click the link below to verify your email: 
                    http://localhost:5000/verify-email?token=${verificationToken}`
    }

    const response = await apiInstance.sendTransacEmail(emailData)
    console.log('Verification email sent successfully:', response)
  } catch (error) {
    console.error('Error sending verification email:', error)
  }
}

module.exports = { sendVerificationEmail }
