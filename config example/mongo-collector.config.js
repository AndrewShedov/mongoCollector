export default {
  source: {
    uri: "mongodb://127.0.0.1:27017",
    db: "crystal",
    collection: "users",
    field: "_id",
    match: {}
    /*
    match: {} - take all the documents
    ---
    match: { createdAt: { $gte: new Date("2025-08-20T01:26:11.327+00:00") } } - take documents with a specific date
    */
  },

  target: {
    uri: "mongodb://127.0.0.1:27017",
    db: "pool",
    collection: "usersIdFromCrystal",
    field: "usersId",
    documentId: false,
    /*
    false - create a new document.
    ---
    documentId: '68a8c8207090be6dd0e23a90' - add data to an already created document, or if it does not exist, create it - '68a8c8207090be6dd0e23a90' and add it there.
    */

    rewriteDocuments: true, // true - clearing the entire collection
    rewriteArray: true,
    /*
    true - rewrite array.
    false - complements an existing array
    */

    duplicatesInArray: false,
    /*
     false - eliminate duplicates (uses '$addToSet')
    */

    unwrapObjectId: true
    /*
    true - ObjectId('68a8c8207090be6dd0e23a90') → '68a8c8207090be6dd0e23a90'
    */
  },

  aggregation: {
    allowDiskUse: true,
    /*
    true - MongoDB is allowed to use temporary disk space for intermediate data.
    false - MongoDB processes data only in RAM.
    */

    batchSize: 3
    /*
    batchSize: 3 - the length of the array in the document. If the batchSize value is large and the input data size is large, the 16mb limit per document may be used up and an error will appear.
    */
  },
};
