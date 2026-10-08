const SECTION_IDS = ['aptitude', 'reasoning', 'verbal', 'general'];
const aliases = { 'verbal ability': 'verbal', english: 'verbal', 'logical reasoning': 'reasoning', quantitative: 'aptitude', 'quantitative aptitude': 'aptitude' };
function normalizeSection(value) {
  const section = String(value || '').trim().toLowerCase();
  return aliases[section] || section;
}
function inferQuestionSection(item = {}) {
  const text = [item.category, item.topic, ...(Array.isArray(item.tags) ? item.tags : [])].join(' ').toLowerCase();
  if (/reason|logical/.test(text)) return 'reasoning';
  if (/verbal|english|grammar|language|communication/.test(text)) return 'verbal';
  if (/aptitude|quantitative|arithmetic|numerical/.test(text)) return 'aptitude';
  return 'general';
}
module.exports = { SECTION_IDS, normalizeSection, inferQuestionSection };
