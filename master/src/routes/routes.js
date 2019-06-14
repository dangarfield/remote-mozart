let router = require('express').Router()
let _ = require('lodash')

let installController = require('../controllers/installController')
let devicesController = require('../controllers/devicesController')
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

// INSTALLATION
router.get('/api/mozart_run.sh', catchAsyncErrors(installController.installFile))
// router.get('/api/cabins/:id', catchAsyncErrors(cabinsController.getCabin))
// router.patch('/api/cabins/:id', catchAsyncErrors(cabinsController.patchCabin))

// DEVICES
router.post('/api/check-in', catchAsyncErrors(devicesController.checkIn))

router.get('/api/device-groups', catchAsyncErrors(devicesController.getAllDeviceGroups))
router.get('/api/device-groups/:id', catchAsyncErrors(devicesController.getDeviceGroup))

router.get('/api/devices', catchAsyncErrors(devicesController.getAllDevices))
router.get('/api/devices/:group', catchAsyncErrors(devicesController.getAllDevicesForDeviceGroup))
router.get('/api/devices/:group/:id', catchAsyncErrors(devicesController.getDevice))

// router.get('/api/passengers/:id', catchAsyncErrors(passengersController.getPassenger))
// router.patch('/api/passengers/:id', catchAsyncErrors(passengersController.patchPassenger))
// router.get('/api/passengers/accountid/:id', catchAsyncErrors(passengersController.getPassengerByAccountId))

// // CREW
// router.get('/api/crew', catchAsyncErrors(crewController.getAllCrew))
// router.post('/api/crew', catchAsyncErrors(crewController.addCrew))
// router.delete('/api/crew/:id', catchAsyncErrors(crewController.deleteCrew))

// // ERRORS
// router.get('/api/errors/registration', catchAsyncErrors(errorsController.getRegistrationErrors))
// router.get('/api/errors/allocation', catchAsyncErrors(errorsController.getAllocationErrors))
// router.get('/api/errors/displaced-passengers', catchAsyncErrors(errorsController.getDisplacedPassengers))

// // ACTIONS
// router.post('/api/actions/resco-sync', catchAsyncErrors(actionsController.rescoSyncAll))
// router.post('/api/actions/resco-sync/:id', catchAsyncErrors(actionsController.rescoSyncOne))
// router.post('/api/actions/register-all', catchAsyncErrors(actionsController.indexAll))
// router.post('/api/actions/register-new', catchAsyncErrors(actionsController.indexNew))
// router.post('/api/actions/register-one/:filename', catchAsyncErrors(actionsController.registerOne))
// router.post('/api/actions/allocate-all/*', catchAsyncErrors(actionsController.allocateAll))
// router.post('/api/actions/allocate-new', catchAsyncErrors(actionsController.allocateNew))
// router.post('/api/actions/allocate-one/*', catchAsyncErrors(actionsController.allocateOne))
// router.post('/api/actions/clear-data', catchAsyncErrors(actionsController.clearData))
// router.post('/api/actions/force-registration-sync', catchAsyncErrors(actionsController.forceRegistrationSync))
// router.post('/api/actions/force-allocation-sync', catchAsyncErrors(actionsController.forceAllocationSync))
// router.post('/api/actions/export-images', catchAsyncErrors(actionsController.exportImages))
// router.post('/api/actions/clean-up-files', catchAsyncErrors(actionsController.cleanUpFiles))
// router.post('/api/actions/end-cruise', catchAsyncErrors(actionsController.endCruise))
// router.post('/api/actions/override-incomplete-registration', catchAsyncErrors(actionsController.overrideIncompleteRegistration))

