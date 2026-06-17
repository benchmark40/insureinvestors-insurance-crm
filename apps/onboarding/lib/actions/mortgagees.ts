"use server";

/**
 * Mortgagee typeahead. Thin server wrapper over the shared reference list in
 * @insureinvestorsv2/lib so the ~290KB dataset stays out of the client bundle.
 */

import {
  searchMortgagees as searchMortgageesList,
  type MortgageeSuggestion,
} from "@insureinvestorsv2/lib/src/mortgagees";

export type { MortgageeSuggestion };

export async function searchMortgagees(
  query: string,
): Promise<MortgageeSuggestion[]> {
  return searchMortgageesList(query);
}
