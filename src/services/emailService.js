const brevo = require('@getbrevo/brevo')
const config = require('../../config/default')

const apiInstance = new brevo.TransactionalEmailsApi()
let apiKey = apiInstance.setDefaultAuthentication('apiKey')
apiKey = config.brevo.apiKey
