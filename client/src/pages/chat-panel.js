import { LitElement, html, unsafeCSS } from 'lit';


class ChatPanel extends LitElement {
  // Disable Shadow DOM styles apply globally
  createRenderRoot() { return this; }

  // Reactive properties
  static properties = {
    item:      { type: Object },
    user:      { type: Object },
    messages:  { type: Array },
    text:      { type: String },
    loading:   { type: Boolean },
    error:     { type: String },
  };

  // Initialize default states
  constructor() {
    super();
    this.messages      = [];
    this.text          = '';
    this.loading       = false;
    this.error         = '';
    this._pollInterval = null;
    this._lastTs       = '1970-01-01T00:00:00.000Z';
  }

  // Lifecycle: fetch messages and start polling
  connectedCallback() {
    super.connectedCallback();
    this.loadMessages();                          // load history
    this._pollInterval = setInterval(() => {
      this.pollMessages();                        // poll every 3s
    }, 3000);
  }

  // Teardown: stop polling when closed
  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this._pollInterval);           // stop polling on close
  }

  // Load full history on open
  // Retrieve messages from the backend chat API
  async loadMessages() {
    this.loading = true;
    try {
      const res  = await fetch(`/api/messages/item/${this.item.id}/poll/1970-01-01T00:00:00.000Z`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load chat');

      this.messages = data.messages || [];
      this._lastTs  = data.lastTimestamp || this._lastTs;
      this._scrollToBottom();
    } catch (err) {
      this.error = err.message;
    } finally {
      this.loading = false;
    }
  }

  // Poll only for new messages since lastTimestamp
  async pollMessages() {
    try {
      const res  = await fetch(`/api/messages/item/${this.item.id}/poll/${this._lastTs}`);
      const data = await res.json();
      if (!res.ok || !data.hasNew) return;

      this.messages = [...this.messages, ...data.messages];
      this._lastTs  = data.lastTimestamp;
      this._scrollToBottom();
    } catch {
      // Silent fail on poll — don't interrupt UX
    }
  }

  async sendMessage() {
    if (!this.text.trim()) return;

    const body = {
      itemId:     this.item.id,
      senderId:   this.user.id,
      senderName: this.user.name,
      content:    this.text.trim(),
    };

    this.text = '';   // clear input immediately

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      // Verify the response is JSON before parsing
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Server returned a non-JSON response (Status: ${res.status}). Did you restart the server?`);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');

      this.messages = [...this.messages, data];
      this._lastTs  = data.timestamp;
      this._scrollToBottom();

    } catch (err) {
      this.error = err.message;
    }
  }

  _scrollToBottom() {
    this.updateComplete.then(() => {
      const box = this.querySelector('#msg-box');
      if (box) box.scrollTop = box.scrollHeight;
    });
  }


  close() {
    this.dispatchEvent(new CustomEvent('close-chat', {
      bubbles: true, composed: true,
    }));
  }

  // Main layout render mapping
  render() {
    return html`
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/80 z-[60] flex items-end sm:items-center justify-center sm:px-4"
        @click=${e => e.target === e.currentTarget && this.close()}
      >
        <!-- Panel -->
        <div class="bg-white w-full sm:max-w-md border border-black flex flex-col h-[80vh] sm:h-[75vh] z-[70] rounded-none shadow-none">

          <!-- Header -->
          <div class="bg-white px-6 py-4 border-b border-black flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 border border-black bg-white flex items-center justify-center text-lg rounded-none shadow-none">💭</div>
              <div>
                <p class="font-black text-black text-sm uppercase tracking-tighter truncate max-w-[200px]">${this.item?.name}</p>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="w-2 h-2 bg-emerald-700 animate-pulse border border-black"></span>
                  <p class="text-[10px] uppercase font-black text-black tracking-widest">Live Chat</p>
                </div>
              </div>
            </div>
            <button @click=${this.close} class="w-8 h-8 flex items-center justify-center border border-black bg-white hover:bg-black hover:text-white text-black transition-all rounded-none font-bold hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[2px_2px_0px_0px_#000] active:translate-y-0 active:translate-x-0 active:shadow-none">✕</button>
          </div>

          <!-- Messages -->
          <div id="msg-box" class="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-6 bg-white border-b border-black">

            ${this.loading ? html`
              <div class="flex justify-center mt-10">
                <span class="text-black font-black uppercase tracking-widest animate-pulse">Loading...</span>
              </div>
            ` : this.messages.length === 0 ? html`
              <div class="text-center text-black border border-black p-4 text-xs mt-10 font-black uppercase tracking-widest bg-white">
                No messages yet. Send a message to the seller!
              </div>
            ` : this.messages.map(msg => {
              const isMe = msg.senderId === this.user.id;
              return html`
                <div class="flex ${isMe ? 'justify-end' : 'justify-start'}">
                  <div class="max-w-[85%]">
                    ${!isMe ? html`
                      <p class="text-[10px] font-black text-black mb-1 ml-1 uppercase tracking-widest">${msg.senderName ?? 'User'}</p>
                    ` : ''}
                    <div class="px-5 py-3 border border-black text-sm font-bold uppercase tracking-wider
                      ${isMe
                        ? 'bg-fuchsia-600 text-white rounded-none -mb-1'
                        : 'bg-white text-black rounded-none'}">
                      ${msg.content}
                    </div>
                    <p class="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-widest ${isMe ? 'text-right mr-2' : 'ml-2'}">
                      ${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              `;
            })}
          </div>

          <!-- Error -->
          ${this.error ? html`
            <div class="px-4 py-3 bg-white text-black font-black text-xs text-center border-b border-black uppercase tracking-widest">⚠️ ${this.error}</div>
          ` : ''}

          <!-- Input -->
          <div class="px-5 py-4 bg-white flex gap-3 items-center">
            <input
              type="text"
              placeholder="TYPE YOUR MESSAGE..."
              .value=${this.text}
              @input=${e => this.text = e.target.value}
              @keydown=${e => e.key === 'Enter' && this.sendMessage()}
              class="flex-1 bg-white border border-black rounded-none px-5 py-3 text-sm focus:outline-none focus:-translate-y-0.5 focus:-translate-x-0.5 focus:shadow-[4px_4px_0px_0px_#000] transition-all font-bold text-black uppercase placeholder-gray-400"
            />
            <button
              @click=${this.sendMessage}
              ?disabled=${!this.text.trim()}
              class="w-12 h-12 rounded-none border border-black flex items-center justify-center bg-black disabled:opacity-40 text-white transition-all shrink-0 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_#000] active:translate-y-0 active:translate-x-0 active:shadow-none"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </button>
          </div>

        </div>
      </div>
    `;
  }
}

customElements.define('chat-panel', ChatPanel);