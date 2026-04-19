import { LitElement, html, unsafeCSS } from 'lit';


class ChatPanel extends LitElement {
  createRenderRoot(){return this;}

  static properties = {
    item:      { type: Object },
    user:      { type: Object },
    messages:  { type: Array },
    text:      { type: String },
    loading:   { type: Boolean },
    error:     { type: String },
  };

  constructor() {
    super();
    this.messages      = [];
    this.text          = '';
    this.loading       = false;
    this.error         = '';
    this._pollInterval = null;
    this._lastTs       = '1970-01-01T00:00:00.000Z';
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadMessages();                          // load history
    this._pollInterval = setInterval(() => {
      this.pollMessages();                        // poll every 3s
    }, 3000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this._pollInterval);           // stop polling on close
  }

  // Load full history on open
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

  render() {
    return html`
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center sm:px-4"
        @click=${e => e.target === e.currentTarget && this.close()}
      >
        <!-- Panel -->
        <div class="bg-white w-full sm:max-w-md sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl flex flex-col h-[80vh] sm:h-[75vh] z-[70] overflow-hidden">

          <!-- Header -->
          <div class="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-lg">💭</div>
              <div>
                <p class="font-extrabold text-gray-900 text-sm tracking-tight truncate max-w-[200px]">${this.item?.name}</p>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  <p class="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Live Chat</p>
                </div>
              </div>
            </div>
            <button @click=${this.close} class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors">✕</button>
          </div>

          <!-- Messages -->
          <div id="msg-box" class="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-4 bg-gray-50/50">

            ${this.loading ? html`
              <div class="flex justify-center mt-10">
                <svg class="animate-spin h-6 w-6 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
              </div>
            ` : this.messages.length === 0 ? html`
              <div class="text-center text-gray-400 text-sm mt-10 font-medium">
                No messages yet. Send a message to the seller!
              </div>
            ` : this.messages.map(msg => {
              const isMe = msg.senderId === this.user.id;
              return html`
                <div class="flex ${isMe ? 'justify-end' : 'justify-start'}">
                  <div class="max-w-[75%]">
                    ${!isMe ? html`
                      <p class="text-[10px] font-bold text-gray-400 mb-1 ml-1 uppercase tracking-wider">${msg.senderName ?? 'User'}</p>
                    ` : ''}
                    <div class="px-5 py-3 rounded-[1.25rem] text-sm shadow-sm
                      ${isMe
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-400 text-white rounded-br-sm'
                        : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'}">
                      ${msg.content}
                    </div>
                    <p class="text-[10px] text-gray-400 mt-1.5 font-medium ${isMe ? 'text-right mr-2' : 'ml-2'}">
                      ${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              `;
            })}
          </div>

          <!-- Error -->
          ${this.error ? html`
            <div class="px-4 py-2 bg-red-50 text-red-500 font-medium text-xs text-center border-t border-red-100">⚠️ ${this.error}</div>
          ` : ''}

          <!-- Input -->
          <div class="px-5 py-4 bg-white border-t border-gray-100 flex gap-3 items-center">
            <input
              type="text"
              placeholder="Type your message..."
              .value=${this.text}
              @input=${e => this.text = e.target.value}
              @keydown=${e => e.key === 'Enter' && this.sendMessage()}
              class="flex-1 bg-gray-50 border-0 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition font-medium"
            />
            <button
              @click=${this.sendMessage}
              ?disabled=${!this.text.trim()}
              class="w-11 h-11 rounded-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white shadow-sm hover:shadow-md transition shrink-0"
            >
              <svg class="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </button>
          </div>

        </div>
      </div>
    `;
  }
}

customElements.define('chat-panel', ChatPanel);