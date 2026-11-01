<div align="center">

# ɴᴀɴᴏᴅɪꜰꜰ

**Универсальный глубокий инспектор архивов, кода и визуализатор диффов без Git.**

[![Version](https://img.shields.io/badge/version-1.0.0-9bf246?style=for-the-badge&logo=codeforces&logoColor=000)](https://github.com/nanodevmc/NanoDiff)
[![Engine](https://img.shields.io/badge/Engine-Tauri%20v2%20Rust-38bdf8?style=for-the-badge&logo=rust&logoColor=white)](https://github.com/nanodevmc/NanoDiff)
[![UI](https://img.shields.io/badge/UI-React%2019%20%7C%20Tailwind%20v4-a855f7?style=for-the-badge&logo=react&logoColor=white)](https://github.com/nanodevmc/NanoDiff)
[![Telemetry](https://img.shields.io/badge/Telemetry-0%25%20Offline-4ade80?style=for-the-badge&logo=shield&logoColor=white)](https://github.com/nanodevmc/NanoDiff)
[![Languages](https://img.shields.io/badge/Highlight-54%2B%20Langs-ffb224?style=for-the-badge&logo=speedtest&logoColor=black)](https://github.com/nanodevmc/NanoDiff)

[📢 Telegram-канал автора](https://t.me/WineSquad) · [💬 Связь: @radoqi](https://t.me/radoqi)

</div>

---

## 💎 Ключевые возможности в карточках

<table>
  <tr>
    <td width="33%" valign="top">
      <h3>⚡ Рекурсивный In-Memory VFS</h3>
      <p>Монтирование вложенных архивов любой глубины (<code>.zip</code> ➜ <code>.jar</code> ➜ <code>.apk</code> ➜ <code>.war</code>) напрямую в оперативной памяти без сброса на диск через нативный Deflate-стрим. Нулевой износ SSD.</p>
    </td>
    <td width="33%" valign="top">
      <h3>🔍 Myers & Patience Diff</h3>
      <p>Высокоточный движок вычисления дельт: автоматическая группировка чанков, точные номера строк, подсчёт <code>+additions</code> / <code>-deletions</code> и поддержка режимов <b>Сплит</b> (side-by-side) и <b>Юнифайд</b>.</p>
    </td>
    <td width="33%" valign="top">
      <h3>🎨 54 Языка Подсветки</h3>
      <p>Сверхбыстрый встроенный токенизатор: Rust, C++, C#, Java, Python, Go, TypeScript, GLSL, Solidity, Protobuf, Dockerfile, YAML, ASM и ещё 40+ языков без тяжелых WASM-библиотек.</p>
    </td>
  </tr>
  <tr>
    <td width="33%" valign="top">
      <h3>🖼️ Visual Image Diff</h3>
      <p>Специализированная студия для текстур и спрайтов: интерактивная <b>Шторка</b> (Split Slider), послойное <b>Наложение</b> (Onion Skin) и классический режим <b>Рядом</b>.</p>
    </td>
    <td width="33%" valign="top">
      <h3>💎 Liquid Glass + MD3 UI</h3>
      <p>Интерфейс в терминальной неоновой стилистике (<code>#070a08</code> / <code>#9bf246</code>) с эффектом матового стекла, плавными микроинтеракциями, радаром дропзоны и 8/10 анимированными компонентами.</p>
    </td>
    <td width="33%" valign="top">
      <h3>🚀 Экстремальная Оптимизация</h3>
      <p>Построен на <b>Tauri v2</b>: размер установщика всего <b>1.35 МБ</b>, потребление RAM <b>&lt; 35 МБ</b>, мгновенный холодный старт даже на слабых 2-ядерных процессорах.</p>
    </td>
  </tr>
</table>

---

## 📊 Сравнение с существующими решениями

| Параметр | **NanoDiff** | WinMerge | Beyond Compare | Git CLI / GUI |
|---|:---:|:---:|:---:|:---:|
| **Работа без Git-репозитория** | ✅ Да | ✅ Да | ✅ Да | ❌ Нет |
| **Рекурсивные вложенные архивы** | ✅ На лету в RAM | ⚠️ Через плагины | ⚠️ Ограниченно | ❌ Нет |
| **Вес установщика** | **~1.35 МБ** | ~15 МБ | ~35 МБ | ~50+ МБ |
| **Потребление памяти** | **~35 МБ** | ~80 МБ | ~120 МБ | ~150+ МБ |
| **Визуальный Diff картинок (Шторка)** | ✅ Встроено | ❌ Нет | ⚠️ Базовый | ❌ Нет |
| **Подсветка синтаксиса** | **54 языка** | Базовая | Расширенная | Зависит от GUI |
| **Дизайн** | Liquid Glass + MD3 | Win32 Classic | Win32 Classic | Зависит от GUI |

---

## 🛠️ Архитектура

```
 [ Архив A (.zip / .jar) ]             [ Архив B (.zip / .jar) ]
             │                                     │
             ▼                                     ▼
 ┌────────────────────────────────────────────────────────┐
 │   In-Memory Recursive VFS (Потоковое монтирование)    │
 │   • Рекурсивный парсер EOCD & Central Directory        │
 │   • Нативное C++ Deflate-разжатие через Streams API    │
 │   • 0 байт на диске: всё держится в памяти в дереве    │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │            Content Differ & Tokenizer Engine           │
 │  • Myers Diff: O(ND) расчет минимального edit-графа    │
 │  • 54 языка: регулярный токенизатор ключевых слов/типов│
 │  • Картинки (PNG/JPG/WEBP/SVG): Blob Object URLs       │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │     Tauri v2 GUI (Liquid Glass + Material Design 3)    │
 │  • Двухоконный Drag & Drop с анимированным радаром     │
 │  • Дерево файлов с фильтрацией и цветными бейджами     │
 │  • Split & Unified Code Viewer с номерами строк        │
 │  • Image Diff с ползунком разделения и прозрачностью   │
 └────────────────────────────────────────────────────────┘
```

---

## 💻 Сборка и запуск

### Требования
- **Node.js** >= 20.x
- **Rust + Cargo** (stable toolchain)
- **Visual Studio Build Tools** (C++ x64 / MSVC)

### Запуск в режиме разработки
```cmd
cd NanoDiff
npm run tauri:dev
```

### Сборка production-релиза и NSIS установщика
```cmd
cd NanoDiff
npm run tauri:build
```

Готовые бинарники и инсталлер формируются в:
- `src-tauri/target/release/bundle/nsis/NanoDiff_1.0.0_x64-setup.exe` (1.35 МБ)
- `src-tauri/target/release/nanodiff.exe` (4.05 МБ)

---

## 📄 Лицензия

MIT License © 2026 [NanoDev](https://github.com/nanodevmc)
