function envBoolean(name, defaultValue = false) {
  return (process.env[name] || String(defaultValue)).toLowerCase() === 'true'
}

module.exports = { envBoolean }
