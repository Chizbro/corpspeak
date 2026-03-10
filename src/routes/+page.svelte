<script lang="ts">
  import { onMount } from 'svelte';

  type Message = {
    id: string;
    author_name: string;
    body: string;
    created_at: string;
  };

  const CLIENT_ID_KEY = 'corpspeak_clientId';
  function getClientId(): string {
    if (typeof window === 'undefined') return '';
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  }

  let messages = $state<Message[]>([]);
  let displayName = $state(
    typeof window !== 'undefined' ? localStorage.getItem('corpspeak_displayName') ?? '' : ''
  );
  let messageInput = $state('');
  let isTranslating = $state(false);
  let submitError = $state<string | null>(null);

  $effect(() => {
    if (typeof window === 'undefined') return;
    if (displayName) localStorage.setItem('corpspeak_displayName', displayName);
  });

  onMount(() => {
    const protocol = typeof location !== 'undefined' && location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = typeof location !== 'undefined' ? location.host : '';
    const ws = new WebSocket(`${protocol}//${host}/ws`);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as Message;
        if (payload?.id && !messages.find((m) => m.id === payload.id)) {
          messages = [...messages, payload];
        }
      } catch {
        // ignore
      }
    };

    return () => {
      ws.close();
    };
  });

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const rawBody = messageInput.trim();
    if (!rawBody || !displayName.trim()) return;
    submitError = null;
    isTranslating = true;
    try {
      const res = await fetch('/api/translate-and-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawBody,
          authorName: displayName.trim(),
          clientId: getClientId()
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed: ${res.status}`);
      }
      const data = await res.json().catch(() => null) as Message | null;
      if (data?.id && !messages.find((m) => m.id === data!.id)) {
        messages = [...messages, data];
      }
      messageInput = '';
    } catch (err) {
      submitError = err instanceof Error ? err.message : String(err);
    } finally {
      isTranslating = false;
    }
  }
</script>

<div class="chat-view">
  <div class="room-header">
    <h2>General</h2>
  </div>

  <div class="identity">
    <label for="display-name">Display name</label>
    <input
      id="display-name"
      type="text"
      placeholder="Your name"
      bind:value={displayName}
      maxlength={64}
    />
  </div>

  <div class="messages-wrap">
    <p class="muted">Messages appear here as they're sent (since you joined). No history is stored.</p>
    <ul class="message-list">
      {#each messages as msg}
        <li class="message">
          <span class="message-author">{msg.author_name}</span>
          <span class="message-time" title={new Date(msg.created_at).toISOString()}>
            {new Date(msg.created_at).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          <p class="message-body">{msg.body}</p>
        </li>
      {/each}
    </ul>
  </div>

  {#if submitError}
    <p class="error" role="alert">{submitError}</p>
  {/if}
  <form class="send-form" onsubmit={handleSubmit}>
    <input
      type="text"
      placeholder="Type a message…"
      bind:value={messageInput}
      disabled={!displayName.trim() || isTranslating}
      aria-label="Message"
    />
    <button
      type="submit"
      disabled={!messageInput.trim() || !displayName.trim() || isTranslating}
      aria-busy={isTranslating}
    >
      {isTranslating ? 'Translating…' : 'Send'}
    </button>
  </form>
</div>

<style>
  .chat-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 60vh;
  }

  .muted {
    color: var(--muted);
    margin: 0.5rem 0;
    font-size: 0.875rem;
  }

  .error {
    color: #f85149;
    margin: 0.5rem 0;
  }

  .room-header {
    margin-bottom: 0.75rem;
  }

  .room-header h2 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .identity {
    margin-bottom: 1rem;
  }

  .identity label {
    display: block;
    font-size: 0.75rem;
    color: var(--muted);
    margin-bottom: 0.25rem;
  }

  .identity input {
    width: 100%;
    max-width: 16rem;
  }

  .messages-wrap {
    flex: 1;
    overflow-y: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    padding: 0.75rem;
    min-height: 12rem;
  }

  .message-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .message {
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border);
  }

  .message:last-child {
    border-bottom: none;
  }

  .message-author {
    font-weight: 600;
    font-size: 0.875rem;
    margin-right: 0.5rem;
  }

  .message-time {
    font-size: 0.75rem;
    color: var(--muted);
  }

  .message-body {
    margin: 0.25rem 0 0;
    font-size: 0.9375rem;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .send-form {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .send-form input {
    flex: 1;
  }
</style>
