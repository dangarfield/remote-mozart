let deviceGroupsCollection = require('./mongodbutil').getDeviceGroupsCollection()

exports.getDeviceGroupById = async (id) => {
  let deviceGroup = await deviceGroupsCollection.findOne({_id: id})
  if (deviceGroup !== null) {
    deviceGroup.id = deviceGroup._id
    delete deviceGroup._id
  }
  return deviceGroup
}

exports.insertDeviceGroup = async (id) => {
  await deviceGroupsCollection.insertOne({_id: id})
}

exports.getAllDeviceGroupIds = async () => {
  let idList = await deviceGroupsCollection.find({}, {projection: {_id: 1}}).toArray()
  return idList.map(p => p._id)
}

exports.saveDeviceGroup = async (deviceGroup, keysToUnset) => {
  let _id = deviceGroup.id
  delete deviceGroup.id

  console.log('saveDeviceGroup', deviceGroup, keysToUnset)
  let update = {$set: deviceGroup}
  if(keysToUnset !== undefined) {
    unsetObj = {}
    for (let i = 0; i < keysToUnset.length; i++) {
      const key = keysToUnset[i];
      unsetObj[key] = ''
    }
    update.$unset = unsetObj
  }

  await deviceGroupsCollection.updateOne({_id: _id}, update)
}
