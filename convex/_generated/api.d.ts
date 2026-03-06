/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as frenchConjugation_index from "../frenchConjugation/index.js";
import type * as frenchConjugation_irregularVerbs from "../frenchConjugation/irregularVerbs.js";
import type * as frenchConjugation_regularVerbRules from "../frenchConjugation/regularVerbRules.js";
import type * as frenchConjugation_verbInfo from "../frenchConjugation/verbInfo.js";
import type * as frenchConjugation_verbLookupProxy from "../frenchConjugation/verbLookupProxy.js";
import type * as http from "../http.js";
import type * as practice from "../practice.js";
import type * as practiceActions from "../practiceActions.js";
import type * as practiceInternal from "../practiceInternal.js";
import type * as questionGeneration from "../questionGeneration.js";
import type * as questionTypes from "../questionTypes.js";
import type * as templateHelpers from "../templateHelpers.js";
import type * as translation from "../translation.js";
import type * as users from "../users.js";
import type * as wordTypes from "../wordTypes.js";
import type * as words from "../words.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "frenchConjugation/index": typeof frenchConjugation_index;
  "frenchConjugation/irregularVerbs": typeof frenchConjugation_irregularVerbs;
  "frenchConjugation/regularVerbRules": typeof frenchConjugation_regularVerbRules;
  "frenchConjugation/verbInfo": typeof frenchConjugation_verbInfo;
  "frenchConjugation/verbLookupProxy": typeof frenchConjugation_verbLookupProxy;
  http: typeof http;
  practice: typeof practice;
  practiceActions: typeof practiceActions;
  practiceInternal: typeof practiceInternal;
  questionGeneration: typeof questionGeneration;
  questionTypes: typeof questionTypes;
  templateHelpers: typeof templateHelpers;
  translation: typeof translation;
  users: typeof users;
  wordTypes: typeof wordTypes;
  words: typeof words;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
