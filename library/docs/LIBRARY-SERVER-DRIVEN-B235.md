# B235 — Server-driven Quran Library Structure

`library/categories.json` controls main sections and branches.
`library/topics/index.json` controls where each topic appears, its display order, title override, visibility and publication state.

No APK release is needed for:
- section/branch reorder through `order`
- adding or hiding a section/branch
- topic reorder through `displayOrder`
- moving a topic through `categoryId` / `subCategoryId`
- hiding/archiving/re-showing a topic
- display-title changes
- adding a new published topic JSON; the publisher discovers it automatically

Keep topic IDs stable when moving content so reading progress, favorites and last-position identity survive.

UI rule:
- section page: branches + direct topics only
- branch page: topics of that branch only
- global views (new/read/unread/popular/favorites) belong to Library Home and are never injected under a section.

Publisher validation rejects unknown categories, invalid subcategory routes, duplicate topic IDs, missing published files, bad asset hashes, and broken manifest/package references.
