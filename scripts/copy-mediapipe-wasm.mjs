/**
 * Copies MediaPipe Tasks Vision WASM files from node_modules into public/
 * so Next.js can serve them without relying on an external CDN.
 *
 * Run automatically via the "postinstall" npm script.
 */
import { cpSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const src = resolve(root, "node_modules/@mediapipe/tasks-vision/wasm");
const dst = resolve(root, "public/mediapipe/wasm");

mkdirSync(dst, { recursive: true });
cpSync(src, dst, { recursive: true });

console.log("✓ MediaPipe WASM files copied to public/mediapipe/wasm/");
