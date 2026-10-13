const mongoose = require("mongoose");
const os = require("os");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongo;

beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
    delete process.env.GITHUB_TOKEN;

    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }

    // The MongoDB driver loads its `os` adapter via dynamic import(), which
    // resolves to an unusable stub inside Jest's vm sandbox. That produces an
    // empty `client` document in the hello handshake, rejected by MongoDB 8+
    // ("Missing required sub-document 'driver'"). Passing the adapter through
    // statically sidesteps the sandbox without affecting production.
    await mongoose.connect(uri, { runtimeAdapters: { os } });
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const name of Object.keys(collections)) {
        await collections[name].deleteMany({});
    }
    jest.restoreAllMocks();
});

afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) {
        await mongo.stop();
    }
});
