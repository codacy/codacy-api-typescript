import rollup from "rollup";
import nodeResolve from "rollup-plugin-node-resolve";
import sourcemaps from "rollup-plugin-sourcemaps";

/**
 * @type {rollup.RollupFileOptions}
 */
const config = {
  input: "./esm/client.js",
  external: [
    "@azure/ms-rest-js",
    "@azure/ms-rest-azure-js"
  ],
  output: {
    file: "./dist/codacy-api-client.js",
    format: "umd",
    name: "CodacyApiClient",
    sourcemap: true,
    globals: {
      "@azure/ms-rest-js": "msRest",
      "@azure/ms-rest-azure-js": "msRestAzure"
    }
  },
  plugins: [
    nodeResolve({ mainFields: ['module', 'main'] }),
    sourcemaps()
  ]
};

export default config;
