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
import type * as sessionTypes from "../sessionTypes.js";
import type * as templateHelpers from "../templateHelpers.js";
import type * as translation from "../translation.js";
import type * as users from "../users.js";
import type * as vendor_frenchAdjectives_index from "../vendor/frenchAdjectives/index.js";
import type * as vendor_frenchContractions_hmuet from "../vendor/frenchContractions/hmuet.js";
import type * as vendor_frenchContractions_index from "../vendor/frenchContractions/index.js";
import type * as vendor_frenchContractions_vowel from "../vendor/frenchContractions/vowel.js";
import type * as vendor_frenchVerbs_index from "../vendor/frenchVerbs/index.js";
import type * as vendor_frenchVerbsLefffTypes from "../vendor/frenchVerbsLefffTypes.js";
import type * as vendor_pluralizeFr from "../vendor/pluralizeFr.js";
import type * as vendor_rosaenlgCommons_Constants from "../vendor/rosaenlgCommons/Constants.js";
import type * as vendor_rosaenlgCommons_DictManager from "../vendor/rosaenlgCommons/DictManager.js";
import type * as vendor_rosaenlgCommons_LanguageCommon from "../vendor/rosaenlgCommons/LanguageCommon.js";
import type * as vendor_rosaenlgCommons_LanguageCommonEnglish from "../vendor/rosaenlgCommons/LanguageCommonEnglish.js";
import type * as vendor_rosaenlgCommons_LanguageCommonFrench from "../vendor/rosaenlgCommons/LanguageCommonFrench.js";
import type * as vendor_rosaenlgCommons_LanguageCommonGerman from "../vendor/rosaenlgCommons/LanguageCommonGerman.js";
import type * as vendor_rosaenlgCommons_LanguageCommonItalian from "../vendor/rosaenlgCommons/LanguageCommonItalian.js";
import type * as vendor_rosaenlgCommons_LanguageCommonOther from "../vendor/rosaenlgCommons/LanguageCommonOther.js";
import type * as vendor_rosaenlgCommons_LanguageCommonSpanish from "../vendor/rosaenlgCommons/LanguageCommonSpanish.js";
import type * as vendor_rosaenlgCommons_index from "../vendor/rosaenlgCommons/index.js";
import type * as vendor_rosaenlgFilter_LanguageFilter from "../vendor/rosaenlgFilter/LanguageFilter.js";
import type * as vendor_rosaenlgFilter_LanguageFilterEnglish from "../vendor/rosaenlgFilter/LanguageFilterEnglish.js";
import type * as vendor_rosaenlgFilter_LanguageFilterFrench from "../vendor/rosaenlgFilter/LanguageFilterFrench.js";
import type * as vendor_rosaenlgFilter_LanguageFilterGerman from "../vendor/rosaenlgFilter/LanguageFilterGerman.js";
import type * as vendor_rosaenlgFilter_LanguageFilterItalian from "../vendor/rosaenlgFilter/LanguageFilterItalian.js";
import type * as vendor_rosaenlgFilter_LanguageFilterOther from "../vendor/rosaenlgFilter/LanguageFilterOther.js";
import type * as vendor_rosaenlgFilter_LanguageFilterSpanish from "../vendor/rosaenlgFilter/LanguageFilterSpanish.js";
import type * as vendor_rosaenlgFilter_clean from "../vendor/rosaenlgFilter/clean.js";
import type * as vendor_rosaenlgFilter_html from "../vendor/rosaenlgFilter/html.js";
import type * as vendor_rosaenlgFilter_index from "../vendor/rosaenlgFilter/index.js";
import type * as vendor_rosaenlgFilter_languageFilterHelper from "../vendor/rosaenlgFilter/languageFilterHelper.js";
import type * as vendor_rosaenlgFilter_protect from "../vendor/rosaenlgFilter/protect.js";
import type * as vendor_rosaenlgFilter_protectTag from "../vendor/rosaenlgFilter/protectTag.js";
import type * as vendor_rosaenlgFilter_punctuation from "../vendor/rosaenlgFilter/punctuation.js";
import type * as vendor_rosaenlgFilter_titleCaseEnUs from "../vendor/rosaenlgFilter/titleCaseEnUs.js";
import type * as vendor_rosaenlgFilter_titlecase from "../vendor/rosaenlgFilter/titlecase.js";
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
  sessionTypes: typeof sessionTypes;
  templateHelpers: typeof templateHelpers;
  translation: typeof translation;
  users: typeof users;
  "vendor/frenchAdjectives/index": typeof vendor_frenchAdjectives_index;
  "vendor/frenchContractions/hmuet": typeof vendor_frenchContractions_hmuet;
  "vendor/frenchContractions/index": typeof vendor_frenchContractions_index;
  "vendor/frenchContractions/vowel": typeof vendor_frenchContractions_vowel;
  "vendor/frenchVerbs/index": typeof vendor_frenchVerbs_index;
  "vendor/frenchVerbsLefffTypes": typeof vendor_frenchVerbsLefffTypes;
  "vendor/pluralizeFr": typeof vendor_pluralizeFr;
  "vendor/rosaenlgCommons/Constants": typeof vendor_rosaenlgCommons_Constants;
  "vendor/rosaenlgCommons/DictManager": typeof vendor_rosaenlgCommons_DictManager;
  "vendor/rosaenlgCommons/LanguageCommon": typeof vendor_rosaenlgCommons_LanguageCommon;
  "vendor/rosaenlgCommons/LanguageCommonEnglish": typeof vendor_rosaenlgCommons_LanguageCommonEnglish;
  "vendor/rosaenlgCommons/LanguageCommonFrench": typeof vendor_rosaenlgCommons_LanguageCommonFrench;
  "vendor/rosaenlgCommons/LanguageCommonGerman": typeof vendor_rosaenlgCommons_LanguageCommonGerman;
  "vendor/rosaenlgCommons/LanguageCommonItalian": typeof vendor_rosaenlgCommons_LanguageCommonItalian;
  "vendor/rosaenlgCommons/LanguageCommonOther": typeof vendor_rosaenlgCommons_LanguageCommonOther;
  "vendor/rosaenlgCommons/LanguageCommonSpanish": typeof vendor_rosaenlgCommons_LanguageCommonSpanish;
  "vendor/rosaenlgCommons/index": typeof vendor_rosaenlgCommons_index;
  "vendor/rosaenlgFilter/LanguageFilter": typeof vendor_rosaenlgFilter_LanguageFilter;
  "vendor/rosaenlgFilter/LanguageFilterEnglish": typeof vendor_rosaenlgFilter_LanguageFilterEnglish;
  "vendor/rosaenlgFilter/LanguageFilterFrench": typeof vendor_rosaenlgFilter_LanguageFilterFrench;
  "vendor/rosaenlgFilter/LanguageFilterGerman": typeof vendor_rosaenlgFilter_LanguageFilterGerman;
  "vendor/rosaenlgFilter/LanguageFilterItalian": typeof vendor_rosaenlgFilter_LanguageFilterItalian;
  "vendor/rosaenlgFilter/LanguageFilterOther": typeof vendor_rosaenlgFilter_LanguageFilterOther;
  "vendor/rosaenlgFilter/LanguageFilterSpanish": typeof vendor_rosaenlgFilter_LanguageFilterSpanish;
  "vendor/rosaenlgFilter/clean": typeof vendor_rosaenlgFilter_clean;
  "vendor/rosaenlgFilter/html": typeof vendor_rosaenlgFilter_html;
  "vendor/rosaenlgFilter/index": typeof vendor_rosaenlgFilter_index;
  "vendor/rosaenlgFilter/languageFilterHelper": typeof vendor_rosaenlgFilter_languageFilterHelper;
  "vendor/rosaenlgFilter/protect": typeof vendor_rosaenlgFilter_protect;
  "vendor/rosaenlgFilter/protectTag": typeof vendor_rosaenlgFilter_protectTag;
  "vendor/rosaenlgFilter/punctuation": typeof vendor_rosaenlgFilter_punctuation;
  "vendor/rosaenlgFilter/titleCaseEnUs": typeof vendor_rosaenlgFilter_titleCaseEnUs;
  "vendor/rosaenlgFilter/titlecase": typeof vendor_rosaenlgFilter_titlecase;
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
