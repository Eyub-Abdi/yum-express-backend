// function buildWelcomeMessage(first_name, defaultPassword) {
//   return `Hi ${first_name},

// Welcome to our platform! Your account has been created successfully.

// Your default login password is: ${defaultPassword}
// You can log in using your email address and the password provided above. Please make sure to change your password after your first login for security purposes.

// Thank you!`
// }

function buildWelcomeMessage(name, accountType, password) {
  return `Hi ${name}, your ${accountType} account has been created.\nLogin password: ${password}\nPlease change it after first login.`
}

module.exports = { buildWelcomeMessage }
