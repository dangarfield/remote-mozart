let router = require('express').Router()
let _ = require('lodash')

let installController = require('../controllers/installController')
let devicesController = require('../controllers/devicesController')
let pageController = require('../controllers/pageController')
let ValidationError = require('../controllers/validationError')

const catchAsyncErrors = (fn) => {
  return (req, res, next) => {
    const routePromise = fn(req, res, next)
    if (routePromise.catch) {
      routePromise.catch(err => {
        if (err instanceof ValidationError) {
          console.log('Validation error')
          res.status(500).json({error: true, errorMsg: err.message})
        } else {
          let errorId = _.random(1000000, 9999999)
          console.error('Caught API error', errorId, err)
          res.status(500).json({error: true, errorMsg: 'Exception logged on server error', errorId: errorId})
        }
      })
    }
  }
}

// DEVICE PAGES
router.get('/', pageController.homePage)
router.get('/device-groups', pageController.viewAllDeviceGroups)
router.get('/device-groups/:id', pageController.viewDeviceGroup)
router.get('/device-groups/:id/edit', pageController.editDeviceGroup)
router.post('/device-groups/:id/edit', pageController.saveStagedDeviceGroupConfig)
router.post('/device-groups/:id/deploy', pageController.deployStagedDeviceConfig)
router.post('/device-groups/:id/copy', pageController.copyDeviceConfigFromDeployedToStaged)
router.post('/device-groups/:id/delete-staged', pageController.deleteStagedConfig)
router.get('/device-groups/:deviceGroupId/devices/:deviceId/edit', pageController.editDevice)
router.post('/device-groups/:deviceGroupId/devices/:deviceId/edit', pageController.saveDeviceConfig)


// INSTALLATION API
router.get('/api/mozart_run.sh', catchAsyncErrors(installController.installFile))

// DEVICE API
router.post('/api/check-in', catchAsyncErrors(devicesController.checkIn))
router.get('/api/device-groups/:deviceGroupId/devices/:deviceId/download', pageController.downloadLatestFiles)

// GENERAL API
router.get('/api/device-groups', catchAsyncErrors(devicesController.getAllDeviceGroups))
router.get('/api/device-groups/:id', catchAsyncErrors(devicesController.getDeviceGroup))

router.get('/api/devices', catchAsyncErrors(devicesController.getAllDevices))
router.get('/api/devices/:group', catchAsyncErrors(devicesController.getAllDevicesForDeviceGroup))
router.get('/api/devices/:group/:id', catchAsyncErrors(devicesController.getDevice))

module.exports = router
