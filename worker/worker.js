const config = {
  DEVICE_GROUP: process.env.DEVICE_GROUP,
  DEVICE_NAME: process.env.DEVICE_NAME,
  MASTER_URL: process.env.MASTER_URL,
  MASTER_USERNAME: process.env.MASTER_USERNAME,
  MASTER_PASSWORD: process.env.MASTER_PASSWORD
}

const validateEnvironmentVariables = async () => {
  Object.keys(config).forEach(async function (key) {
    var value = config[key]
    console.log('Validating config', key, value)
    if (value === undefined || value === null || value === '') {
      console.error('ERROR - Config not set for key:', key)
      process.exit(1)
    }
  })
}

const keepAliveTimer = async () => {
  let i = 0
  setInterval(() => {
    console.log('Keep alive', ++i)
  }, 1000 * 60)
}

const init = async () => {
  await validateEnvironmentVariables()
  await keepAliveTimer()
}

init()
