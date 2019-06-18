let devicesCollection = require('./mongodbutil').getDevicesCollection()

exports.getDeviceById = async (id) => {
  let device = await devicesCollection.findOne({_id: id})
  if (device !== null) {
    device.id = device._id
    delete device._id
  }
  return device
}

exports.insertDevice = async (id, deviceGroupId, deployedVersion) => {
  await devicesCollection.insertOne({_id: id, deviceGroup: deviceGroupId, deployedVersion: deployedVersion, lastCheckIn: new Date()})
}

exports.updateCheckIn = async (id, deployedVersion) => {
  return devicesCollection.updateOne({_id: id}, {$set: {deployedVersion: deployedVersion, lastCheckIn: new Date()}})
}

exports.getAllDevices = async () => {
  let devices = []
  await devicesCollection.find({}, {projection: {_id: 1, deviceGroup: 1, lastCheckIn: 1}}).forEach(function (device) {
    device.id = device._id
    delete device._id
    devices.push(device)
  })
  return devices
}
exports.getAllDevicesForDeviceGroup = async (deviceGroup) => {
  let devices = []
  await devicesCollection.find({deviceGroup: deviceGroup}, {projection: {_id: 1, deviceGroup: 1, lastCheckIn: 1, deployedVersion: 1}}).forEach(function (device) {
    device.id = device._id
    delete device._id
    devices.push(device)
  })
  return devices
}
