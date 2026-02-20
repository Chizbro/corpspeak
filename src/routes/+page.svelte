<script lang="ts">
  import { useQuery, useConvexClient } from 'convex-svelte';
  import { api } from '$convex/_generated/api';
  const client = useConvexClient();

  const roomsResult = useQuery(api.rooms.listRooms, () => ({}));

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

  const rooms = $derived(roomsResult.data ?? []);
  const currentRoom = $derived(rooms[0] ?? null);

  const messagesResult = useQuery(
    api.messages.listMessages,
    () => (currentRoom ? { roomId: currentRoom._id } : 'skip')
  );

  const messages = $derived(messagesResult.data ?? []);

  async function createDefaultRoom() {
    await client.mutation(api.rooms.createRoom, { name: 'General' });
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const rawBody = messageInput.trim();
    if (!rawBody || !currentRoom || !displayName.trim()) return;
    submitError = null;
    isTranslating = true;
    try {
      await client.action(api.actions.translateAndSend, {
        roomId: currentRoom._id,
        rawBody,
        authorName: displayName.trim(),
        clientId: getClientId()
      });
      messageInput = '';
    } catch (err) {
      submitError = err instanceof Error ? err.message : String(err);
    } finally {
      isTranslating = false;
    }
  }
</script>

<div class="chat-view">
  {#if roomsResult.isLoading}
    <p class="muted">Loading rooms…</p>
  {:else if rooms.length === 0}
    <p class="muted">No room yet.</p>
    <button type="button" onclick={createDefaultRoom}>Create General room</button>
  {:else}
    <div class="room-header">
      <h2>{currentRoom?.name ?? 'Chat'}</h2>
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
      {#if messagesResult.isLoading}
        <p class="muted">Loading messages…</p>
      {:else if messagesResult.error}
        <p class="error">Failed to load: {messagesResult.error.toString()}</p>
      {:else}
        <ul class="message-list">
          {#each messages as msg}
            <li class="message">
              <span class="message-author">{msg.authorName}</span>
              <span class="message-time" title={new Date(msg.createdAt).toISOString()}>
                {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              <p class="message-body">{msg.body}</p>
            </li>
          {/each}
        </ul>
      {/if}
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
  {/if}
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
