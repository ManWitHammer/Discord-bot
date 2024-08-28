# Представляю вашему вниманию... Это... DYP
<h2>📜 Описание</h2>

DYP — это в шутку, созданный бот для Discord, разработанный для управления сервером, воспроизведения музыки, автоматизации задач и т.д.. Бот предоставляет удобные команды и интеграции для улучшения взаимодействия в вашем сообществе.
<h2>🚀 Основные возможности</h2>
<li>
    <b>Музыкальные команды:</b> Воспроизведение треков из SoundCloud, Spotify и Deezer!
</li>
<li>
    <b>Управление очередью:</b> Добавление и изменение с очередью треков.
</li>
<li>
    <b>Модерация:</b> Удаление сообщений, управление участниками, БАН и другое.
</li>
И многое другое, если мне не будет лень
<h2>📑 Требования</h2>
<li>Node.js версии 16.6.0 или выше</li>
<li>Discord API токен</li>
<li>Свой Mongo uri</li>
<h2>🛠️ Шаги по установке</h2>

1. Клонируйте репозиторий: (кто-то об этом не знал?)

```bash
git clone https://github.com/ManWitHammer/Discord-bot.git
```

2. Установите зависимости:

```bash
npm i
```

3. Настройте переменные окружения: Создайте файл .env в корне проекта и добавьте свой Discord API токен, prefix (С чего ваша команда начинается, к примеру ! или /) и mongo uri:

```env
TOKEN = Ваш Discord API токен
PREFIX = /
URI_MONGO = соответственно mongo uri
# Недавно добавил в 1.0.1 для уведомлений о начале стрима на твиче
TWITCH_CLIENT_ID=Ваш твич клиент ID. Найдёте через api twitch
TWITCH_CLIENT_SECRET=Найдёте через api twitch
```
4. Если у вас возникла проблема с получением mongo uri или вы не знаете что это такое, то уж простите, проще загуглить. Ну и последнее запустить бота:
```bash
node index.js
```
5. Если вы думали, что это все, то вы ошиблись.😈 Чтобы работал стриминговый сервис, такой как Spotify и Youtube, вам нужно будет...

6. Просто заглянуть на https://github.com/play-dl/play-dl/tree/main/instructions. Ведь именно эта библиотека влияет на стриминговые площадки.

<h2>🤝 Вклад</h2>
Мы приветствуем вклад сообщества! Если вы хотите внести изменения, добавьте новые функции или исправьте ошибки, пожалуйста, создайте Pull Request.

1. Форкните репозиторий
2. Создайте новую ветку: 
```bash
git checkout -b feature/YourFeature
```
3. Внесите свои изменения и закоммитьте: 
```bash
git commit -m 'Добавление новой функции'
```
4. Отправьте изменения: 
```bash
git push origin feature/YourFeature
```
5. Создайте Pull Request
<h2>Ненужная информация</h2>
Почему я назвал бота DYP? Ну, бот первоначально назывался Dox Yourself PlS и должен показывать айпи адрес пользователя, который вызвал команду, но потом понял, что это бред. И отказался от этой идеи. Позже я переименую бота, это точно.

Если вам не интересна создание своего бота и вы проста хотите добавить этого бота к себе на сервер, то <a href="https://discord.com/oauth2/authorize?client_id=1273943571925434379&permissions=8&integration_type=0&scope=bot">вот, пожалуйста, перейдите по мне</a>.
<h1>CHANGE LOG💾</h1>
<h2>1.0 (Первый релиз) 25/08/2024</h2>

1. Реализованы базовые функции бота, включая обработку команд.
2. Настроена базовая структура проекта с необходимыми директориями и файлами.
3. Доработана очередь для музыкальных композиция.
4. Добавлены команды связанные с предупреждениями.
5. Добавлен файл README.md

<h2>1.1 28/08/2024</h2>

1. Теперь вы можете подписываться на уведомления о начале стрима выбранного твич стрима введите команду "/sub :никнейм твич стримера :канал на котором будет приходить уведомления"
2. Добавлены ещё две команды связанные с уведомлениями. /getsub - получает список подписок на этом сервере и /unsub - отписывается от уведомлений
3. Доработан проигрыватель
4. Бот работает 24/7
