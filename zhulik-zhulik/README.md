# Жулик & Жулик — Wedding Demo v0.2

Второй демонстрационный кейс студии персональных интерактивных свадебных приглашений.

## Что внутри
- отдельный `weddingId`: `zhulik-zhulik`;
- luxury/editorial дизайн, отдельные desktop/mobile композиции;
- фото `he.png`, `she.png`, `we.png`;
- музыкальный контрол с `waltz2.mp3` без autoplay;
- scroll-анимации + `prefers-reduced-motion`;
- отдельная RSVP-форма Жуликов;
- сохранение/восстановление RSVP локально в браузере.

## Важно
На этапе v0.2 `rsvpEndpoint` намеренно пустой. Форма НЕ отправляется в живой backend свадьбы «Муся & Матусевич», потому что у Жуликов другой набор полей и допустимых значений. После утверждения дизайна backend расширяется конфигурацией по `weddingId`, затем endpoint включается в `config.js`.

## Запуск
Открыть `index.html`. Для корректной проверки в браузере удобнее запустить локальный HTTP-сервер, например `python -m http.server 8080` из папки проекта.


## v0.2 — Living decorative layer
- Living Botanicals in invitation, story and Dress Code.
- Petersburg Light on hero, bride and finale.
- Golden Thread glints on selected lines/timeline/sections.
- New animated Ж & Ж crest monogram.
- Living Photography on hero/finale and subtler portraits.
- Mobile effects intentionally reduced; prefers-reduced-motion disables decorative movement.
- RSVP/backend architecture and music interaction were not changed.
