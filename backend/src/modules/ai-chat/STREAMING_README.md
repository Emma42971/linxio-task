# AI Streaming - Documentation

## 📋 Vue d'ensemble

Le système de streaming AI permet de recevoir les réponses de l'IA de manière progressive via Server-Sent Events (SSE), offrant une meilleure expérience utilisateur avec un affichage en temps réel.

## ✨ Fonctionnalités

- ✅ **Streaming en temps réel** : Réception progressive des chunks de réponse
- ✅ **Server-Sent Events (SSE)** : Protocole standard pour le streaming
- ✅ **Async Generator Functions** : Utilisation de générateurs asynchrones pour le streaming
- ✅ **OpenAI SDK** : Intégration native avec le SDK OpenAI
- ✅ **Gestion d'erreurs** : Gestion robuste des erreurs et des interruptions
- ✅ **Hook React** : Hook `useAIStream` pour une intégration facile côté frontend

## 🔧 Backend

### Service AI (`ai.service.ts`)

Le service `AiService` fournit des méthodes pour le streaming :

#### `streamChat()`

Générateur asynchrone qui stream les réponses AI :

```typescript
async *streamChat(
  messages: ChatCompletionMessageParam[],
  userId: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  },
): AsyncGenerator<string, void, unknown>
```

**Exemple d'utilisation** :

```typescript
const messages = [
  { role: 'user', content: 'Hello, AI!' }
];

for await (const chunk of aiService.streamChat(messages, userId)) {
  console.log('Chunk:', chunk);
}
```

#### `streamChatWithMetadata()`

Version améliorée qui inclut des métadonnées :

```typescript
async *streamChatWithMetadata(
  messages: ChatCompletionMessageParam[],
  userId: string,
  options?: {...},
): AsyncGenerator<{ content?: string; done: boolean; error?: string }, void, unknown>
```

### Endpoints SSE

#### POST `/api/ai-chat/stream`

Endpoint SSE utilisant Express Response :

```typescript
@Post('stream')
async streamChat(
  @CurrentUser() user: User,
  @Body() chatRequest: ChatRequestDto,
  @Res() res: Response,
): Promise<void>
```

**Format de réponse SSE** :

```
data: {"content": "Hello", "done": false}

data: {"content": " world", "done": false}

data: {"done": true}
```

#### GET `/api/ai-chat/stream-sse`

Endpoint SSE utilisant le décorateur `@Sse()` de NestJS :

```typescript
@Sse('stream-sse')
streamChatSSE(
  @CurrentUser() user: User,
  @Body() chatRequest: ChatRequestDto,
): Observable<MessageEvent>
```

## 🎨 Frontend

### Hook `useAIStream`

Hook React pour gérer le streaming côté client :

```typescript
const { text, isStreaming, error, isComplete, startStream, stopStream, reset } = useAIStream({
  onChunk: (chunk) => console.log('Chunk:', chunk),
  onComplete: (fullText) => console.log('Complete:', fullText),
  onError: (error) => console.error('Error:', error),
});
```

#### Propriétés retournées

- `text` : Texte complet accumulé
- `isStreaming` : Indique si le streaming est en cours
- `error` : Message d'erreur si une erreur s'est produite
- `isComplete` : Indique si le streaming est terminé
- `startStream()` : Démarre le streaming
- `stopStream()` : Arrête le streaming
- `reset()` : Réinitialise l'état

#### Exemple d'utilisation complète

```tsx
import { useAIStream } from '@/hooks/useAIStream';

function ChatComponent() {
  const { text, isStreaming, error, startStream, stopStream } = useAIStream({
    onChunk: (chunk) => {
      console.log('Received chunk:', chunk);
    },
    onComplete: (fullText) => {
      console.log('Streaming complete:', fullText);
    },
    onError: (error) => {
      console.error('Streaming error:', error);
    },
  });

  const handleSend = () => {
    startStream({
      message: 'Hello, AI!',
      history: [],
      sessionId: 'session-123',
    });
  };

  return (
    <div>
      <div>{text}</div>
      {isStreaming && <div>Streaming...</div>}
      {error && <div>Error: {error}</div>}
      <button onClick={handleSend}>Send</button>
      <button onClick={stopStream}>Stop</button>
    </div>
  );
}
```

