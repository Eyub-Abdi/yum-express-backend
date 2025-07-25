function buildWelcomeMessage(first_name, defaultPassword) {
  return `Hi ${first_name},

Welcome to our platform! Your account has been created successfully.

Your default login password is: ${defaultPassword}
You can log in using your email address and the password provided above. Please make sure to change your password after your first login for security purposes.

Thank you!`
}

module.exports = { buildWelcomeMessage }
