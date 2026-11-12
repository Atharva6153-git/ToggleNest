/**
 * Jest compatibility shim for the MongoDB Node driver.
 *
 * Driver 7.x loads its default `os` runtime adapter with a dynamic `import()`.
 * Jest's CommonJS runtime rejects that import, which makes the driver fall back
 * to an empty client metadata document and MongoDB rejects the handshake with
 * "Missing required sub-document 'driver'". Providing the Node `os` adapter up
 * front keeps the driver handshake valid while testing.
 */
const os = require('os');
const runtimeAdapters = require('mongodb/lib/runtime_adapters');

runtimeAdapters.resolveRuntimeAdapters = async (options) => ({
  os: options.runtimeAdapters?.os ?? os,
});
