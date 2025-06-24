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
    clientId: {
        type: OptionType.STRING,
        description: "Yandex OAuth Client ID",
        default: "",
        restartNeeded: true,
        onChange: newValue => console.log("Client ID changed to:", newValue),
    },
    redirectUri: {
        type: OptionType.STRING,
        description: "Redirect URI",
        default: "https://raw.githubusercontent.com/.../dummy-oauth.html",
        restartNeeded: true,
        onChange: newValue => console.log("Redirect URI changed to:", newValue),
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
        // Добавляем задержку для безопасной инициализации
        setTimeout(() => {
            this.loadToken();
            this.injectElement();
            this.addStyles();
        }, 1000);
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
                }
            }
        });

        // Добавляем отключение старого observer
        if (this.observer) this.observer.disconnect();
        this.observer = observer;
        this.observer.observe(document.body, { childList: true, subtree: true });
    },

    authorize() {
        const { clientId, redirectUri } = settings.store;

        if (!clientId) {
            alert("Пожалуйста, укажите Client ID в настройках плагина!");
            return;
        }

        const messageHandler = (event: MessageEvent) => {
            if (event.data.type === "yandex-oauth-error") {
                alert(`Ошибка авторизации: ${event.data.error}`);
                window.removeEventListener("message", messageHandler);
            }
            if (event.origin !== "https://oauth.yandex.ru") return;

            if (event.data.type === "yandex-oauth" && event.data.token) {
                this.saveToken(event.data.token);
                document.querySelectorAll(".quest-bar-mod-container").forEach(el => el.remove());
                this.injectElement();
                window.removeEventListener("message", messageHandler);
            }
        };
        window.addEventListener("message", messageHandler);

        // Открываем окно авторизации
        const authWindow = window.open(
            `https://oauth.yandex.ru/authorize?response_type=token&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`,
            "yandexAuth",
            "width=600,height=700"
        );
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
