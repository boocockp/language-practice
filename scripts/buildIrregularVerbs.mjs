#!/usr/bin/env node
/**
 * Builds the irregular verb dictionary by comparing conjugations.json (Lefff)
 * with output of our regular verb rules. Any verb whose rule-generated table
 * does not match the reference is added to the irregular dictionary.
 *
 * Run from project root: node scripts/buildIrregularVerbs.mjs
 * Requires: node_modules/french-verbs-lefff/dist/conjugations.json
 * Output: convex/frenchConjugation/irregularVerbsData.json
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

// --- Regular verb rules (mirror of convex/frenchConjugation/regularVerbRules.ts) ---
function getVerbGroup(infinitive) {
  if (typeof infinitive !== "string" || infinitive.length < 3) return null;
  if (infinitive.endsWith("er")) return "er";
  if (infinitive.endsWith("ir")) return "ir";
  if (infinitive.endsWith("re")) return "re";
  return null;
}

function conjugateEr(infinitive) {
  const stem = infinitive.slice(0, -2);
  return {
    P: [stem + "e", stem + "es", stem + "e", stem + "ons", stem + "ez", stem + "ent"],
    S: [stem + "e", stem + "es", stem + "e", stem + "ions", stem + "iez", stem + "ent"],
    Y: ["NA", stem + "e", "NA", stem + "ons", stem + "ez", "NA"],
    I: [stem + "ais", stem + "ais", stem + "ait", stem + "ions", stem + "iez", stem + "aient"],
    G: [stem + "ant"],
    K: [stem + "é", stem + "és", stem + "ée", stem + "ées"],
    J: [stem + "ai", stem + "as", stem + "a", stem + "âmes", stem + "âtes", stem + "èrent"],
    T: [stem + "asse", stem + "asses", stem + "ât", stem + "assions", stem + "assiez", stem + "assent"],
    F: [stem + "erai", stem + "eras", stem + "era", stem + "erons", stem + "erez", stem + "eront"],
    C: [stem + "erais", stem + "erais", stem + "erait", stem + "erions", stem + "eriez", stem + "eraient"],
    W: [infinitive],
  };
}

function conjugateIr(infinitive) {
  const stem = infinitive.slice(0, -2);
  return {
    P: [stem + "is", stem + "is", stem + "it", stem + "issons", stem + "issez", stem + "issent"],
    S: [stem + "isse", stem + "isses", stem + "isse", stem + "issions", stem + "issiez", stem + "issent"],
    Y: ["NA", stem + "is", "NA", stem + "issons", stem + "issez", "NA"],
    I: [stem + "issais", stem + "issais", stem + "issait", stem + "issions", stem + "issiez", stem + "issaient"],
    G: [stem + "issant"],
    K: [stem + "i", stem + "is", stem + "ie", stem + "ies"],
    J: [stem + "is", stem + "is", stem + "it", stem + "îmes", stem + "îtes", stem + "irent"],
    T: [stem + "isse", stem + "isses", stem + "ît", stem + "issions", stem + "issiez", stem + "issent"],
    F: [stem + "irai", stem + "iras", stem + "ira", stem + "irons", stem + "irez", stem + "iront"],
    C: [stem + "irais", stem + "irais", stem + "irait", stem + "irions", stem + "iriez", stem + "iraient"],
    W: [infinitive],
  };
}

function conjugateRe(infinitive) {
  const stem = infinitive.slice(0, -2);
  return {
    P: [stem + "s", stem + "s", stem, stem + "ons", stem + "ez", stem + "ent"],
    S: [stem + "e", stem + "es", stem + "e", stem + "ions", stem + "iez", stem + "ent"],
    Y: ["NA", stem + "s", "NA", stem + "ons", stem + "ez", "NA"],
    I: [stem + "ais", stem + "ais", stem + "ait", stem + "ions", stem + "iez", stem + "aient"],
    G: [stem + "ant"],
    K: [stem + "u", stem + "us", stem + "ue", stem + "ues"],
    J: [stem + "is", stem + "is", stem + "it", stem + "îmes", stem + "îtes", stem + "irent"],
    T: [stem + "isse", stem + "isses", stem + "ît", stem + "issions", stem + "issiez", stem + "issent"],
    F: [stem + "rai", stem + "ras", stem + "ra", stem + "rons", stem + "rez", stem + "ront"],
    C: [stem + "rais", stem + "rais", stem + "rait", stem + "rions", stem + "riez", stem + "raient"],
    W: [infinitive],
  };
}

function conjugateRegular(infinitive) {
  const group = getVerbGroup(infinitive);
  if (group === "er") return conjugateEr(infinitive);
  if (group === "ir") return conjugateIr(infinitive);
  if (group === "re") return conjugateRe(infinitive);
  return null;
}

// --- Deep equality for VerbInfo (only keys we care about) ---
const TENSE_KEYS = ["P", "S", "Y", "I", "G", "K", "J", "T", "F", "C", "W"];

function tablesMatch(a, b) {
  for (const key of TENSE_KEYS) {
    const aa = a[key];
    const bb = b[key];
    if (!Array.isArray(aa) || !Array.isArray(bb)) return false;
    if (aa.length !== bb.length) return false;
    for (let i = 0; i < aa.length; i++) {
      if (aa[i] !== bb[i]) return false;
    }
  }
  return true;
}

// --- Main ---
const conjugationsPath = join(
  rootDir,
  "node_modules/french-verbs-lefff/dist/conjugations.json",
);
const outputPath = join(rootDir, "convex/frenchConjugation/irregularVerbsData.json");

console.log("Reading", conjugationsPath);
const conjugations = JSON.parse(readFileSync(conjugationsPath, "utf8"));

const irregular = {};
let total = 0;
let skipped = 0;

for (const verb of Object.keys(conjugations)) {
  const ref = conjugations[verb];
  if (ref === null || typeof ref !== "object" || Object.keys(ref).length === 0) {
    skipped++;
    continue;
  }
  if (verb === "avoir" || verb === "être" || verb === "uw" || verb === "uwSe") {
    skipped++;
    continue;
  }
  total++;
  const computed = conjugateRegular(verb);
  if (!computed || !tablesMatch(ref, computed)) {
    irregular[verb] = ref;
  }
}

console.log(`Total verbs checked: ${total}, skipped: ${skipped}, irregular: ${Object.keys(irregular).length}`);

writeFileSync(outputPath, JSON.stringify(irregular, null, 2) + "\n", "utf8");
console.log("Wrote", outputPath);
