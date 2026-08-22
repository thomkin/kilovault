import esbuild from "esbuild";
import * as path from "path";
import * as fs from "fs";

// Determine PROJECT_ROOT
const PROJECT_ROOT = process.cwd();

async function bundle() {
  const entryPoint = path.join(PROJECT_ROOT, "src/index.ts");
  const outFile = path.join(PROJECT_ROOT, "dist/index.js");

  if (!fs.existsSync(entryPoint)) {
    console.error(`Entry point not found: ${entryPoint}`);
    process.exit(1);
  }

  console.log(`🚀 Bundling: ${entryPoint} -> ${outFile}`);

  await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    minify: true,
    treeShaking: true,
    outfile: outFile,
    format: "esm",
    target: ["es2022"],
    platform: "browser",
    external: ["@bunny.net/edgescript-sdk"],
    logLevel: "info",
  });

  const finalOutFile = path.join(PROJECT_ROOT, "dist/index.js");
  if (fs.existsSync(outFile)) {
    console.log(
      `✅ Bundle generated: ${path.relative(PROJECT_ROOT, finalOutFile)}`,
    );
  }
}

bundle().catch((err) => {
  console.error("Bundle failed:", err.message);
  process.exit(1);
});
