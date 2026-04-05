# Claude CLI Config Integration

CloudCLI тепер підтримує стандартний Claude CLI конфіг для API ключів та custom API URLs.

## Що було зроблено

### 1. Створено утиліту `claude-config-loader.js`
- Читає конфігурацію з `~/.claude/settings.json` та `~/.claude/config.json`
- Підтримує пріоритетний порядок: env vars → settings.json → config.json
- Експортує функції `loadClaudeConfig()` та `applyClaudeConfigToSDK()`

### 2. Інтегровано в `claude-sdk.js`
- Функція `mapCliOptionsToSDK()` тепер приймає `claudeConfig` параметр
- Автоматично застосовує custom API URLs через `sdkOptions.apiUrl`
- Підтримує custom моделі (наприклад `kr/claude-sonnet-4.5`)
- Встановлює env змінні для SDK аутентифікації

### 3. Оновлено `cli-auth.js`
- Використовує централізований config loader
- Спрощено логіку перевірки credentials
- Підтримує всі методи аутентифікації

## Підтримувані параметри конфігу

У `~/.claude/settings.json` або `~/.claude/config.json`:

```json
{
  "env": {
    "ANTHROPIC_API_KEY": "sk-ant-...",
    "ANTHROPIC_BASE_URL": "http://127.0.0.1:20128/v1",
    "ANTHROPIC_MODEL": "kr/claude-sonnet-4.5",
    "ANTHROPIC_AUTH_TOKEN": "sk-006a49cd..."
  }
}
```

## Пріоритет конфігурації

1. **Environment variables** - найвищий пріоритет
2. **~/.claude/settings.json** - другий пріоритет
3. **~/.claude/config.json** - третій пріоритет
4. **~/.claude/.credentials.json** - OAuth токени (fallback)
5. **Default Anthropic API** - якщо нічого не налаштовано

## Тестування

Запустіть тестовий скрипт:
```bash
node test-config-loader.js
```

Він покаже які параметри були завантажені з конфігу.

## Сумісність

- ✅ Працює з стандартним Claude CLI
- ✅ Підтримує custom API endpoints (OmniRoute, proxies)
- ✅ Підтримує custom моделі
- ✅ Зворотньо сумісний з існуючим функціоналом
- ✅ Не ламає роботу без конфігу
