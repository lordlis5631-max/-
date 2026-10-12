# Интерактивная карта ПФО

Мобильный сайт с интерактивной картой 14 субъектов Приволжского федерального округа.

- Адрес сайта после публикации: https://lordlis5631-max.github.io/-/
- Страница запуска: `index.html`
- Геометрия субъектов: `map-data.js`
- Названия, столицы, описания и ссылки: `regions.js`

## Как включить публичный сайт

1. Перейдите в **Settings → Pages** этого репозитория: https://github.com/lordlis5631-max/-/settings/pages
2. В **Build and deployment / Source** выберите **Deploy from a branch**.
3. В **Branch** укажите **main** и **/(root)**, затем **Save**.
4. После завершения публикации сайт откроется по https://lordlis5631-max.github.io/-/ .

Карта не требует сервера и внешних JavaScript-библиотек. Чтобы добавить материалы о регионах, достаточно изменить `description` и при необходимости `url` в файле `regions.js`.

Границы получены из [russian-geo-data](https://github.com/antibioticbook/russian-geo-data), лицензия CC0.
