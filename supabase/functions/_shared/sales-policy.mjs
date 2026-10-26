// Shared web/MCP sales rules. No network or storage access.
export function salePolicyError(state, ids, date) {
 if (!Array.isArray(ids) || !ids.length || new Set(ids).size !== ids.length) return 'invalid_animals';
 for (const id of ids) {
  const animal = state.animals.find(a => a.id === id);
  if (!animal || ['Satıldı','Öldü','Kesildi'].includes(animal.status) || animal.birth && date < animal.birth) return 'invalid_animal';
  if (animal.breedingReserve) return 'breeding_reserved';
  if (state.records.some(r => r.kind === 'health' && r.animalId === id && r.date <= date && r.withdrawalUntil && r.withdrawalUntil >= date)) return 'withdrawal_active';
 }
 return '';
}
