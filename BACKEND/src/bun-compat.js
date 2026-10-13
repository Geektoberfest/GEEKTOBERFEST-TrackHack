// Preloaded on every Bun entrypoint (`bun run dev`, `bun start`, `bun test`).
// Bun 1.3 does not implement `node:v8` startupSnapshot, which bson probes at
// import time via `process.getBuiltinModule('v8')`. Removing that hook makes
// the probe fall back to `{}` (same behavior as plain Node) so mongoose loads.
delete process.getBuiltinModule;
