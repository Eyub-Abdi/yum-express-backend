function buildWelcomeMessage(first_name, defaultPassword) {
  return `Hi ${first_name},

Welcome to our platform! Your account has been created successfully.

Your default login password is: ${defaultPassword}

You can log in here: https://yum-express.com/vendors/login

Please do NOT share this password with anyone. For your security, log in as soon as possible and change your password.

Thank you!`
}

module.exports = { buildWelcomeMessage }
