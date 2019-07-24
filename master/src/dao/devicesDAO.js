let devicesCollection = require('./mongodbutil').getDevicesCollection()

exports.getDeviceById = async (id) => {
  let device = await devicesCollection.findOne({_id: id})
  if (device !== null) {
    device.id = device._id
    delete device._id
  }
  return device
}

exports.insertDevice = async (id, deviceGroupId, deployedVersion, deployedOverrideVersion) => {
  await devicesCollection.insertOne({_id: id, deviceGroup: deviceGroupId, deployedVersion: deployedVersion, deployedOverrideVersion: deployedOverrideVersion, lastCheckIn: new Date()})
}

exports.updateCheckIn = async (id, deployedVersion, deployedOverrideVersion) => {
  return devicesCollection.updateOne({_id: id}, {$set: {deployedVersion: deployedVersion, deployedOverrideVersion: deployedOverrideVersion, lastCheckIn: new Date()}})
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
  await devicesCollection.find({deviceGroup: deviceGroup}).forEach(function (device) {
    device.id = device._id
    delete device._id
    devices.push(device)
  })
  return devices
}

exports.saveDevice = async (device, keysToUnset) => {
  let _id = device.id
  delete device.id

  console.log('saveDevice', device, keysToUnset)
  let update = {$set: device}
  if(keysToUnset !== undefined) {
    unsetObj = {}
    for (let i = 0; i < keysToUnset.length; i++) {
      const key = keysToUnset[i];
      unsetObj[key] = ''
    }
    update.$unset = unsetObj
  }

  await devicesCollection.updateOne({_id: _id}, update)
}

exports.getDeviceCountForDeviceGroup = async (deviceGroupId) => {
  return devicesCollection.count({deviceGroup: deviceGroupId})
}