// // PHOTOS
// router.get('/api/photos', catchAsyncErrors(photosController.getAllPhotoIDs))
// router.get('/api/photos/*', catchAsyncErrors(photosController.getPhotoData))
// router.delete('/api/registration-photo/*', catchAsyncErrors(photosController.deleteRegistrationPhoto))
// router.get('/api/crop/registration-photo/*', catchAsyncErrors(photosController.cropRegistrationPhoto))
// router.get('/api/validate-crop/:type-photo/*', catchAsyncErrors(photosController.validatePhoto))
// router.get('/api/crop-preview/:type-photo/*', catchAsyncErrors(photosController.cropPreview))
// router.get('/api/:type-photo/*', catchAsyncErrors(photosController.getPhoto))
// router.delete('/api/photography-photo/*', catchAsyncErrors(photosController.deletePhotographyPhoto))
// router.delete('/api/views-photo/*', catchAsyncErrors(photosController.deleteViewsPhoto))
// router.post('/api/manual-allocation', catchAsyncErrors(photosController.manualAllocation))

// // RECOGNITION
// router.use('/api/predict', catchAsyncErrors(recognitionController.predict))
// router.use('/api/validate', catchAsyncErrors(recognitionController.validate))

// // FILES & FOLDERS
// router.post('/api/upload/:type', catchAsyncErrors(photosController.uploadFile))
// router.get(['/api/files/:type', '/api/files/:type/*'], catchAsyncErrors(foldersController.getFolderData))
// router.get(['/api/event-data/:type', '/api/event-data/:type/*'], catchAsyncErrors(foldersController.getEnhancedFolderData))
// router.patch('/api/event-data/photography/*', catchAsyncErrors(foldersController.patchFolderData))

// // EXPORT
// router.get('/api/export/data', catchAsyncErrors(exportController.exportData))
// router.use('/api/export/model', catchAsyncErrors(exportController.exportModel))
// router.use('/api/export/training-data', catchAsyncErrors(exportController.exportTrainingData))

// // STORE
// router.get('/api/store/product-config', catchAsyncErrors(commerceController.getProductConfig))
// router.post('/api/store/product-config', catchAsyncErrors(commerceController.setProductConfig))
// router.delete('/api/store/product-config', catchAsyncErrors(commerceController.deleteProductConfig))
// router.post('/api/store/product-config/folder-reset', catchAsyncErrors(commerceController.resetProductConfigFolders))
// router.post('/api/store/product-config/folder-clean', catchAsyncErrors(commerceController.cleanProductConfigFolders))
// router.get('/api/store/basket/:id', catchAsyncErrors(commerceController.getBasket))
// router.post('/api/store/basket/:id/add', catchAsyncErrors(commerceController.addToBasket))
// router.post('/api/store/basket/:id/remove', catchAsyncErrors(commerceController.removeFromBasket))
// router.post('/api/store/basket/:id/order', catchAsyncErrors(commerceController.createOrder))
// router.delete('/api/store/basket/:id', catchAsyncErrors(commerceController.deleteBasket))
// router.get('/api/store/orders', catchAsyncErrors(commerceController.getAllOrders))
// router.get('/api/store/orders-by-passenger/:passengerId', catchAsyncErrors(commerceController.getOrderByPassengerId))
// router.get('/api/store/orders/:id', catchAsyncErrors(commerceController.getOrder))
// router.get('/api/store/orders-download/:file', catchAsyncErrors(commerceController.downloadOrder))
// router.patch('/api/store/orders/:id', catchAsyncErrors(commerceController.patchOrder))

// // MISC
// router.post('/api/resco-event-listener', catchAsyncErrors(miscController.rescoEventListener))
// router.get('/api/status', catchAsyncErrors(miscController.getStatus))
// router.get('/api/test', catchAsyncErrors(miscController.test))
// router.get('/api/documentation', catchAsyncErrors(miscController.forwardToDocumentation))
// router.post('/api/actions/migrate-recognition-index-metadata', catchAsyncErrors(miscController.migrateRecognitionIndexMetadata))
// router.post('/api/file-event-listener', catchAsyncErrors(miscController.fileEventListener))

module.exports = router
