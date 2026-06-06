/**
 * Safely escapes special regular expression characters in a string.
 * This prevents RegExp injection and Regular Expression Denial of Service (ReDoS) attacks.
 * 
 * @param {string} string - The input string to escape.
 * @returns {string} The escaped string safe to use in new RegExp().
 */
export function escapeRegExp(string) {
  if (typeof string !== "string") {
    return "";
  }
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default escapeRegExp;
