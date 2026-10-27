# Family placement and rapid finishing approvals — 21.9.7

Removed two secondary scene rules that caused unexpected movement: a group name containing Besi no longer marks an animal as approved for finishing, and weaning no longer removes an otherwise unapproved lamb from its recorded dam's area. Only explicit dated finishing transition notes determine membership. Mother links are still validated against active recorded dams; no relationships are invented.

The approval modal stays open. A successful click removes just that pending row, updates counts and preserves the next row/button, allowing successive approvals without navigation or rebuilding the list. Failed writes keep the row available. The confirmed section supports an explicit removal from finishing, recorded as a new finishing_end note. Latest transition date/timestamp determines membership, including after reload; existing records and groups are retained.

Finishing event validity now rejects transitions undone by a later removal, so stale queued animations cannot misleadingly show a reversed move. Tests cover shared Besi groups on dam and young lamb, weaning, sequential stable-row approvals, an in-place reversal back to the dam, and persistence across reload. Existing tests now use explicit transition fixtures rather than group-name inference. No production Supabase data accessed or altered.
