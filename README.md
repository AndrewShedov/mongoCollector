[![Discord](https://img.shields.io/discord/1006372235172384849?style=for-the-badge&logo=discord&logoColor=white&labelColor=black&color=%23f3f3f3&label=)](https://discord.gg/ENB7RbxVZE)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge&logo=5865F2&logoColor=black&labelColor=black&color=%23f3f3f3)](https://github.com/AndrewShedov/mongoCollector/blob/main/LICENSE)

# mongoCollector

CLI tool for extracting values of a specific field from a MongoDB collection and saving them into a target collection.<br>
Supports batching, large dataset processing, and flexible write configurations.

### Features
1. Extract values of any <code>field</code> from MongoDB documents.
2. Data filtering using <code>$match</code>.
3. <code>Batching</code> (batchSize) to avoid MongoDB’s 16MB per-document limit.
4. <code>ObjectId</code> transformation: ObjectId('68a8c8207090be6dd0e23a90') → '68a8c8207090be6dd0e23a90'.
5. Large collections supported via <code>allowDiskUse</code>.
6. Flexible array handling:
 - Overwrite or append to arrays.
 - Allow or eliminate duplicates.
7. Informative logs:
<img src="https://raw.githubusercontent.com/AndrewShedov/mongoCollector/refs/heads/main/assets/screenshot_1.png" width="450" />

### Installation & Usage

1. Install the package:

```bash
npm i  mongo-collector
```

2. Add a script in your **package.json**:

```json
"scripts": {
  "mongoCollector": "mongo-collector"
}
```

3. In the root of the project, create a file — [mongo-collector.config.js](https://github.com/AndrewShedov/mongoCollector/blob/main/config%20example/mongo-collector.config.js).

Example of file contents:

```js
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

```

**⚠️ All parameters are required.**

4. Run from the project root:
   
```bash
npm run mongoCollector

```

### Example of work

Source collection users (from source):

```js
{ "_id": ObjectId("68a8c8207090be6dd0e23a90"), "name": "Alice" }
{ "_id": ObjectId("68a8c8207090be6dd0e23a91"), "name": "Sarah" }
{ "_id": ObjectId("68a8c8207090be6dd0e23a92"), "name": "John" }

```

After running mongo-collector, in the target collection usersIdFromCrystal:

```js
{ "users": [ "68a8c8207090be6dd0e23a90", "68a8c8207090be6dd0e23a91", "68a8c8207090be6dd0e23a92" ] }
```
### Config parameters

#### match

You can do any <code>match</code> configurations, for example:

<code>match: {}</code> - take all documents.

<code>match: { createdAt: { $gte: new Date("2025-08-20T01:26:11.327+00:00") } } </code> - filter documents by date.

#### documentId

<code>documentId: false</code> - create a new document.

<code>documentId: '68a8c8207090be6dd0e23a90'</code> - append data to an existing document, or create one with this _id if missing.

#### rewriteDocuments

<code>rewriteDocuments: true</code> - clear the entire target collection before writing.

#### rewriteArray

<code>true</code>  - overwrite array  
<code>false</code>  - append to an existing array

#### duplicatesInArray

<code>false</code>  - eliminate duplicates (uses <code>$addToSet</code>)  

#### unwrapObjectId

<code>true</code> - ObjectId('68a8c8207090be6dd0e23a90') → '68a8c8207090be6dd0e23a90' (final result in target).

#### allowDiskUse

<code>true</code> - allows MongoDB to write temporary data to disk when processing aggregation stages.<br>
- Use this option for large datasets to avoid memory limitations.  

<code>false</code> - restricts processing to memory only.<br>
- This can improve performance, but may result in errors if the dataset is too large to fit into memory.

#### batchSize

<code>batchSize: 10</code> - controls the length of the array inside each target document.

**⚠️ Make sure the array does not exceed 16MB, otherwise MongoDB will throw an error.** <br>

An example of mongoCollector in operation: <br>

<p align="center">
<a href="https://youtu.be/5V4otU4KZaA?t=21">
  <img src="https://raw.githubusercontent.com/AndrewShedov/mongoCollector/refs/heads/main/assets/screenshot_2.png" style="width: 100%; max-width: 100%;" alt="CRYSTAL v1.0 features"/>
</a>
</p>
<br>

[![SHEDOV.TOP](https://img.shields.io/badge/SHEDOV.TOP-black?style=for-the-badge)](https://shedov.top/) 
[![CRYSTAL](https://img.shields.io/badge/CRYSTAL-black?style=for-the-badge)](https://crysty.ru/AndrewShedov)
[![Discord](https://img.shields.io/badge/Discord-black?style=for-the-badge&logo=discord&color=black&logoColor=white)](https://discord.gg/ENB7RbxVZE)
[![Telegram](https://img.shields.io/badge/Telegram-black?style=for-the-badge&logo=telegram&color=black&logoColor=white)](https://t.me/ShedovChannel)
[![X](https://img.shields.io/badge/%20-black?style=for-the-badge&logo=x&logoColor=white)](https://x.com/AndrewShedov)
[![VK](https://img.shields.io/badge/VK-black?style=for-the-badge&logo=vk)](https://vk.com/shedovchannel)
[![VK Video](https://img.shields.io/badge/VK%20Video-black?style=for-the-badge&logo=vk)](https://vkvideo.ru/@shedovchannel)
[![YouTube](https://img.shields.io/badge/YouTube-black?style=for-the-badge&logo=youtube)](https://www.youtube.com/@AndrewShedov)
