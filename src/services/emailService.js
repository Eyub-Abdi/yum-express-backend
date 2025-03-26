const nodemailer = require('nodemailer')
const config = require('../../config/default')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.email.user,
    pass: config.email.pass
  }
})

const sendVerificationEmail = async (recipientEmail, firstName, verificationToken) => {
  try {
    const senderEmail = config.email.user
    const verificationLink = `http://localhost:5000/verify-email?token=${verificationToken}`

    const emailData = {
      from: senderEmail,
      to: recipientEmail,
      subject: 'Verify Your Email - Yum-Express',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f8f8f8; padding: 20px; text-align: center;">
          <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 10px; box-shadow: 2px 2px 10px rgba(0,0,0,0.1);">
            
            <!-- Logo -->
            <div style="margin-bottom: 20px;">
              <img src="https://your-logo-url.com/logo.png" alt="Yum-Express" style="max-width: 100px;">
            </div>

            <!-- Header -->
            <div style="background: #e63946; padding: 20px; border-radius: 5px;">
              <img src="https://previews.dropbox.com/p/thumb/ACm_5CMfxpH5AST5s_GU5XIR6KQmiAUu4s9rQEr3TBn64TGNBwRhqwDpolYhLr5zfom12nfeWJ9a11mOI7T7fulkZZdvAEUQHIx44v2EKOoHa2l37bojY2TKeH5zmNmGiRx-gzaWTf2-Yb2NDUDejJaXY7Yw_S5xiCqkWVamFj7HSki8rKMUUdkOQCWjTFVHlEyXlNfYsXlIM7FqNikjCeCV4Px2kNDuI6gITkCk1Dgi-4GKJ9-DMyxWfjJBlfQ-DAHZJM5jpDMHG_5E9D8EPbazP7yUW1BxYkmmY2AOfl_Ihzxsv_8pHrh3E_F_FCTru7fDTxbrByeT7xANJK1ETpOO/p.png?is_prewarmed=true" alt="Email Verification" style="max-width: 50px;">
            </div>

            <!-- Main Content -->
            <h2 style="color: #333; margin-top: 20px;">Email Verification</h2>
            <p style="color: #555;">Hi ${firstName},</p>
            <p style="color: #555;">
              You're almost set to start enjoying <b>Yum-Express</b>. Simply click the button below to verify your email address and get started. 
              The link expires in <b>48 hours</b>.
            </p>

            <!-- Verify Button -->
            <a href="http://localhost:5000/api/vendors/verify-email?token=${verificationToken}" 
            style="display: inline-block; padding: 12px 20px; margin: 10px 0; font-size: 16px; 
            color: #fff; background-color: #e63946; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Verify my email address
            </a>


            <hr style="margin-top: 20px;">

            <!-- Footer -->
            <p style="color: #777; font-size: 14px;">
              800 Broadway Suite 1500, New York, NY 000423, USA
            </p>
            <p style="font-size: 12px;">
              <a href="#" style="color: #777; text-decoration: none;">Privacy Policy</a> | 
              <a href="#" style="color: #777; text-decoration: none;">Contact Details</a>
            </p>
            
            <!-- Social Media Icons -->
            <div style="margin-top: 10px;">
              <a href="#"><img src="https://your-icon-url.com/facebook.png" style="width: 25px; margin: 0 5px;"></a>
              <a href="#"><img src="https://your-icon-url.com/snapchat.png" style="width: 25px; margin: 0 5px;"></a>
              <a href="#"><img src="https://your-icon-url.com/linkedin.png" style="width: 25px; margin: 0 5px;"></a>
              <a href="#"><img src="https://your-icon-url.com/instagram.png" style="width: 25px; margin: 0 5px;"></a>
            </div>
          </div>
        </div>
      `
    }

    await transporter.sendMail(emailData)
    console.log(`Verification email sent to: ${recipientEmail}`)
  } catch (error) {
    console.error('Error sending verification email:', error)
  }
}

module.exports = { sendVerificationEmail }
