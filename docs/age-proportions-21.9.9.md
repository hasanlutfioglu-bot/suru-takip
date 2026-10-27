# Age-proportional animal sizes — 21.9.9

Independent packing factors previously made a crowded finishing lamb smaller than a newborn in a sparse family area. The scene now calculates one shared density factor for all zones. Changing pen membership or crowding cannot reverse the relative sizes of different-age lambs.

A lamb's visual body scale is interpolated continuously from its recorded calendar age: birth 0.36, one month 0.44, three months 0.62, six months 0.78, nine months 0.86 and twelve months/adult cap 0.88. Calendar age includes month-end clamping and fractional progress to the next monthly anniversary. These are illustration choices, not measured dimensions, bodyweight predictions or veterinary growth standards. Missing/future birth dates use a neutral visual fallback and never invent an age. Mature ewe and ram types retain adult silhouette sizes.

Family cell geometry accounts for each member's age-based size. Main and expanded scenes use identical ratios. Saved-event subjects retain birth dates and transition origins retain scale; weighing, finishing and sales actors follow scene proportions. Size is part of the render key so date edits and day changes update the artwork.

Tests verify increasing age/size, equal-age animals across different zones, density and move invariance, month-end age calculations, real browser apparent width, expanded view and unchanged animal/weight/financial data. No live Supabase data accessed or changed.
