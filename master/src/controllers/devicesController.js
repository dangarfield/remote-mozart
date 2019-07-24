const devicesService = require('../services/devicesService')

// GET DEVICE GROUPS
exports.getAllDeviceGroups = async (req, res) => {
  console.log('GET /api/device-groups')
  res.json(await devicesService.getAllDeviceGroups())
}
exports.getDeviceGroup = async (req, res) => {
  let id = req.params.id
  console.log('GET /api/device-groups/:id', id)
  res.json(await devicesService.getDeviceGroup(id))
}

// DEVICE
exports.getAllDevices = async (req, res) => {
  console.log('GET /api/devices')
  res.json(await devicesService.getAllDevices())
}
exports.getAllDevicesForDeviceGroup = async (req, res) => {
  let group = req.params.group
  console.log('GET /api/devices/:group', group)
  res.json(await devicesService.getAllDevicesForDeviceGroup(group))
}
exports.getDevice = async (req, res) => {
  let group = req.params.group
  let id = req.params.id
  console.log('GET /api/devices/:group/:id', group, id)
  res.json(await devicesService.getDevice(id))
}

// DEVICE CHECK IN
exports.checkIn = async (req, res) => {
  console.log('POST /api/check-in')
  if (req.body === undefined) {
    res.json({error: 'Invalid request data'})
  } else {
    let checkInData = req.body
    console.log('checkInData', checkInData)

    if (checkInData.id === undefined || checkInData.deviceGroup === undefined || checkInData.version === undefined || checkInData.overrideVersion === undefined) {
      res.json({error: 'Invalid request data', data: checkInData})
    } else {
      let device = await devicesService.checkIn(checkInData.id, checkInData.deviceGroup, checkInData.version, checkInData.overrideVersion)
      let deviceGroup = await devicesService.getDeviceGroup(device.deviceGroup)
      res.json({success: true, checkInData: checkInData, device: device, deviceGroup: deviceGroup})
    }
  }
}
