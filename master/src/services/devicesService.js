const devicesDAO = require('../dao/devicesDAO')
const deviceGroupsDAO = require('../dao/deviceGroupsDAO')
const documentsService = require('./documentsService')
const _ = require('lodash')

exports.getAllDeviceGroups = async () => {
  return deviceGroupsDAO.getAllDeviceGroupIds()
}
exports.getDeviceGroup = async (id) => {
  return deviceGroupsDAO.getDeviceGroupById(id)
}
exports.getAllDevices = async () => {
  return devicesDAO.getAllDevices()
}
exports.getAllDevicesForDeviceGroup = async (group) => {
  return devicesDAO.getAllDevicesForDeviceGroup(group)
}
exports.getDevice = async (id) => {
  return devicesDAO.getDeviceById(id)
}
exports.checkIn = async (deviceId, deviceGroupId, deployedVersion) => {
  console.log('checkIn', deviceId, deviceGroupId, deployedVersion)

  // Get device groups
  let deviceGroup = await checkInAndGetDeviceGroup(deviceGroupId)
  console.log('deviceGroup', deviceGroup)

  // Get device
  let device = await checkInAndGetDevice(deviceId, deviceGroupId, deployedVersion)
  console.log('device', device)
  return device
}

const checkInAndGetDeviceGroup = async (deviceGroupId) => {
  let deviceGroup = await deviceGroupsDAO.getDeviceGroupById(deviceGroupId)
  if (deviceGroup == null) {
    await deviceGroupsDAO.insertDeviceGroup(deviceGroupId)
    deviceGroup = await deviceGroupsDAO.getDeviceGroupById(deviceGroupId)
  }
  return deviceGroup
}

const checkInAndGetDevice = async (deviceId, deviceGroupId, deployedVersion) => {
  let device = await devicesDAO.getDeviceById(deviceId)
  if (device == null) {
    await devicesDAO.insertDevice(deviceId, deviceGroupId, deployedVersion)
    device = await devicesDAO.getDeviceById(deviceId)
  } else {
    await devicesDAO.updateCheckIn(deviceId, deployedVersion)
    device = await devicesDAO.getDeviceById(deviceId)
  }

  return device
}

exports.saveStagedDeviceGroupConfig = async (id, run, stop, envs, files) => {
  console.log('saveDeviceGroupConfig', id, run, stop, envs, files)
  let deviceGroup = await deviceGroupsDAO.getDeviceGroupById(id)

  if (deviceGroup.staged === undefined) {
    deviceGroup.staged = {}
  }
  deviceGroup.staged.envs = envs

  if (deviceGroup.staged.run !== undefined) {
    await documentsService.deleteDocument(deviceGroup.staged.run)
  }
  let runId = await documentsService.insertDocument('run.sh', run)
  deviceGroup.staged.run = runId

  if (deviceGroup.staged.stop !== undefined) {
    await documentsService.deleteDocument(deviceGroup.staged.stop)
  }
  let stopId = await documentsService.insertDocument('stop.sh', stop)
  deviceGroup.staged.stop = stopId

  if (deviceGroup.staged.files === undefined) {
    deviceGroup.staged.files = []
  }
  for (let i = 0; i < deviceGroup.staged.files.length; i++) {
    const existingFileId = deviceGroup.staged.files[i]
    await documentsService.deleteDocument(existingFileId)
  }
  deviceGroup.staged.files = []
  for (let i = 0; i < files.length; i++) {
    const newFile = files[i]
    console.log('newFile', newFile)
    let newFileId = await documentsService.insertDocument(newFile.name, newFile.content)
    deviceGroup.staged.files.push(newFileId)
  }

  await deviceGroupsDAO.saveDeviceGroup(deviceGroup)
}

exports.deployStagedDeviceConfig = async (id) => {
  let deviceGroup = await deviceGroupsDAO.getDeviceGroupById(id)
  if (deviceGroup.staged === undefined) {
    return {error: true, errorMsg: 'No changes to deploy'}
  }
  console.log('deployStagedDeviceConfig', deviceGroup, deviceGroup.deployed)
  let newVersion
  if (deviceGroup.deployed === undefined) {
    newVersion = 1
    deviceGroup.deployed = {}
  } else {
    if(deviceGroup.deployed.version === undefined) {
      deviceGroup.deployed.version = 0
    }
    newVersion = deviceGroup.deployed.version + 1
  }
  if (deviceGroup.deployed.run !== undefined) {
    await documentsService.deleteDocument(deviceGroup.deployed.run)
  }
  if (deviceGroup.deployed.stop !== undefined) {
    await documentsService.deleteDocument(deviceGroup.deployed.stop)
  }
  if (deviceGroup.deployed.files !== undefined) {
    for (let i = 0; i < deviceGroup.deployed.files.length; i++) {
      const existingFileId = deviceGroup.deployed.files[i]
      await documentsService.deleteDocument(existingFileId)
    }
  }
  deviceGroup.deployed = _.cloneDeep(deviceGroup.staged)
  deviceGroup.deployed.version = newVersion
  delete deviceGroup.staged
  await deviceGroupsDAO.saveDeviceGroup(deviceGroup, ['staged'])
  return {success: true}
}
exports.copyDeviceConfigFromDeployedToStaged = async (id) => {
  let deviceGroup = await deviceGroupsDAO.getDeviceGroupById(id)
  if (deviceGroup.deployed === undefined) {
    return {error: true, errorMsg: 'No deployed config to copy'}
  }
  if (deviceGroup.staged !== undefined && deviceGroup.staged.files !== undefined) {
    for (let i = 0; i < deviceGroup.staged.files.length; i++) {
      const existingFileId = deviceGroup.staged.files[i]
      await documentsService.deleteDocument(existingFileId)
    }
  }

  deviceGroup.staged = _.cloneDeep(deviceGroup.deployed)
  delete deviceGroup.staged.version
  await deviceGroupsDAO.saveDeviceGroup(deviceGroup)
  return {success: true}
}