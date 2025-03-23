const express = require('express')
const debug = require('debug')('app')
const config = require('config')
const app = express()

app.use(express.json())
app.get('/', (req, res) => res.send('Home'))

debug(config.get('db.password'))

const port = process.env.PORT || 5000
app.listen(port, () => debug(`Listening on port ${port}...`))
