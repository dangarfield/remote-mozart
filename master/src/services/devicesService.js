let devicesDAO = require('../dao/devicesDAO')
let deviceGroupsDAO = require('../dao/deviceGroupsDAO')

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
exports.checkIn = async (deviceId, deviceGroupId) => {
  console.log('checkIn', deviceId, deviceGroupId)

  // Get device groups
  let deviceGroup = await checkInAndGetDeviceGroup(deviceGroupId)
  console.log('deviceGroup', deviceGroup)

  // Get device
  let device = await checkInAndGetDevice(deviceId, deviceGroupId)
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

const checkInAndGetDevice = async (deviceId, deviceGroupId) => {
  let device = await devicesDAO.getDeviceById(deviceId)
  if (device == null) {
    await devicesDAO.insertDevice(deviceId, deviceGroupId)
    device = await devicesDAO.getDeviceById(deviceId)
  } else {
    await devicesDAO.updateCheckIn(deviceId)
    device = await devicesDAO.getDeviceById(deviceId)
  }

  return device
}
