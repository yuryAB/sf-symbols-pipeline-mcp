import { chmodSync, readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

const binPath = fileURLToPath(new URL("../dist/index.js", import.meta.url));
const contents = readFileSync(binPath, "utf8");

if (!contents.startsWith("#!/usr/bin/env node")) {
  throw new Error("dist/index.js must start with a Node shebang.");
}

chmodSync(binPath, 0o755);
