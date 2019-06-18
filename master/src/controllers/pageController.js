const devicesService = require('../services/devicesService')
const documentsService = require('../services/documentsService')


exports.homePage = async (req, res) => {
  res.redirect('/device-group')
}
exports.viewAllDeviceGroups = async (req, res) => {
  console.log('GET /device-group')

  let deviceGroups = await devicesService.getAllDeviceGroups()
  console.log('deviceGroups', deviceGroups)
  res.render('device-group-list', {
    title: 'Device Groups',
    nav: await getNavDTO(null),
    deviceGroups: deviceGroups
  })
}
exports.viewDeviceGroup = async (req, res) => {
  let id = req.params.id
  console.log('GET /device-group/:id', id)

  let deviceGroup = await devicesService.getDeviceGroup(id)
  let devices = await devicesService.getAllDevicesForDeviceGroup(id)
  console.log('deviceGroups', deviceGroup)
  console.log('devices', devices)
  res.render('device-group', {
    title: 'Device Groups',
    nav: await getNavDTO(deviceGroup.id),
    deviceGroup: deviceGroup,
    devices: devices
  })
}
exports.editDeviceGroup = async (req, res) => {
  let id = req.params.id
  console.log('GET /device-group/:id/edit', id)

  let deviceGroup = await getDeviceGroupDTO(id)
  console.log('deviceGroup', deviceGroup)
  res.render('device-group-edit', {
    title: 'Device Groups',
    nav: await getNavDTO(deviceGroup.id),
    deviceGroup: deviceGroup
  })
}

exports.saveStagedDeviceGroupConfig = async (req, res) => {
  let id = req.params.id
  console.log('POST /device-group/:id/edit', id)

  let stagedConfig = req.body
  console.log('stagedConfig', stagedConfig)

  // TODO Validate stagedConfig

  await devicesService.saveStagedDeviceGroupConfig(id, stagedConfig.run, stagedConfig.stop, stagedConfig.envs, stagedConfig.files)

  let deviceGroup = await getDeviceGroupDTO(id)
  console.log('deviceGroup', deviceGroup)
  res.json({stagedConfig: stagedConfig, deviceGroup: deviceGroup})
}
exports.deployStagedDeviceConfig = async (req, res) => {
  let id = req.params.id
  console.log('POST /device-group/:id/deploy', id)
  let deployResult = await devicesService.deployStagedDeviceConfig(id)
  res.json(deployResult)
}
exports.copyDeviceConfigFromDeployedToStaged = async (req, res) => {
  let id = req.params.id
  console.log('POST /device-group/:id/copy', id)
  let deployResult = await devicesService.copyDeviceConfigFromDeployedToStaged(id)
  res.json(deployResult)
}
exports.downloadLatestFiles = async (req, res) => {
  let id = req.params.id
  console.log('POST /device-group/:id/download', id)
  let deployResult = await documentsService.zipAllFilesForDeployment(id, res)
}



const getNavDTO = async (id) => {
  let navItems = []
  let deviceGroups = await devicesService.getAllDeviceGroups()
  for (let i = 0; i < deviceGroups.length; i++) {
    const deviceGroup = deviceGroups[i]
    const active = deviceGroup === id
    navItems.push({name: deviceGroup, active: active})
  }
  return navItems
}

const getDeviceGroupDTO = async (id) => {
  let deviceGroup = await devicesService.getDeviceGroup(id)
  if (deviceGroup.deployed === undefined) {
    deviceGroup.deployed = {}
  }
  if (deviceGroup.deployed.version === undefined) {
    deviceGroup.deployed.version = 0
  }
  if (deviceGroup.deployed.envs === undefined) {
    deviceGroup.deployed.envs = []
  }
  if (deviceGroup.deployed.run === undefined) {
    deviceGroup.deployed.run = ''
  } else {
    deviceGroup.deployed.run = (await documentsService.getDocumentById(deviceGroup.deployed.run)).content
  }
  if (deviceGroup.deployed.stop === undefined) {
    deviceGroup.deployed.stop = ''
  } else {
    deviceGroup.deployed.stop = (await documentsService.getDocumentById(deviceGroup.deployed.stop)).content
  }
  if (deviceGroup.deployed.files === undefined) {
    deviceGroup.deployed.files = []
  } else {
    let files = []
    for (let i = 0; i < deviceGroup.deployed.files.length; i++) {
      const fileId = deviceGroup.deployed.files[i]
      let file = await documentsService.getDocumentById(fileId)
      files.push(file)
    }
    deviceGroup.deployed.files = files
  }

  if (deviceGroup.staged === undefined) {
    deviceGroup.staged = {}
  }
  if (deviceGroup.staged.envs === undefined) {
    deviceGroup.staged.envs = []
  }
  if (deviceGroup.staged.run === undefined) {
    deviceGroup.staged.run = ''
  } else {
    deviceGroup.staged.run = (await documentsService.getDocumentById(deviceGroup.staged.run)).content
  }
  if (deviceGroup.staged.stop === undefined) {
    deviceGroup.staged.stop = ''
  } else {
    deviceGroup.staged.stop = (await documentsService.getDocumentById(deviceGroup.staged.stop)).content
  }
  if (deviceGroup.staged.files === undefined) {
    deviceGroup.staged.files = []
  } else {
    let files = []
    for (let i = 0; i < deviceGroup.staged.files.length; i++) {
      const fileId = deviceGroup.staged.files[i]
      let file = await documentsService.getDocumentById(fileId)
      files.push(file)
    }
    deviceGroup.staged.files = files
  }

  return deviceGroup
}
