/**
 * Tajweed Rule Parser
 * Converts tagged strings like "<tajweed class=rule>text</tajweed>" into segments for rendering.
 */

export interface TajweedSegment {
  text: string;
  rule: string | null; // null = plain text
}

// Industry-standard Tajweed colors adapted for Light/Parchment backgrounds
export const TAJWEED_COLORS_LIGHT: Record<string, string> = {
  ham_wasl:         '#AAAAAA', // Silent connecting hamza
  laam_shamsiyah:   '#AAAAAA', // Assimilated lam
  madda_normal:     '#537FFF', // 2 counts elongation
  madda_permissible:'#4050FF', // 2 or 4 counts
  madda_necessary:  '#000EBC', // 6 counts obligatory
  madda_obligatory: '#2144C1', // 4-5 counts
  qlq:              '#DD0008', // Qalqalah (Echo)
  ikhf:             '#9400A8', // Ikhfa (Hidden nun)
  ikhf_shfw:        '#D500B7', // Ikhfa Shafawi (Hidden meem)
  idghm_shfw:       '#58B800', // Idgham Shafawi (Merging meem)
  idgh_ghn:         '#169777', // Idgham with Ghunna
  idgh_w_ghn:       '#169777', // Idgham without Ghunna
  iqlb:             '#26BFFD', // Iqlab (Nun to meem)
  ghn:              '#FF7E1E', // Ghunna (Nasalization)
  slnt:             '#AAAAAA', // Silent letters
  qmr:              '#336666', // Lam Qamariyyah
  madda_replacd:    '#955E8A', // Replaced Madd
};

// Adapted colors for Dark Mode (#0d1a12 background) for high proximity visibility
export const TAJWEED_COLORS_DARK: Record<string, string> = {
  ham_wasl:         '#888888', 
  laam_shamsiyah:   '#888888',
  madda_normal:     '#7FA8FF', 
  madda_permissible:'#6B7AFF', 
  madda_necessary:  '#4D5CFF', 
  madda_obligatory: '#5277FF', 
  qlq:              '#FF6B6B', 
  ikhf:             '#E066FF', 
  ikhf_shfw:        '#FF80DF', 
  idghm_shfw:       '#8AFF8A', 
  idgh_ghn:         '#2ECC71', 
  idgh_w_ghn:       '#2ECC71', 
  iqlb:             '#71DFFF', 
  ghn:              '#FFAA33', 
  slnt:             '#888888', 
  qmr:              '#88CCCC', 
  madda_replacd:    '#C3A0CC',
};

export function getTajweedColor(rule: string, isDark: boolean, fallback: string): string {
  const palette = isDark ? TAJWEED_COLORS_DARK : TAJWEED_COLORS_LIGHT;
  return palette[rule] ?? fallback;
}

export function parseTajweedText(text: string): TajweedSegment[] {
  const segments: TajweedSegment[] = [];
  
  /**
   * Optimized Regex for Tajweed components:
   * 1. <tajweed class=RULE>TEXT</tajweed>
   * 2. <span class=end>...</span> (ends of ayahs, usually skip)
   * 3. Plain text
   */
  const regex = /<tajweed class=([a-z_]+)>([\s\S]*?)<\/tajweed>|<span[^>]*>[\s\S]*?<\/span>|([^<]+)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[1] && match[2]) {
      // Rule segment
      segments.push({ text: match[2], rule: match[1] });
    } else if (match[3]) {
      // Plain text
      // We don't trim here as whitespace is part of Quranic spacing
      segments.push({ text: match[3], rule: null });
    }
  }

  // Fallback if no tags were processed correctly
  if (segments.length === 0 && text.length > 0) {
    return [{ text, rule: null }];
  }

  return segments;
}
