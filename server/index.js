const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Конфигурация Yandex OAuth
const YANDEX_CLIENT_ID =
    process.env.YANDEX_CLIENT_ID || "eb39cd2450494ff08aff16d3346725a6";
const YANDEX_CLIENT_SECRET = process.env.YANDEX_CLIENT_SECRET;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статичные файлы
app.use(express.static(path.join(__dirname, "public")));

// Хранение активных сессий OAuth
const sessions = new Map();

// Генерация случайного state для CSRF защиты
function generateState() {
    return (
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
    );
}

// Главная страница
app.get("/", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Vencord Yandex OAuth Server</title>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; background: #2c2f33; color: white; }
                .container { max-width: 600px; margin: 0 auto; }
                .status { padding: 20px; background: #40444b; border-radius: 8px; margin: 20px 0; }
                .auth-button {
                    background: #ff3333;
                    color: white;
                    padding: 12px 24px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 16px;
                    text-decoration: none;
                    display: inline-block;
                }
                .auth-button:hover { background: #cc0000; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎵 Vencord Yandex Music OAuth Server</h1>
                <div class="status">
                    <p>Сервер запущен и готов к обработке OAuth запросов</p>
                    <p>Порт: ${PORT}</p>
                    <p>Время запуска: ${new Date().toLocaleString("ru-RU")}</p>
                </div>
                <div class="status">
                    <h3>Текущая конфигурация</h3>
                    <p><strong>Client ID:</strong> <code>${YANDEX_CLIENT_ID}</code></p>
                    <p><strong>Client Secret:</strong> ${
                        YANDEX_CLIENT_SECRET
                            ? "✅ Настроен"
                            : "❌ Не настроен (публичное приложение)"
                    }</p>
                    <p><strong>Redirect URI:</strong> <code>http://localhost:${PORT}/oauth/callback</code></p>
                </div>
                <div class="status">
                    <h3>⚠️ Проблема с текущим Client ID</h3>
                    <p style="color: #ff6b6b;">Текущий Client ID создан как <strong>конфиденциальное приложение</strong> и требует Client Secret.</p>
                    <p><strong>Решение:</strong> Создайте новое <strong>публичное приложение</strong>:</p>
                </div>
                <div class="status">
                    <h3>🔧 Создание публичного приложения</h3>
                    <p>1. Перейдите в <a href="https://oauth.yandex.ru/client/new" target="_blank" style="color: #ff3333;">Yandex OAuth Console</a></p>
                    <p>2. Создайте новое приложение:</p>
                    <p>• <strong>Название:</strong> Vencord Yandex Music Public</p>
                    <p>• <strong>Платформа:</strong> <span style="background: #4CAF50; color: white; padding: 2px 6px; border-radius: 3px;">📱 Мобильное приложение</span></p>
                    <p>• <strong>Package name:</strong> <code>com.vencord.yandexmusic</code></p>
                    <p>• <strong>Redirect URI:</strong> <code>http://localhost:${PORT}/oauth/callback</code></p>
                    <p>• <strong>Права доступа:</strong> <code>login:info</code>, <code>login:email</code></p>
                    <p>3. Скопируйте новый Client ID и обновите файл <code>.env</code></p>
                </div>
                <div class="status">
                    <h3>🔄 Альтернативный способ</h3>
                    <p>Если у вас есть Client Secret для текущего приложения:</p>
                    <p>1. Создайте файл <code>.env</code> в папке server</p>
                    <p>2. Добавьте: <code>YANDEX_CLIENT_SECRET=ваш_client_secret</code></p>
                    <p>3. Перезапустите сервер</p>
                </div>
                <div class="status">
                    <h3>Смена Client ID</h3>
                    <p>Для использования собственного Client ID:</p>
                    <p>1. Создайте файл <code>.env</code></p>
                    <p>2. Добавьте: <code>YANDEX_CLIENT_ID=ваш_client_id</code></p>
                    <p>3. Перезапустите сервер</p>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Инициация OAuth авторизации
app.get("/oauth/authorize", (req, res) => {
    // Используем встроенный Client ID
    const client_id = YANDEX_CLIENT_ID;
    const redirect_uri = `http://localhost:${PORT}/oauth/callback`;

    console.log(`🆔 Используя Client ID: ${client_id}`);

    // Генерируем state для защиты от CSRF
    const state = generateState();
    sessions.set(state, {
        client_id,
        redirect_uri,
        timestamp: Date.now(),
    });

    // Формируем URL для авторизации в Yandex
    const yandexAuthUrl = new URL("https://oauth.yandex.ru/authorize");
    yandexAuthUrl.searchParams.set("response_type", "code");
    yandexAuthUrl.searchParams.set("client_id", client_id);
    yandexAuthUrl.searchParams.set("redirect_uri", redirect_uri);
    yandexAuthUrl.searchParams.set("state", state);
    yandexAuthUrl.searchParams.set("force_confirm", "yes");

    console.log(
        "🔄 Перенаправление на Yandex OAuth:",
        yandexAuthUrl.toString()
    );

    // Перенаправляем пользователя на Yandex OAuth
    res.redirect(yandexAuthUrl.toString());
});

// Обработка колбэка от Yandex OAuth
app.get("/oauth/callback", async (req, res) => {
    const { code, state, error } = req.query;

    console.log("📥 Получен OAuth колбэк:", { code: !!code, state, error });

    if (error) {
        console.error("❌ Ошибка авторизации:", error);
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Ошибка авторизации</title>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; background: #2c2f33; color: white; text-align: center; }
                    .error { background: #ff4444; padding: 20px; border-radius: 8px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <h1>❌ Ошибка авторизации</h1>
                <div class="error">
                    <p>Произошла ошибка: ${error}</p>
                    <p>Попробуйте авторизоваться заново</p>
                </div>
                <script>
                    setTimeout(() => window.close(), 5000);
                </script>
            </body>
            </html>
        `);
    }

    if (!code || !state) {
        return res.status(400).send("Отсутствует код авторизации или state");
    }

    // Проверяем state
    const session = sessions.get(state);
    if (!session) {
        console.error("❌ Недействительный state:", state);
        return res.status(400).send("Недействительный state");
    }

    try {
        // Подготавливаем параметры для обмена кода на токен
        const tokenParams = {
            grant_type: "authorization_code",
            code: code,
            client_id: session.client_id,
        };

        // Добавляем client_secret только если он указан (для конфиденциальных приложений)
        if (YANDEX_CLIENT_SECRET && YANDEX_CLIENT_SECRET.trim()) {
            tokenParams.client_secret = YANDEX_CLIENT_SECRET;
            console.log(
                "🔐 Использую Client Secret для конфиденциального приложения"
            );
        } else {
            console.log(
                "🔓 Работаю как публичное приложение (без Client Secret)"
            );
        }

        // Обмениваем код на токен
        const tokenResponse = await fetch("https://oauth.yandex.ru/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(tokenParams),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error("❌ Ошибка получения токена:", tokenData);
            throw new Error(tokenData.error_description || tokenData.error);
        }

        console.log("✅ Токен получен успешно");

        // Получаем информацию о пользователе
        const userResponse = await fetch("https://login.yandex.ru/info", {
            headers: {
                Authorization: `OAuth ${tokenData.access_token}`,
            },
        });

        const userData = await userResponse.json();
        console.log("👤 Информация о пользователе:", userData.login);

        // Очищаем сессию
        sessions.delete(state);

        // Отправляем результат авторизации
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Авторизация завершена</title>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; background: #2c2f33; color: white; text-align: center; }
                    .success { background: #4CAF50; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .token { background: #40444b; padding: 15px; border-radius: 6px; margin: 20px 0; word-break: break-all; }
                </style>
            </head>
            <body>
                <h1>✅ Авторизация завершена успешно!</h1>
                <div class="success">
                    <p>Добро пожаловать, ${
                        userData.real_name || userData.login
                    }!</p>
                    <p>Токен доступа получен и готов к использованию.</p>
                </div>
                <div class="token">
                    <h3>🔑 Токен доступа:</h3>
                    <textarea readonly style="
                        width: 100%;
                        height: 100px;
                        padding: 10px;
                        border: 1px solid #555;
                        border-radius: 4px;
                        background: #2f3136;
                        color: white;
                        font-family: monospace;
                        font-size: 12px;
                        resize: none;
                        white-space: nowrap;
                        overflow: auto;
                    " onclick="this.select(); document.execCommand('copy'); alert('Токен скопирован!');">${
                        tokenData.access_token
                    }</textarea>
                    <small>👆 Нажмите на токен чтобы скопировать его</small>
                    <br><br>
                    <div style="background: #4CAF50; padding: 15px; border-radius: 6px; margin: 15px 0;">
                        <h4 style="margin: 0 0 10px 0;">📋 Инструкция для Discord:</h4>
                        <p style="margin: 0; font-size: 14px;">
                            1. Скопируйте токен выше (нажав на него)<br>
                            2. Вернитесь в Discord<br>
                            3. Нажмите "Ввести токен вручную" в виджете плагина<br>
                            4. Вставьте токен и нажмите "Сохранить"
                        </p>
                    </div>
                </div>
                <script>
                    // Отправляем токен обратно в плагин
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'YANDEX_OAUTH_SUCCESS',
                            token: '${tokenData.access_token}',
                            user: ${JSON.stringify(userData)}
                        }, '*');
                        window.close();
                    } else {
                        // Если окно не было открыто через плагин, просто показываем токен
                        setTimeout(() => window.close(), 30000);
                    }
                </script>
            </body>
            </html>
        `);
    } catch (error) {
        console.error("❌ Ошибка при обработке OAuth:", error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Ошибка сервера</title>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; background: #2c2f33; color: white; text-align: center; }
                    .error { background: #ff4444; padding: 20px; border-radius: 8px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <h1>❌ Ошибка сервера</h1>
                <div class="error">
                    <p>Произошла ошибка при обработке авторизации:</p>
                    <p>${error.message}</p>
                </div>
                <script>
                    setTimeout(() => window.close(), 5000);
                </script>
            </body>
            </html>
        `);
    }
});

// API для получения информации о пользователе
app.get("/api/user", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
        return res.status(401).json({ error: "Токен не предоставлен" });
    }

    try {
        const response = await fetch("https://login.yandex.ru/info", {
            headers: {
                Authorization: `OAuth ${token}`,
            },
        });

        const userData = await response.json();

        if (userData.error) {
            return res.status(401).json({ error: "Недействительный токен" });
        }

        res.json(userData);
    } catch (error) {
        console.error("Ошибка при получении информации о пользователе:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// Очистка старых сессий (каждые 5 минут)
setInterval(() => {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    for (const [state, session] of sessions) {
        if (now - session.timestamp > fiveMinutes) {
            sessions.delete(state);
            console.log("🧹 Удалена устаревшая сессия:", state);
        }
    }
}, 5 * 60 * 1000);

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error("💥 Необработанная ошибка:", err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Yandex OAuth сервер запущен на http://localhost:${PORT}`);
    console.log(
        `📋 Используйте Redirect URI: http://localhost:${PORT}/oauth/callback`
    );
    console.log(
        `🎵 Готов к обработке OAuth запросов для Vencord Yandex Music плагина`
    );
});
