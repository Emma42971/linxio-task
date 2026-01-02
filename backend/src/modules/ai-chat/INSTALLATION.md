# Installation - AI Streaming

## 📦 Dépendances requises

### Backend

Installer le SDK OpenAI :

```bash
cd backend
npm install openai
```

### Vérification

Vérifier que le package est installé :

```bash
npm list openai
```

## 🔧 Configuration

Le service utilise les mêmes paramètres de configuration que le service AI existant :

1. **Activer l'IA** : `ai_enabled` = `true` dans les settings
2. **Clé API** : `ai_api_key` dans les settings
3. **Modèle** : `ai_model` dans les settings (default: `gpt-3.5-turbo`)
4. **URL API** : `ai_api_url` dans les settings (default: `https://api.openai.com/v1`)

## ✅ Vérification

Après installation, vérifier que tout fonctionne :

1. Le service `AiService` est bien injecté dans `AiChatModule`
2. Les endpoints `/api/ai-chat/stream` et `/api/ai-chat/stream-sse` sont disponibles
3. Le hook `useAIStream` est disponible dans le frontend

## 🚀 Test

Tester le streaming avec curl :

```bash
curl -X POST http://localhost:3000/api/ai-chat/stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Hello, AI!",
    "history": []
  }'
```

Vous devriez voir des chunks de données au format SSE.

