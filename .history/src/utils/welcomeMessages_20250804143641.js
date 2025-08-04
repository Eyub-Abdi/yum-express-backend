function buildWelcomeMessage(name, accountType, password) {
  return `Hi ${name?.toUpperCase()}, your ${accountType} account has been created. Login password: ${password}\nPlease change it after first login.`
}

module.exports = { buildWelcomeMessage }
