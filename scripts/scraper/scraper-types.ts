/**
 * Types used exclusively within the scraper script.
 * NOT exported to the main app — keep scraper concerns isolated.
 */

/** Raw wikitext string returned by Fandom MediaWiki API for a single Stand page */
export type RawWikitext = string;

/** MediaWiki API response for action=parse */
export interface WikiParseResponse {
  parse?: {
    title: string;
    wikitext: {
      "*": RawWikitext;
    };
  };
  error?: {
    code: string;
    info: string;
  };
}

/** MediaWiki API response for action=query&list=categorymembers */
export interface WikiCategoryResponse {
  query?: {
    categorymembers: Array<{
      pageid: number;
      ns: number;
      title: string;
    }>;
  };
  continue?: {
    cmcontinue: string;
    continue: string;
  };
  error?: {
    code: string;
    info: string;
  };
}

/** Parsed Stand data extracted from wikitext, before DB upsert */
export interface ParsedStand {
  name: string;
  type: string;                // from |powertype= or |type=
  ability_description: string | null;
  stats: {
    pow: string;   // raw letter grade or "None"
    spd: string;
    rng: string;
    dur: string;
    prc: string;
    dev: string;
  };
  weakness: string | null;
  user_name: string | null;    // from |user=
  part_number: number | null;  // from [[Category:Part N Stands]]
  source_url: string;
}
