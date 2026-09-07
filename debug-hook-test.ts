import { existsSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { docsRoot, resolveProjectDir, auditFilePath, codekbDir } from "./.claude/tools/aidlc-lib.ts";

const projectDir = resolveProjectDir();
const rawFile = "D:/WebPractice_Data/magichouse/aidlc/spaces/default/intents/260904-test-infra-setup-2/inception/units-generation/unit-of-work.md";

const file = isAbsolute(rawFile) ? rawFile : join(projectDir, rawFile);
const auditFileValue = file.replace(/\\/g, "/");
const fileNorm = auditFileValue;

const recordRoot = docsRoot(projectDir).replace(/\\/g, "/").replace(/\/$/, "");
const underRecord = fileNorm === recordRoot || fileNorm.startsWith(`${recordRoot}/`);

const codekbRoot = join(codekbDir(projectDir, "_"), "..").replace(/\\/g, "/").replace(/\/$/, "");
const underCodekb = fileNorm.startsWith(`${codekbRoot}/`);

const auditFile = auditFilePath(projectDir);

console.log("file:", file);
console.log("fileNorm:", fileNorm);
console.log("recordRoot:", recordRoot);
console.log("underRecord:", underRecord);
console.log("codekbRoot:", codekbRoot);
console.log("underCodekb:", underCodekb);
console.log("auditFile:", auditFile);
console.log("auditFileExists:", existsSync(auditFile));
