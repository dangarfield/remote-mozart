
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
require('log-timestamp')

const app = express()
app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.json())

const PORT = process.env.PORT || 3000

require('./src/dao/mongodbutil').initialise(function () {
  console.log('Ready to start app')
  app.listen(PORT, async () => {
    console.log('listening on port', PORT)
    app.use(require('./src/routes/routes'))
    console.log('---------------------------')
    console.log('--- MOZART MASTER READY ---')
    console.log('---------------------------')
  })
})

// const express = require('express')
// const app = express()

// const config = {
//   MASTER_USERNAME: process.env.MASTER_USERNAME,
//   MASTER_PASSWORD: process.env.MASTER_PASSWORD
// }

// const validateEnvironmentVariables = async () => {
//   Object.keys(config).forEach(async function (key) {
//     var value = config[key]
//     console.log('Validating config', key, value)
//     if (value === undefined || value === null || value === '') {
//       console.error('ERROR - Config not set for key:', key)
//       process.exit(1)
//     }
//   })
// }

// const defineRoutes = async () => {
//   app.get('/', (req, res) => {
//     res.send('Hello World!')
//   })
// }
// const initServer = async () => {
//   let port = 3000
//   app.listen(port, () => {
//     console.log(`Mozart master started on ${port}!`)
//   })
// }

// const init = async () => {
//   await validateEnvironmentVariables()
//   await defineRoutes()
//   await initServer()
// }

// init()
