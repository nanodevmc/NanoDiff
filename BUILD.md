# Инструкция по сборке NanoDiff (Tauri v2)

## Требования
- Node.js >= 20.x
- Rust + Cargo (stable toolchain)
- Visual Studio Build Tools (C++ x64 / MSVC)

## Команды

### Разработка
```cmd
cd /d C:\Users\nanodev\NanoDiff
npm run tauri:dev
```

### Сборка production-релиза и NSIS установщика
```cmd
cd /d C:\Users\nanodev\NanoDiff
npm run tauri:build
```
Готовые бинарники и установщик будут сформированы в:
`src-tauri\target\release\bundle\nsis\NanoDiff_1.0.0_x64-setup.exe`
`src-tauri\target\release\nanodiff.exe`
