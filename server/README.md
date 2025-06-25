# Vencord Yandex OAuth Server

HTTP сервер для обработки авторизации через Yandex OAuth для плагина Vencord Yandex Music.

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
cd server
npm install
```

### 2. Настройка Yandex OAuth приложения

1. Перейдите в [Yandex OAuth Console](https://oauth.yandex.ru/client/new)
2. Создайте новое приложение
3. Заполните поля:
    - **Название**: Vencord Yandex Music
    - **Описание**: Плагин для Discord с интеграцией Yandex Music
    - **Платформы**: Выберите "Веб-сервисы"
4. Настройте права доступа:
    - `login:info` - для получения информации о пользователе
    - `login:email` - для получения email (опционально)
5. Укажите **Redirect URI**: `http://localhost:3000/oauth/callback`
6. Скопируйте **Client ID** - он понадобится для настройки плагина

### 3. Конфигурация (опционально)

Создайте файл `.env` в папке `server`:

```env
PORT=3000
YANDEX_CLIENT_SECRET=ваш_client_secret_если_есть
NODE_ENV=development
```

### 4. Запуск сервера

```bash
# Обычный запуск
npm start

# Запуск в режиме разработки (с автоперезагрузкой)
npm run dev
```

Сервер будет доступен по адресу: http://localhost:3000

## 🔧 Настройка плагина Vencord

1. Откройте настройки Vencord
2. Найдите плагин "Yandex Music"
3. Введите полученный **Client ID** в поле "Yandex OAuth Client ID"
4. Измените "Redirect URI" на: `http://localhost:3000/oauth/callback`
5. Сохраните настройки

## 📡 API Endpoints

### GET /

Главная страница с информацией о сервере и инструкциями по настройке.

### GET /oauth/authorize

Инициация процесса OAuth авторизации.

**Параметры запроса:**

-   `client_id` (обязательный) - Client ID вашего Yandex OAuth приложения
-   `redirect_uri` (опциональный) - URI для перенаправления после авторизации

**Пример:**

```
http://localhost:3000/oauth/authorize?client_id=YOUR_CLIENT_ID
```

### GET /oauth/callback

Endpoint для обработки колбэка от Yandex OAuth.

### GET /api/user

Получение информации о пользователе по токену.

**Headers:**

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## 🔒 Безопасность

-   Используется state параметр для защиты от CSRF атак
-   Сессии автоматически очищаются через 5 минут
-   Токены передаются только через HTTPS (в продакшене)

## 🛠 Интеграция с плагином

Плагин должен:

1. Открыть окно авторизации:

```javascript
const authWindow = window.open(
    `http://localhost:3000/oauth/authorize?client_id=${clientId}`,
    "yandexAuth",
    "width=600,height=700"
);
```

2. Слушать сообщения от сервера:

```javascript
window.addEventListener("message", (event) => {
    if (event.data.type === "YANDEX_OAUTH_SUCCESS") {
        const token = event.data.token;
        const user = event.data.user;
        // Сохранить токен и обновить UI
    }
});
```

## 🐛 Отладка

Сервер выводит подробные логи в консоль:

-   🔄 Перенаправления на Yandex OAuth
-   📥 Получение колбэков
-   ✅ Успешные авторизации
-   ❌ Ошибки

## ⚠️ Ограничения

-   Сервер работает только локально (localhost)
-   Для продакшена требуется HTTPS
-   Client Secret не обязателен для некоторых типов приложений

## 📞 Поддержка

При возникновении проблем:

1. Проверьте консоль сервера на наличие ошибок
2. Убедитесь, что Client ID указан правильно
3. Проверьте, что Redirect URI в настройках Yandex OAuth соответствует `http://localhost:3000/oauth/callback`
