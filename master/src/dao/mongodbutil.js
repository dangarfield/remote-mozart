const MongoClient = require('mongodb').MongoClient

const DB_ADDRESS = process.env.DB_ADDRESS

let client
let db
let devicesCollection
let deviceGroupsCollection
let documentsCollection

exports.initialise = async (callback) => {
  console.log('DB_ADDRESS', DB_ADDRESS)
  try {
    client = await MongoClient.connect(DB_ADDRESS, {useNewUrlParser: true,
      socketTimeoutMS: 480000,
      keepAlive: 300000
    })
    console.log('Connected correctly to mongo server')
    db = client.db('mozart')

    devicesCollection = db.collection('devices')
    deviceGroupsCollection = db.collection('deviceGroups')
    documentsCollection = db.collection('documents')

    const collections = await db.collections()
    if (!collections.map(c => c.s.name).includes('devices')) {
      await db.createCollection('devices')
    }
    if (!collections.map(c => c.s.name).includes('deviceGroups')) {
      await db.createCollection('deviceGroups')
    }
    if (!collections.map(c => c.s.name).includes('documents')) {
      await db.createCollection('documents')
    }
    console.log('Mongo Initialised')
    callback()
    // Ensure indexes are set?
  } catch (error) {
    console.log('Failure connecting to mongo server')
    return process.exit(1)
  }
}

exports.getDevicesCollection = () => {
  return devicesCollection
}
exports.getDeviceGroupsCollection = () => {
  return deviceGroupsCollection
}
exports.getDocumentsCollection = () => {
  return documentsCollection
}
