let documentsCollection = require('./mongodbutil').getDocumentsCollection()
const ObjectID = require('mongodb').ObjectID

exports.getDocumentById = async (id) => {
  console.log('getDocumentById', id)
  let document = await documentsCollection.findOne({_id: id})
  if (document !== null) {
    document.id = document._id
    delete document._id
  }
  return document
}

exports.insertDocument = async (name, content) => {
  let _id = new ObjectID().toString()
  await documentsCollection.insertOne({_id: _id, name: name, content: content})
  return _id
}
exports.deleteDocument = async (id) => {
  // await documentsCollection.deleteOne({_id: id})
}
