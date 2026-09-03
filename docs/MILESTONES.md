# Development milestones

## 01 — Workshop pilot

Commit `b339030`: passive-tracer engine, spherical globe, provenance-led historical case, contribution import/export, serif interface, workshop and dataset documentation. Pushed to private `origin/main` on 3 September 2026 UTC.

## 02 — Satellite observation archive

Six genuine NASA GIBS Terra/MODIS daily mosaics, 24–29 September 2024, rendered over the globe. Independent observation date, playback, scrubbing, opacity, source notes and downloadable SHA-256 manifest. One-frame prefetch and a fixed six-image cache; no solver changes or new runtime dependencies. Verify with `pnpm check`, `pnpm lint`, and `pnpm build` before pushing.

## Next bounded milestone

Milestone 03 adds approximate GPU cloud isolation, explicit missing-swath explanation, an independent spherical cloud shell, assumed-height and exaggeration controls, and an unambiguous tracer-height caption. Ground-level source imagery remains selectable. Real cloud mask/height retrievals and fully shared depth testing remain open tasks.

Add a regional geostationary cloud sequence with a precise acquisition-time catalogue, before attempting cloud-height products or terrain/bathymetry meshes. Preserve the distinctions between displayed acquisition time, model time, cloud appearance, and measured height. Introduce dynamic-resolution tiles when deeper zoom is addressed.

## Recording policy

Milestone 04 softens the approximate cloud mask, adds labelled visual dissolves between daily cloud frames, stops automatic playback at the archive end, and standardizes the interface on uppercase Franklin-style sans serif with three type sizes. The observation source and physical assumptions are unchanged.

The project lead requested incremental commits and pushes for coherent, verified milestones. Keep task lists and source notes in the same commit as the implementation. Push normally to the verified private remote; never force-push or publish a website as part of this workflow without separate authorization.
