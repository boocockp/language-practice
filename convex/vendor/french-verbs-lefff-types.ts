/**
 * @license
 * Copyright 2021 Ludan Stoecklé
 * SPDX-License-Identifier: Apache-2.0
 * Vendored type definitions from rosaenlg/packages/french-verbs-lefff (runtime uses local verb lookup).
 */

export type VerbInfoIndex = 'P' | 'S' | 'Y' | 'I' | 'G' | 'K' | 'J' | 'T' | 'F' | 'C' | 'W';

export interface VerbInfo {
  P?: (string | null)[];
  S?: (string | null)[];
  Y?: (string | null)[];
  I?: (string | null)[];
  G?: (string | null)[];
  K?: (string | null)[];
  J?: (string | null)[];
  T?: (string | null)[];
  F?: (string | null)[];
  C?: (string | null)[];
  W?: (string | null)[];
}
export type VerbsInfo = Record<string, VerbInfo>;
