# Teacher groups 500 fix

Bu original CRM loyihasining source-only compact nusxasi. Zip ochilganda `src/` to‘g‘ridan-to‘g‘ri ko‘rinadi.

Tuzatishlar: Teacher → Mening guruhlarim frontend API’ga ulandi; backend query’da active group/enrollment count, courseName, room va PostgreSQL GROUP BY muammosi tuzatildi; Teacher DTO yangilandi.

Hajmni 2 MB dan kichik qilish uchun node_modules, dist, .git, build, katta demo rasmlar va pnpm-lock chiqarildi. Loyiha rootida `pnpm install` bajaring.
