export default {
  source: {
    uri: "mongodb://127.0.0.1:27017",
    db: "crystalTest",
    collection: "users",
    field: "_id",
    match: {}
  },

  target: {
    uri: "mongodb://127.0.0.1:27017",
    db: "pool",
    collection: "usersIdFromCrystalTest",
    field: "users",
    documentId: false,
    rewriteDocuments: true,
    rewriteArray: true,
    duplicatesInArray: false,
    unwrapObjectId: true
  },

  aggregation: {
    allowDiskUse: true,
    batchSize: 200
  },
};
