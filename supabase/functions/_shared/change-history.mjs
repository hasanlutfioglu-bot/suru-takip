// Portable informational history, not an immutable security audit.
export function appendChangeHistory(before, after, actor, at, id) {
 if (!before) return;
 const logs = new Map([...(before.auditLog || []), ...(after.auditLog || [])].map(e => [e.id, e]));
 const changes = [];
 for (const entity of ['animals','records','tasks','ramCalendar']) {
  const a = new Map((before[entity] || []).map(x => [x.id, x]));
  const b = new Map((after[entity] || []).map(x => [x.id, x]));
  for (const key of new Set([...a.keys(), ...b.keys()])) {
   if (JSON.stringify(a.get(key)) !== JSON.stringify(b.get(key))) changes.push({entity, id:key, before:a.get(key) ?? null, after:b.get(key) ?? null});
  }
 }
 for (const key of ['farmName','lambPricePerKg','stock','stockUnits']) {
  if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) changes.push({entity:'settings', id:key, before:before[key] ?? null, after:after[key] ?? null});
 }
 if (changes.length) logs.set(id, {id, at, actor, changes:JSON.parse(JSON.stringify(changes))});
 if (logs.size) after.auditLog = [...logs.values()];
}