## 📊 Format des données

### Requête

```json
{
  "message": "Hello, AI!",
  "history": [
    {
      "role": "user",
      "content": "Previous message"
    },
    {
      "role": "assistant",
      "content": "Previous response"
    }
  ],
  "sessionId": "session-123",
  "workspaceId": "workspace-123",
  "projectId": "project-123",
  "currentOrganizationId": "org-123"
}
```

### Réponse SSE

**Chunk de contenu** :
```
data: {"content": "Hello", "done": false}
```

**Chunk final** :
```
data: {"done": true}
```

**Erreur** :
```
data: {"error": "Error message", "done": true}
```

## 🔐 Authentification

Le streaming nécessite une authentification JWT. Le token doit être inclus dans les headers :

```typescript
headers: {
  'Authorization': `Bearer ${token}`
}
```

## ⚙️ Configuration

### Variables d'environnement

Le service utilise les mêmes paramètres que le service AI existant :

- `ai_enabled` : Activer/désactiver l'IA
- `ai_api_key` : Clé API OpenAI
- `ai_model` : Modèle à utiliser (default: `gpt-3.5-turbo`)
- `ai_api_url` : URL de l'API (default: `https://api.openai.com/v1`)

### Options de streaming

```typescript
{
  model?: string;           // Modèle à utiliser
  temperature?: number;      // Température (0-1)
  maxTokens?: number;        // Nombre maximum de tokens
}
```

## 🚀 Installation

### Backend

Installer le SDK OpenAI :

```bash
cd backend
npm install openai
```

### Frontend

Le hook `useAIStream` est déjà disponible dans `frontend/src/hooks/useAIStream.ts`.

## 📝 Exemples

### Exemple 1 : Streaming simple

```typescript
// Backend
for await (const chunk of aiService.streamChat(messages, userId)) {
  res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
}
```

### Exemple 2 : Streaming avec gestion d'erreurs

```typescript
// Backend
try {
  for await (const chunk of aiService.streamChat(messages, userId)) {
    res.write(`data: ${JSON.stringify({ content: chunk, done: false })}\n\n`);
  }
  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
} catch (error) {
  res.write(`data: ${JSON.stringify({ error: error.message, done: true })}\n\n`);
}
```

### Exemple 3 : Composant React complet

```tsx
function StreamingChat() {
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const { text, isStreaming, startStream, reset } = useAIStream({
    onComplete: (fullText) => {
      setMessages(prev => [...prev, { role: 'assistant', content: fullText }]);
      reset();
    },
  });

  const sendMessage = (message: string) => {
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    startStream({
      message,
      history: messages,
    });
  };

  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i}>{msg.role}: {msg.content}</div>
      ))}
      {isStreaming && <div>AI: {text}</div>}
      <input onKeyPress={(e) => {
        if (e.key === 'Enter') {
          sendMessage(e.currentTarget.value);
          e.currentTarget.value = '';
        }
      }} />
    </div>
  );
}
```

## ⚠️ Points importants

1. **Gestion des erreurs** : Toujours gérer les erreurs de streaming
2. **Nettoyage** : Arrêter le streaming lors du démontage du composant
3. **Buffer** : Le hook gère automatiquement le buffer des chunks incomplets
4. **Authentification** : S'assurer que le token est valide
5. **CORS** : Configurer CORS pour permettre SSE depuis le frontend

## 🔗 Ressources

- [OpenAI SDK Documentation](https://github.com/openai/openai-node)
- [Server-Sent Events MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [NestJS SSE Documentation](https://docs.nestjs.com/techniques/server-sent-events)

