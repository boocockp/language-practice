/**
 * Proxy that implements the VerbsInfo interface (verb -> VerbInfo) used by
 * french-verbs.getVerbInfo(verbsList, verb). Returns irregular entry if present,
 * otherwise computes conjugation using regular verb rules.
 */
import type { VerbInfo } from "./verbInfo";
import { conjugateRegular } from "./regularVerbRules";

/**
 * Create a Proxy that acts like VerbsInfo: object[verb] returns VerbInfo.
 * - If verb is in irregularDict, return that table.
 * - Else try to generate via regular rules (-er, -ir, -re); return undefined if not regular.
 * french-verbs getVerbInfo(verbsList, verb) only does verbsList[verb], so we only need get.
 */
export function createVerbLookupProxy(
  irregularDict: Record<string, VerbInfo>,
): Record<string, VerbInfo> {
  return new Proxy(
    {} as Record<string, VerbInfo>,
    {
      get(_target, prop: string): VerbInfo | undefined {
        if (typeof prop !== "string") return undefined;
        const verb = prop;
        if (Object.prototype.hasOwnProperty.call(irregularDict, verb)) {
          return irregularDict[verb];
        }
        return conjugateRegular(verb) ?? undefined;
      },
    },
  ) as Record<string, VerbInfo>;
}
