import { MongoClient, ObjectId } from "mongodb";
import { performance } from "perf_hooks";

function validateConfig(cfg) {
  if (!cfg.source || !cfg.target || !cfg.aggregation) {
    console.error("❌ Error: config missing required sections (source, target, aggregation)");
    process.exit(1);
  }

  if (typeof cfg.target.rewriteDocuments !== "boolean") {
    console.error("❌ Error: target.rewriteDocuments must be boolean.");
    process.exit(1);
  }
  if (typeof cfg.target.rewriteArray !== "boolean") {
    console.error("❌ Error: target.rewriteArray must be boolean.");
    process.exit(1);
  }
  if (typeof cfg.target.duplicatesInArray !== "boolean") {
    console.error("❌ Error: target.duplicatesInArray must be boolean.");
    process.exit(1);
  }
  if (typeof cfg.aggregation.allowDiskUse !== "boolean") {
    console.error("❌ Error: aggregation.allowDiskUse must be boolean.");
    process.exit(1);
  }
}

function toMaybeObjectId(id) {
  if (!id) return null;
  try {
    return /^[a-fA-F0-9]{24}$/.test(String(id))
      ? new ObjectId(String(id))
      : id;
  } catch {
    return id;
  }
}

// normalization of values
function normalizeTopLevelElement(v, unwrapObjectId) {
  function unwrap(val) {
    if (val instanceof ObjectId) {
      return unwrapObjectId ? val.toHexString() : val;
    }
    return val;
  }

  if (Array.isArray(v)) {
    const inner = v.filter((x) => x != null).map(unwrap);
    return inner.length ? inner : null;
  }
  if (v == null) return null;

  return unwrap(v);
}

export async function runMongoCollector(config) {
  validateConfig(config);
  const { source, target, aggregation } = config;

  console.log("🚀 Start\n");

  console.log("📥 Source");
  console.log(`   🌐 URI:        ${source.uri}`);
  console.log(`   🗄️ Database:   ${source.db}`);
  console.log(`   📂 Collection: ${source.collection}`);
  console.log(`   🔑 Field:      ${source.field}`);
  console.log(`   🔍 Match:      ${JSON.stringify(source.match || {})}\n`);

  console.log("📤 Target");
  console.log(`   🌐 URI:        ${target.uri}`);
  console.log(`   🗄️ Database:   ${target.db}`);
  console.log(`   📂 Collection: ${target.collection}`);
  console.log(`   📝 Field:      ${target.field}`);
  console.log(
    `   🏷️ documentId: ${target.documentId === false
      ? "false (always new doc)"
      : target.documentId ?? "(not provided → new doc)"}`
  );

  console.log("\n⚙️ Config");
  console.log(`   🧹 rewriteDocuments:  ${target.rewriteDocuments}`);
  console.log(`   📂 rewriteArray:      ${target.rewriteArray}`);
  console.log(`   🔁 duplicatesInArray: ${target.duplicatesInArray}`);
  console.log(`   🔓 unwrapObjectId:    ${target.unwrapObjectId}`);
  console.log(`   💾 allowDiskUse:      ${aggregation.allowDiskUse}`);
  console.log(`   📦 batchSize:         ${aggregation.batchSize}\n`);

  const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let spinnerIndex = 0;
  const start = performance.now();

  const spinnerInterval = setInterval(() => {
    const frame = spinnerFrames[spinnerIndex % spinnerFrames.length];
    process.stdout.write(
      `\r${frame} Collecting values from '${source.db}.${source.collection}' field '${source.field}' ...`
    );
    spinnerIndex++;
  }, 100);

  const inClient = new MongoClient(source.uri);
  const outClient = new MongoClient(target.uri);

  try {
    await inClient.connect();
    await outClient.connect();

    const inColl = inClient.db(source.db).collection(source.collection);
    const outColl = outClient.db(target.db).collection(target.collection);

    if (target.rewriteDocuments) {
      const delRes = await outColl.deleteMany({});
      if (process.stdout.clearLine) process.stdout.clearLine(0);
      if (process.stdout.cursorTo) process.stdout.cursorTo(0);
      console.log(`🧹 Target cleared: deleted ${delRes.deletedCount} docs\n`);
    }

    const cursor = inColl.aggregate(
      [
        { $match: source.match || {} },
        { $project: { v: `$${source.field}` } },
      ],
      { allowDiskUse: aggregation.allowDiskUse, batchSize: aggregation.batchSize }
    );

    let batch = [];
    let totalCollected = 0;
    let docsWritten = 0;
    let firstChunk = false;

    const providedTargetId =
      !target.rewriteDocuments &&
        target.documentId !== false &&
        target.documentId != null
        ? toMaybeObjectId(target.documentId)
        : null;

    async function flush(arr) {
      if (!arr.length) return;

      if (!firstChunk && providedTargetId) {
        if (target.rewriteArray) {
          await outColl.updateOne(
            { _id: providedTargetId },
            { $set: { [target.field]: arr } },
            { upsert: true }
          );
        } else {
          const operator = target.duplicatesInArray ? "$push" : "$addToSet";
          await outColl.updateOne(
            { _id: providedTargetId },
            { [operator]: { [target.field]: { $each: arr } } },
            { upsert: true }
          );
        }
      } else {
        await outColl.insertOne({ [target.field]: arr });
      }

      firstChunk = true;
      docsWritten++;
    }

    for await (const doc of cursor) {
      const top = normalizeTopLevelElement(doc?.v, target.unwrapObjectId);
      if (top != null) {
        batch.push(top);
        totalCollected++;
      }

      if (batch.length >= aggregation.batchSize) {
        await flush(batch);
        batch = [];
      }
    }

    if (batch.length) {
      await flush(batch);
    }

    clearInterval(spinnerInterval);
    if (process.stdout.clearLine) process.stdout.clearLine(0);
    if (process.stdout.cursorTo) process.stdout.cursorTo(0);

    console.log("\n✅ Operation completed");
    console.log(`\n📊 Total values collected: ${totalCollected.toLocaleString()}`);
    console.log(`🧩 Documents written:      ${docsWritten.toLocaleString()}`);

    const duration = performance.now() - start;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    const milliseconds = Math.floor(duration % 1000);
    let timeString = "";
    if (minutes > 0) timeString += `${minutes} min `;
    if (seconds > 0) timeString += `${seconds} sec `;
    timeString += `${milliseconds} ms`;
    console.log(`\n⏱️ Lead time: ${timeString}`);
  } catch (err) {
    clearInterval(spinnerInterval);
    if (process.stdout.clearLine) process.stdout.clearLine(0);
    if (process.stdout.cursorTo) process.stdout.cursorTo(0);
    console.error("❌ Collector error:", err?.message ?? err);
    process.exit(1);
  } finally {
    await inClient.close().catch(() => { });
    await outClient.close().catch(() => { });
  }
}
