#!/usr/bin/env node
/**
 * Create KV + D1 when wrangler.toml still has placeholder IDs.
 * Idempotent: reuses namespaces/databases that already exist by name.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const TOML_PATH = path.join(process.cwd(), "wrangler.toml");
const KV_TITLE = "notify-projects";
const D1_NAME = "notify-tasks";

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" });
}

function isPlaceholder(id) {
  return !id || /^0+$/.test(id.replace(/-/g, ""));
}

function extractJson(raw) {
  const text = raw.trim();
  const start = Math.min(
    ...["[", "{"].map((c) => {
      const i = text.indexOf(c);
      return i < 0 ? Number.POSITIVE_INFINITY : i;
    }),
  );
  if (!Number.isFinite(start)) throw new Error(`Expected JSON from wrangler:\n${raw}`);
  return JSON.parse(text.slice(start));
}

function asList(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.result)) return value.result;
  if (Array.isArray(value?.namespaces)) return value.namespaces;
  if (Array.isArray(value?.databases)) return value.databases;
  return [];
}

function replaceField(toml, section, key, value) {
  const re = new RegExp(`(\\[\\[${section}\\]\\][\\s\\S]*?${key}\\s*=\\s*")[^"]*(")`);
  if (!re.test(toml)) throw new Error(`wrangler.toml missing [[${section}]] ${key}`);
  return toml.replace(re, `$1${value}$2`);
}

function readIds(toml) {
  return {
    kv: toml.match(/\[\[kv_namespaces\]\][\s\S]*?id\s*=\s*"([^"]+)"/)?.[1],
    d1: toml.match(/\[\[d1_databases\]\][\s\S]*?database_id\s*=\s*"([^"]+)"/)?.[1],
  };
}

let toml = fs.readFileSync(TOML_PATH, "utf8");
let { kv, d1 } = readIds(toml);
kv = process.env.NOTIFY_KV_ID || kv;
d1 = process.env.NOTIFY_D1_ID || d1;

if (isPlaceholder(kv)) {
  const listed = asList(extractJson(sh("npx wrangler kv namespace list")));
  const found = listed.find((item) => item.title === KV_TITLE);
  if (found?.id) {
    kv = found.id;
    console.log(`Reusing KV ${KV_TITLE} (${kv})`);
  } else {
    const created = sh(`npx wrangler kv namespace create ${KV_TITLE}`);
    kv = created.match(/id\s*=\s*"([^"]+)"/)?.[1];
    if (!kv) throw new Error(`Failed to create KV:\n${created}`);
    console.log(`Created KV ${KV_TITLE} (${kv})`);
  }
}

if (isPlaceholder(d1)) {
  const listed = asList(extractJson(sh("npx wrangler d1 list")));
  const found = listed.find((item) => item.name === D1_NAME);
  if (found) {
    d1 = found.uuid || found.id;
    console.log(`Reusing D1 ${D1_NAME} (${d1})`);
  } else {
    const created = sh(`npx wrangler d1 create ${D1_NAME}`);
    d1 = created.match(/database_id\s*=\s*"([^"]+)"/)?.[1];
    if (!d1) throw new Error(`Failed to create D1:\n${created}`);
    console.log(`Created D1 ${D1_NAME} (${d1})`);
  }
}

toml = replaceField(toml, "kv_namespaces", "id", kv);
toml = replaceField(toml, "d1_databases", "database_id", d1);
fs.writeFileSync(TOML_PATH, toml);
console.log(`Wrote wrangler.toml bindings: NOTIFY_KV=${kv} DB=${d1}`);
