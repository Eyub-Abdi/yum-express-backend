const express = require('express')
const debug = require('debug')('app')
const config = require('../config/default')
const db = require('./db/knex')
const app = express()
const customerRoutes = require('./routes/customerRoutes')
const vendoRoutes = require('./routes/vendorRoutes')
const authRoutes = require('./routes/authRoutes')

if (!config.jwt.secret) {
  debug('FATAL ERROR, JWT_SECRET IS NOT SET')
  process.exit(1)
} else debug('JWT_SECRET IS NOW SET')

debug(config.db.database)
debug(config.email.user)
debug(config.email.pass)

app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/vendors', vendoRoutes)

app.get('/', (req, res) => res.send('Home'))

const port = process.env.PORT || 5000
app.listen(port, () => debug(`Listening on port ${port}...`))
