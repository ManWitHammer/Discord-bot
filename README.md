# Представляю вашему вниманию... Это... DOX YOURSEF PLS
<h2>📜 Описание</h2>

DOX YOURSEF PLS — это в шутку, созданный бот для Discord, разработанный для управления сервером, воспроизведения музыки, автоматизации задач и т.д.. Бот предоставляет удобные команды и интеграции для улучшения взаимодействия в вашем сообществе.
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
Если вам не интересна создание своего бота и вы проста хотите этого бота к себе на сервер, то <a href="https://discord.com/oauth2/authorize?client_id=1273943571925434379&permissions=8&integration_type=0&scope=bot">вот, пожалуйста, перейдите по мне</a>.
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
```
4. Если у вас возникла проблема с получением mongo uri или вы не знаете что это такое, то уж простите, проще загуглить. Ну и последнее запустить бота:
```bash
node index.js
```
Вы не уверены, бот работает или нет, то снизу вам должно будет написать вам о боте
![alt text](image.png)

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
Почему я назвал бота Dox Yourself pls? Ну, бот первоначально должен показывать айпи адрес пользователя, который вызвал команду, но потом понял, что это бред. И отказался от этой идеи. Позже я переименую бота, это точно.