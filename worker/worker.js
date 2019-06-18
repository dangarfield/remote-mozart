const fs = require('fs')
const path = require('path')
const PropertiesReader = require('properties-reader')
const axios = require('axios')
const extract = require('extract-zip')


const PERSISTED_CONFIG_FILE = '/.mozart/.deploy_version'
const JOB_DIRECTORY = '/.mozart/jobs'
const EVENT_FILE = '/.mozart/mozart_event.txt'

const config = {
  DEVICE_GROUP: process.env.DEVICE_GROUP,
  DEVICE_NAME: process.env.DEVICE_NAME,
  MASTER_URL: process.env.MASTER_URL,
  MASTER_USERNAME: process.env.MASTER_USERNAME,
  MASTER_PASSWORD: process.env.MASTER_PASSWORD
}
let persistedConfig = {
  DEPLOYED_VERSION: 0,
  OVERRIDE_VERSION: 0
}

const validateConfig = async () => {
  Object.keys(config).forEach(async function (key) {
    var value = config[key]
    console.log('Validating config', key, value)
    if (value === undefined || value === null || value === '') {
      console.error('ERROR - Config not set for key:', key)
      process.exit(1)
    }
  })
  if(!fs.existsSync(PERSISTED_CONFIG_FILE)) {
    await savePersistedConfig()
  } else {
    let persistedConfigReader = PropertiesReader(PERSISTED_CONFIG_FILE)
    let persistedDeployedVersion = persistedConfigReader.get('DEPLOYED_VERSION')
    if(persistedDeployedVersion !== null) {
      persistedConfig.DEPLOYED_VERSION = persistedDeployedVersion
    }
    let persistedOverrideVersion = persistedConfigReader.get('OVERRIDE_VERSION')
    if(persistedOverrideVersion !== null) {
      persistedConfig.OVERRIDE_VERSION = persistedOverrideVersion
    }
  }
  console.log('Validating persisted config', 'DEPLOYED_VERSION', persistedConfig.DEPLOYED_VERSION)
  console.log('Validating persisted config', 'OVERRIDE_VERSION', persistedConfig.OVERRIDE_VERSION)
}

const savePersistedConfig = async () => {
  let configToBeSaved = ''
  configToBeSaved = configToBeSaved + 'DEPLOYED_VERSION='+persistedConfig.DEPLOYED_VERSION+'\n'
  configToBeSaved = configToBeSaved + 'OVERRIDE_VERSION='+persistedConfig.OVERRIDE_VERSION
  fs.writeFileSync(PERSISTED_CONFIG_FILE, configToBeSaved)
}

const setDeployedVersion = async (newVersion) => {
  persistedConfig.DEPLOYED_VERSION = newVersion
  await savePersistedConfig()
}
const setOverrideVersion = async (newVersion) => {
  persistedConfig.DEPLOYED_VERSION = newVersion
  await savePersistedConfig()
}
const keepAliveTimer = async () => {
  let i = 0
  setInterval(async () => {
    console.log('Keep alive', ++i)
    await checkInWithServer()
  }, 1000 * 60)
}
const downloadRequired = async (deployedVersion, deviceGroup) => {
  let required = deviceGroup.deployed === undefined || deviceGroup.deployed.version === undefined || deviceGroup.deployed.version !== deployedVersion
  console.log('downloadRequired', deployedVersion, deviceGroup, required)
  return required
}

const createJobDirectory = async (version) => {
  let jobDirectory = path.join(JOB_DIRECTORY, version.toString())
  if(!fs.existsSync(jobDirectory)) {
    fs.mkdirSync(jobDirectory)
  }
  return jobDirectory
}
const downloadJobFiles = async (jobDirectory, zipPath, deviceGroupId) => {
  const url = config.MASTER_URL + '/api/device-groups/'+deviceGroupId+'/download'
  console.log('downloadJobFiles', deviceGroupId, url)

  const zipWriter = fs.createWriteStream(zipPath)
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  })
  response.data.pipe(zipWriter)
  return new Promise((resolve, reject) => {
    zipWriter.on('finish', resolve)
    zipWriter.on('error', reject)
  })

}
const unzipJobFiles = async (jobDirectory, zipPath) => {
  console.log('unzipJobFiles', jobDirectory, zipPath)
  return new Promise((resolve, reject) => {
    extract(zipPath, {dir: jobDirectory}, function (err) {
      if(err) {
        console.log('error unzipping',err)
        resolve()
      } else {
        console.log('unzip complete')
        fs.unlinkSync(zipPath)
        resolve()
      }
     })
  })

}
const triggerDeployEvent = async (version) => {
  let eventData = 'deploy\n'+version
  console.log('triggerDeployEvent', eventData)
  fs.writeFileSync(EVENT_FILE, eventData)
}
const updateVersions = async (version, overrideVersion) => {
  persistedConfig.DEPLOYED_VERSION = version
  persistedConfig.OVERRIDE_VERSION = overrideVersion
  await savePersistedConfig()
}
const checkInWithServer = async () => {
  console.log('checkInWithServer')
  try {
    let checkInData = {
      id: config.DEVICE_NAME,
      deviceGroup: config.DEVICE_GROUP,
      version: persistedConfig.DEPLOYED_VERSION,
      overrideVersion: persistedConfig.OVERRIDE_VERSION
    }
    console.log('checkInData', checkInData)
    let response = await axios.post(config.MASTER_URL + '/api/check-in', checkInData)
    let data = response.data
    console.log('data', data)

    if(!await downloadRequired(checkInData.version, data.deviceGroup)) {
      console.log('Download not required - Deployed version is the latest')
      return
    }
    let deployData = data.deviceGroup.deployed
    let jobDirectory = await createJobDirectory(deployData.version)
    const zipPath = path.join(jobDirectory, 'files.zip')
    await downloadJobFiles(jobDirectory, zipPath, data.deviceGroup.id)
    await unzipJobFiles(jobDirectory, zipPath)
    await triggerDeployEvent(deployData.version)
    await updateVersions(deployData.version, deployData.overrideVersion)
    await checkInWithServer()
  } catch (error) {
    console.error('checkInWithServer ERROR', error)
  }
}
const init = async () => {
  await validateConfig()
  await keepAliveTimer()
  await checkInWithServer()
}

init()
