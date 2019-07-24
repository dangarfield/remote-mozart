const devicesService = require('../services/devicesService')
const documentsService = require('../services/documentsService')
const humanizeDuration = require('humanize-duration')
// const roundTo = require('round-to')

exports.homePage = async (req, res) => {
  res.redirect('/device-groups')
}
exports.viewAllDeviceGroups = async (req, res) => {
  console.log('GET /device-group')

  let deviceGroupIds = await devicesService.getAllDeviceGroups()
  let deviceGroups = await getDeviceGroupsDTO(deviceGroupIds)
  console.log('deviceGroupIds', deviceGroupIds)
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
  let devicesRaw = await devicesService.getAllDevicesForDeviceGroup(id)
  let devices = await getDevicesDTO(devicesRaw, deviceGroup)
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
exports.deleteStagedConfig = async (req, res) => {
  let id = req.params.id
  console.log('POST /device-groups/:id/delete-staged', id)
  let deployResult = await devicesService.deleteStagedConfig(id)
  res.json(deployResult)
}
exports.downloadLatestFiles = async (req, res) => {
  let deviceGroupId = req.params.deviceGroupId
  let deviceId = req.params.deviceId
  console.log('POST /device-groups/:deviceGroupId/devices/:deviceId/download', deviceGroupId, deviceId)

  let deployResult = await documentsService.zipAllFilesForDeployment(deviceGroupId, deviceId, res)

  console.log('deployResult', deployResult)
}

exports.editDevice = async (req, res) => {
  let deviceGroupId = req.params.deviceGroupId
  let deviceId = req.params.deviceId
  console.log('GET /device-groups/:deviceGroupId/devices/:deviceId/edit', deviceGroupId, deviceId)

  let deviceGroup = await getDeviceGroupDTO(deviceGroupId)
  console.log('deviceGroup', deviceGroup)
  let device = await devicesService.getDevice(deviceId)
  console.log('device', device)
  res.render('device-edit', {
    title: 'Device Edit',
    nav: await getNavDTO(device.deviceGroup),
    device: device,
    deviceGroup: deviceGroup
  })
}
exports.saveDeviceConfig = async (req, res) => {
  let deviceGroupId = req.params.deviceGroupId
  let deviceId = req.params.deviceId
  console.log('POST /device-groups/:deviceGroupId/devices/:deviceId/edit', deviceGroupId, deviceId)

  let deviceConfig = req.body
  console.log('deviceConfig', deviceConfig)

  // TODO Validate stagedConfig

  await devicesService.saveDeviceConfig(deviceId, deviceConfig.envs)

  let device = await devicesService.getDevice(deviceId)
  console.log('device', device)
  res.json({deviceConfig: deviceConfig, device: device})
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

const getDeviceDTO = async (device, deviceGroup) => {
  if (device.envs === undefined) {
    device.envs = []
  }
  if (device.version === undefined) {
    device.version = 0
  }
  if (device.deployedVersion === undefined) {
    device.deployedVersion = 0
  }
  if (device.deployedOverrideVersion === undefined) {
    device.deployedOverrideVersion = 0
  }

  let lastCheckInDiff = new Date() - device.lastCheckIn
  device.lastCheckInHuman = humanizeDuration(lastCheckInDiff, { largest: 1, round: true })

  // Check in status
  switch (true) {
    case (lastCheckInDiff < (3 * 60 * 1000)): // 3 minutes
      device.lastCheckInStatus = 'good'
      break
    case (lastCheckInDiff < (60 * 60 * 1000)): // 1 hour
      device.lastCheckInStatus = 'ok'
      break
    default:
      device.lastCheckInStatus = 'bad'
      break
  }

  // Deployed version
  console.log('deployedVersionStatus', deviceGroup.deployed.version, device.deployedVersion)
  if (deviceGroup.deployed === undefined || deviceGroup.deployed.version === undefined) {
    device.deployedVersionStatus = 'good'
  } else {
    device.deployedVersionStatus = deviceGroup.deployed.version === device.deployedVersion ? 'good' : 'bad'
  }

  // Deployed override version
  console.log('deployedOverrideVersionStatus', device.version, device.deployedOverrideVersion)
  if (device.version === undefined) {
    device.deployedOverrideVersionStatus = 'good'
  } else {
    device.deployedOverrideVersionStatus = device.version === device.deployedOverrideVersion ? 'good' : 'bad'
  }

  return device
}
const getDevicesDTO = async (deviceModels, deviceGroup) => {
  let devices = []
  for (let i = 0; i < deviceModels.length; i++) {
    const deviceModel = deviceModels[i]
    devices.push(await getDeviceDTO(deviceModel, deviceGroup))
  }
  return devices
}
const getDeviceGroupsDTO = async (deviceGroupIds) => {
  let deviceGroups = []
  for (let i = 0; i < deviceGroupIds.length; i++) {
    const deviceGroupId = deviceGroupIds[i]
    let deviceGroup = {
      id: deviceGroupId,
      count: await devicesService.getDeviceCountForDeviceGroup(deviceGroupId)
    }
    deviceGroups.push(deviceGroup)
  }
  return deviceGroups
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
