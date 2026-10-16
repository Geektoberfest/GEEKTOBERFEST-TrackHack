// Preloaded before the test run when executing under Bun (`bun test`).
// Applies the shared Bun runtime workaround, then the Jest-compatible
// in-memory MongoDB setup (kept working under plain Node/Jest too).
require("../src/bun-compat.js");
require("./setup.js");
