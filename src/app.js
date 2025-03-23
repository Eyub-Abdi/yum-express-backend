const express = require('express')
const debug = require('debug')('app')
const config = require('config')
const db = require('./db/knex')
const app = express()
const customerRoutes = require('./routes/customerRoutes')

app.use(express.json())
app.use('/api/customers', customerRoutes)

app.get('/', (req, res) => res.send('Home'))
debug(config.get('db.password'))

const port = process.env.PORT || 5000
app.listen(port, () => debug(`Listening on port ${port}...`))
