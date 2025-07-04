# 🎵 Авторизация Yandex Music в Discord

## 🚀 Быстрый старт

### 1. Запустите OAuth сервер

```bash
cd server
npm start
```

### 2. В Discord нажмите кнопку авторизации

В виджете плагина нажмите **"Войти через Яндекс"**

### 3. Выберите способ авторизации

#### Вариант А: Внешний браузер (рекомендуется)

1. 🌐 Авторизация откроется в браузере по умолчанию
2. 📝 Войдите в аккаунт Yandex и разрешите доступ
3. 📋 Скопируйте токен с результирующей страницы (нажав на него)
4. 🔙 Вернитесь в Discord
5. 🔑 Нажмите **"Ввести токен вручную"** в виджете
6. 📥 Вставьте токен и нажмите **"Сохранить"**

#### Вариант Б: Прямое перенаправление

1. ✅ Подтвердите перенаправление на страницу авторизации
2. 📝 Войдите в аккаунт Yandex и разрешите доступ
3. 🔙 После авторизации автоматически вернетесь в Discord

## 🎯 Что изменилось

-   ❌ **Больше нет всплывающих окон** - они вызывали краши Discord
-   ✅ **Внешний браузер** - открывается через системный браузер
-   ✅ **Ручной ввод токена** - гарантированно работает
-   ✅ **Безопасно** - токен передается напрямую

## 🔧 Устранение неполадок

### Проблема: "OAuth сервер не запущен"

**Решение**: Запустите сервер командой `npm start` в папке `server`

### Проблема: "Авторизация не открывается"

**Решение**: Используйте кнопку **"Ввести токен вручную"** и:

1. Откройте http://localhost:3000/oauth/authorize в браузере
2. Завершите авторизацию
3. Скопируйте токен с результирующей страницы
4. Вернитесь в Discord и введите токен

### Проблема: "Неверный токен"

**Решение**:

1. Убедитесь, что скопировали полный токен
2. Проверьте, что сервер запущен и Client ID настроен правильно
3. Попробуйте повторить авторизацию

## ✅ Готово!

После успешной авторизации:

-   🎵 Виджет будет показывать ваш статус авторизации
-   🔄 Можете использовать функции интеграции с Yandex Music
-   🚪 Кнопка **"Выйти"** позволит завершить сессию

**Наслаждайтесь интеграцией Yandex Music в Discord! 🎶**
