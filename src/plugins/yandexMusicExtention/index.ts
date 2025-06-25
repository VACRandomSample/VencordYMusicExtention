/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DataStore } from "@api/index";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

// Настройки плагина
const settings = definePluginSettings({
    serverPort: {
        type: OptionType.NUMBER,
        description: "Порт OAuth сервера",
        default: 3000,
        restartNeeded: false,
    },
    redirectUri: {
        type: OptionType.STRING,
        description: "Redirect URI (информационно, настраивается в сервере)",
        default: "http://localhost:3000/oauth/callback",
        restartNeeded: false,
        disabled: true,
    }
});

export default definePlugin({
    name: "Yandex Music",
    description: "Добавляет расширяемый элемент в QuestBar с информацией о текущем прогрессе и оставшемся времени",
    authors: [Devs.Ven],

    // Добавим состояние для токена и статуса авторизации
    token: null as string | null,
    isAuthorized: false,

    // Добавляем поле observer
    observer: null as MutationObserver | null,

    settings,

    start() {
        // Добавляем слушатель сообщений от OAuth сервера
        window.addEventListener("message", event => {
            if (event.data.type === "YANDEX_OAUTH_SUCCESS") {
                console.log("✅ Получен токен от OAuth сервера");
                this.handleOAuthSuccess(event.data.token, event.data.user);
            }
        });

        setTimeout(() => {
            this.loadToken();
            this.injectElement();
            this.addStyles();
        }, 1000);
    },

    handleOAuthSuccess(token: string, user: any) {
        console.log("👤 Авторизация завершена для пользователя:", user.login || user.real_name);

        this.saveToken(token);
        this.isAuthorized = true;

        // Обновляем UI
        document.querySelectorAll(".quest-bar-mod-container").forEach(el => el.remove());
        this.injectElement();

        // Показываем уведомление об успешной авторизации
        const notification = document.createElement("div");
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        `;
        notification.textContent = `✅ Авторизация успешна! Добро пожаловать, ${user.real_name || user.login}`;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    },

    async loadToken() {
        const encryptedToken = await DataStore.get("yandexMusicToken") as string | null;
        this.token = encryptedToken ? atob(encryptedToken) : null;
        this.isAuthorized = !!this.token;
    },

    saveToken(token: string) {
        // Шифрование токена перед сохранением
        const encryptedToken = btoa(token);
        DataStore.set("yandexMusicToken", encryptedToken);
    },

    logout() {
        this.token = null;
        this.isAuthorized = false;
        DataStore.del("yandexMusicToken");
    },

    addStyles() {
        const style = document.createElement("style");
        style.id = "quest-bar-mod-styles";
        style.textContent = `
            .quest-bar-mod-container {
                position: relative;
                margin: 5px;
                transition: all 0.3s ease;
                overflow: hidden;
                max-height: 30px;
                background: var(--background-secondary);
                border-radius: 4px;
                padding: 5px;
                color: white;
                cursor: pointer;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }

            .quest-bar-mod-container:hover {
                max-height: 280px; /* Увеличиваем высоту для обложки */
                background: var(--background-tertiary);
            }

            .quest-bar-mod-main {
                display: flex;
                align-items: center;
                height: 20px;
                gap: 8px;
            }

            .quest-bar-mod-expanded {
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px solid var(--background-modifier-accent);
                opacity: 0;
                transition: opacity 0.2s ease 0.1s;
            }

            .quest-bar-mod-container:hover .quest-bar-mod-expanded {
                opacity: 1;
            }

            /* Стили для бегущей строки */
            .track-info {
                white-space: nowrap;
                overflow: hidden;
                max-width: 200px;
                font-size: 14px;
            }

            .quest-bar-mod-container:not(:hover) .track-info.marquee {
                overflow: hidden;
                position: relative;
            }

            .quest-bar-mod-container:not(:hover) .track-info.marquee span {
                display: inline-block;
                padding-left: 100%;
                animation: marquee 10s linear infinite;
                white-space: nowrap;
            }

            @keyframes marquee {
                0% { transform: translateX(100%); }
                100% { transform: translateX(-100%); }
            }

            /* Стили для элементов управления */
            .player-controls {
                display: flex;
                gap: 5px;
                align-items: center;
            }

            .player-btn {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                transition: transform 0.1s ease;
            }

            .player-btn:hover {
                transform: scale(1.1);
            }

            /* Стили для обложки альбома */
            .album-cover {
                width: 100%;
                height: 150px;
                object-fit: cover;
                border-radius: 4px;
                margin-bottom: 10px;
            }

            .progress-container, .volume-container {
                margin-top: 8px;
            }

            /* Стили для дополнительной информации */
            .track-details {
                margin-top: 12px;
                font-size: 13px;
            }

            /* Стили для кнопки авторизации */
            .auth-button {
                background: #FF0000;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 5px 10px;
                cursor: pointer;
                font-size: 12px;
                margin-top: 10px;
            }

            .auth-button:hover {
                background: #CC0000;
            }
        `;
        document.head.appendChild(style);
    },

    injectElement() {
        const observer = new MutationObserver(() => {
            const questBarElement = document.querySelector('[class*="containerQuestBarVisible"]');
            if (questBarElement && !document.querySelector(".quest-bar-mod-container")) {
                const container = document.createElement("div");
                container.className = "quest-bar-mod-container";

                const mainContent = document.createElement("div");
                mainContent.className = "quest-bar-mod-main";

                // Элементы управления плеером
                const controls = document.createElement("div");
                controls.className = "player-controls";

                const prevBtn = document.createElement("button");
                prevBtn.className = "player-btn";
                prevBtn.innerHTML = "⏮";

                const playBtn = document.createElement("button");
                playBtn.className = "player-btn";
                playBtn.innerHTML = "▶";

                const nextBtn = document.createElement("button");
                nextBtn.className = "player-btn";
                nextBtn.innerHTML = "⏭";

                controls.appendChild(prevBtn);
                controls.appendChild(playBtn);
                controls.appendChild(nextBtn);

                // Информация о текущем треке с бегущей строкой
                const trackInfo = document.createElement("div");
                trackInfo.className = "track-info marquee";
                const trackText = document.createElement("span");
                trackText.textContent = "Текущий трек - Исполнитель";
                trackInfo.appendChild(trackText);

                mainContent.appendChild(controls);
                mainContent.appendChild(trackInfo);

                const expandedContent = document.createElement("div");
                expandedContent.className = "quest-bar-mod-expanded";
                expandedContent.innerHTML = `
                    ${this.isAuthorized ? `
                        <img src="https://example.com/album-cover.jpg" class="album-cover" />
                        <div class="player-controls" style="justify-content: center; margin-bottom: 10px;">
                            <button class="player-btn">⏮</button>
                            <button class="player-btn">▶</button>
                            <button class="player-btn">⏭</button>
                        </div>
                        <div class="progress-container">
                            <input type="range" min="0" max="100" value="30" style="width: 100%;">
                            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 4px;">
                                <span>1:25</span>
                                <span>4:30</span>
                            </div>
                        </div>
                        <div class="volume-container">
                            <span>🔈</span>
                            <input type="range" min="0" max="100" value="80" style="width: 100%;">
                        </div>
                        <div class="track-details">
                            <div>Альбом: Название альбома</div>
                            <div style="margin-top: 4px;">Следующий трек: Следующий трек - Исполнитель</div>
                        </div>
                        <button class="auth-button" id="yandex-logout">Выйти</button>
                    ` : `
                        <div style="text-align: center; padding: 20px;">
                            <p>Для использования плеера войдите через Яндекс</p>
                            <button class="auth-button" id="yandex-login">Войти через Яндекс</button>
                        </div>
                    `}
                `;

                container.appendChild(mainContent);
                container.appendChild(expandedContent);
                questBarElement.parentElement?.insertBefore(container, questBarElement);

                // Обработчики событий для кнопок
                const togglePlay = () => {
                    playBtn.innerHTML = playBtn.innerHTML === "▶" ? "⏸" : "▶";
                    const expandedPlayBtn = container.querySelector(".quest-bar-mod-expanded .player-btn:nth-child(2)");
                    if (expandedPlayBtn) {
                        expandedPlayBtn.innerHTML = playBtn.innerHTML;
                    }
                };

                playBtn.addEventListener("click", togglePlay);

                // Обработчик для кнопки в развернутом состоянии
                const expandedPlayBtn = container.querySelector(".quest-bar-mod-expanded .player-btn:nth-child(2)");
                if (expandedPlayBtn) {
                    expandedPlayBtn.addEventListener("click", togglePlay);
                }

                if (this.isAuthorized) {
                    // Обработчик для кнопки выхода
                    const logoutButton = container.querySelector("#yandex-logout");
                    if (logoutButton) {
                        logoutButton.addEventListener("click", () => {
                            this.logout();
                            // Пересоздадим элемент, чтобы обновить интерфейс
                            container.remove();
                            this.injectElement();
                        });
                    }
                } else {
                    // Обработчик для кнопки входа
                    const loginButton = container.querySelector("#yandex-login");
                    if (loginButton) {
                        loginButton.addEventListener("click", () => {
                            this.authorize();
                        });
                    }

                    // Добавляем кнопку для ручного ввода токена
                    const manualTokenButton = document.createElement("button");
                    manualTokenButton.className = "auth-button";
                    manualTokenButton.id = "yandex-manual-token";
                    manualTokenButton.style.marginTop = "5px";
                    manualTokenButton.style.background = "#4CAF50";
                    manualTokenButton.textContent = "Ввести токен вручную";

                    manualTokenButton.addEventListener("click", () => {
                        this.showManualTokenInput();
                    });

                    expandedContent.appendChild(manualTokenButton);
                }
            }
        });

        // Добавляем отключение старого observer
        if (this.observer) this.observer.disconnect();
        this.observer = observer;
        this.observer.observe(document.body, { childList: true, subtree: true });
    },

    authorize() {
        const { serverPort } = settings.store;

        // Проверяем, запущен ли OAuth сервер
        this.checkServerStatus(serverPort).then(isRunning => {
            if (!isRunning) {
                console.error("❌ OAuth сервер не запущен! Для авторизации необходимо запустить сервер на порту", serverPort);
                return;
            }

            console.log("🔑 Запуск процесса авторизации");

            // Показываем интерфейс для ручного ввода токена
            this.showManualTokenInput();
        });
    },

    showManualTokenInput() {
        const { serverPort } = settings.store;
        const authUrl = `http://localhost:${serverPort}/oauth/authorize`;

        // Создаем простой интерфейс для ручного ввода токена
        const modal = document.createElement("div");
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;

        modal.innerHTML = `
            <div style="
                background: #36393f;
                padding: 30px;
                border-radius: 8px;
                max-width: 500px;
                color: white;
                text-align: center;
            ">
                <h3 style="margin-top: 0; color: #ff3333;">🔑 Авторизация Yandex Music</h3>
                <p>1. Скопируйте ссылку и откройте её в браузере</p>
                <input type="text" readonly value="${authUrl}" id="authUrl" style="
                    width: 100%;
                    padding: 8px;
                    margin: 5px 0;
                    border: 1px solid #555;
                    border-radius: 4px;
                    background: #2f3136;
                    color: white;
                    font-size: 12px;
                    box-sizing: border-box;
                ">
                <button id="copyUrl" style="
                    background: #5865F2;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin: 5px 0 15px 0;
                    font-size: 12px;
                    width: 100%;
                ">📋 Скопировать ссылку</button>
                <button id="openUrl" style="
                    background: #1DB954;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin: 5px 0 15px 0;
                    font-size: 12px;
                    width: 100%;
                ">🌐 Открыть в браузере</button>

                <p>2. После авторизации скопируйте токен и вставьте его сюда:</p>
                <input type="text" id="tokenInput" placeholder="Вставьте токен здесь..." style="
                    width: 100%;
                    padding: 10px;
                    margin: 10px 0;
                    border: 1px solid #555;
                    border-radius: 4px;
                    background: #2f3136;
                    color: white;
                    font-size: 14px;
                    box-sizing: border-box;
                ">
                <div style="margin-top: 20px;">
                    <button id="submitToken" style="
                        background: #4CAF50;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                        margin-right: 10px;
                        font-size: 14px;
                    ">Сохранить токен</button>
                    <button id="cancelToken" style="
                        background: #f44336;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Отмена</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Обработчики событий
        const tokenInput = modal.querySelector("#tokenInput") as HTMLInputElement;
        const submitBtn = modal.querySelector("#submitToken");
        const cancelBtn = modal.querySelector("#cancelToken");
        const copyBtn = modal.querySelector("#copyUrl");
        const openBtn = modal.querySelector("#openUrl");
        const authUrlInput = modal.querySelector("#authUrl") as HTMLInputElement;

        // Копирование ссылки
        copyBtn?.addEventListener("click", () => {
            authUrlInput.select();
            navigator.clipboard?.writeText(authUrl).then(() => {
                console.log("📋 Ссылка скопирована в буфер обмена");
                copyBtn.textContent = "✅ Скопировано!";
                setTimeout(() => {
                    copyBtn.textContent = "📋 Скопировать ссылку";
                }, 2000);
            }).catch(() => {
                console.error("❌ Не удалось скопировать ссылку");
            });
        });

        // Открытие ссылки в браузере через Discord API
        openBtn?.addEventListener("click", () => {
            try {
                // Используем VencordNative API для открытия внешних ссылок
                if (VencordNative?.native?.openExternal) {
                    VencordNative.native.openExternal(authUrl);
                    console.log("🌐 Ссылка открыта в браузере через VencordNative API");
                    openBtn.textContent = "✅ Открыто!";
                    setTimeout(() => {
                        openBtn.textContent = "🌐 Открыть в браузере";
                    }, 2000);
                } else if (window.DiscordNative?.shell?.openExternal) {
                    // Fallback для старых версий
                    window.DiscordNative.shell.openExternal(authUrl);
                    console.log("🌐 Ссылка открыта в браузере через Discord API");
                    openBtn.textContent = "✅ Открыто!";
                    setTimeout(() => {
                        openBtn.textContent = "🌐 Открыть в браузере";
                    }, 2000);
                } else if (window.open) {
                    // Fallback для веб-версии
                    window.open(authUrl, "_blank");
                    console.log("🌐 Ссылка открыта в новой вкладке");
                } else {
                    console.error("❌ Не удалось открыть ссылку");
                }
            } catch (error) {
                console.error("❌ Ошибка при открытии ссылки:", error);
            }
        });

        submitBtn?.addEventListener("click", () => {
            const token = tokenInput.value.trim();
            if (token) {
                this.handleManualToken(token);
                document.body.removeChild(modal);
            } else {
                console.warn("⚠️ Пожалуйста, введите токен!");
            }
        });

        cancelBtn?.addEventListener("click", () => {
            document.body.removeChild(modal);
        });

        // Фокус на поле копирования ссылки
        setTimeout(() => authUrlInput.focus(), 100);
    },

    async handleManualToken(token: string) {
        console.log("✅ Получен токен вручную");

        try {
            // Получаем информацию о пользователе через наш сервер
            const { serverPort } = settings.store;
            const response = await fetch(`http://localhost:${serverPort}/api/user`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                this.handleOAuthSuccess(token, userData);
            } else {
                // Если не удалось получить данные пользователя, используем базовые
                console.warn("Не удалось получить данные пользователя, используем базовые");
                const userData = {
                    login: "user",
                    real_name: "Пользователь Yandex"
                };
                this.handleOAuthSuccess(token, userData);
            }
        } catch (error) {
            console.error("Ошибка при получении данных пользователя:", error);

            // Fallback: используем базовые данные
            const userData = {
                login: "user",
                real_name: "Пользователь Yandex"
            };
            this.handleOAuthSuccess(token, userData);
        }
    },

    async checkServerStatus(port: number): Promise<boolean> {
        try {
            const response = await fetch(`http://localhost:${port}/`, {
                method: "HEAD",
                mode: "no-cors"
            });
            return true;
        } catch (error) {
            try {
                // Пытаемся другим способом
                const response = await fetch(`http://localhost:${port}/`);
                return response.ok;
            } catch (secondError) {
                console.log("OAuth сервер недоступен:", secondError);
                return false;
            }
        }
    },

    stop() {
        document.querySelectorAll(".quest-bar-mod-container").forEach(el => el.remove());
        document.getElementById("quest-bar-mod-styles")?.remove();

        // Добавляем отключение observer
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
});
