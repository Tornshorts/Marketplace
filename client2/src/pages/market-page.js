import { LitElement, html } from 'lit';

import './item-card.js';

class MarketPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  static properties = {
    user:      { type: Object },
    items:     { type: Array },
    search:    { type: String },
    loading:   { type: Boolean },
    error:     { type: String },
  };

  constructor() {
    super();
    this.user    = null;
    this.items   = [];
    this.search  = '';
    this.loading = false;
    this.error   = '';
    this._searchTimer = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.fetchItems();
  }

  async fetchItems(keyword = '') {
    this.loading = true;
    this.error   = '';

    try {
      const url = keyword
        ? `/api/items?search=${encodeURIComponent(keyword)}`
        : '/api/items';

      const res  = await fetch(url);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to load items');
      this.items = data;

    } catch (err) {
      this.error = err.message;
    } finally {
      this.loading = false;
    }
  }

  handleSearch(e) {
    this.search = e.target.value;

    // Debounce — wait 400ms after user stops typing
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      this.fetchItems(this.search);
    }, 400);
  }

  handleLogout() {
    this.dispatchEvent(new CustomEvent('navigate', {
      bubbles: true, composed: true,
      detail: { page: 'login' },
    }));
  }

  render() {
    return html`
      <div class="min-h-screen bg-gray-50 flex flex-col items-stretch">
        <!-- Floating Navbar -->
        <div class="sticky top-0 z-50 pt-4 px-4 pb-4">
          <nav class="max-w-5xl mx-auto bg-white/90 backdrop-blur-xl shadow-sm rounded-full pl-6 pr-4 py-3 flex items-center justify-between border border-gray-100">
            <!-- Logo -->
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-400 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                S
              </div>
              <span class="font-bold text-gray-900 tracking-tight hidden sm:block">Showroom</span>
            </div>

            <!-- Search Bar (Pill) -->
            <div class="flex-1 max-w-md mx-4">
              <div class="relative group">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300 group-focus-within:text-purple-500 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </span>
                <input
                  type="text"
                  placeholder="Search curated items..."
                  .value=${this.search}
                  @input=${this.handleSearch}
                  class="w-full pl-11 pr-4 py-2.5 bg-gray-100/80 border border-transparent rounded-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all shadow-inner"
                />
                ${this.search ? html`
                  <button
                    @click=${() => { this.search = ''; this.fetchItems(); }}
                    class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >✕</button>
                ` : ''}
              </div>
            </div>

            <!-- User Context -->
            <div class="flex items-center gap-3">
              <div class="hidden md:flex flex-col items-end">
                <span class="text-xs font-medium text-gray-900">${this.user?.name}</span>
                <span class="text-[10px] text-gray-400">Collector</span>
              </div>
              <button
                @click=${this.handleLogout}
                class="text-xs font-semibold text-purple-600 bg-white border border-purple-200 hover:bg-purple-50 px-5 py-2 rounded-full transition shadow-sm"
              >
                Logout
              </button>
            </div>
          </nav>
        </div>

        <!-- Main Content -->
        <main class="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
          
          <!-- States -->
          ${this.loading ? html`
            <div class="flex justify-center items-center py-32">
              <div class="flex flex-col items-center gap-4 text-gray-400">
                <div class="w-10 h-10 border-4 border-purple-100 border-t-purple-500 rounded-full animate-spin"></div>
                <span class="text-sm font-medium text-gray-500">Curating items...</span>
              </div>
            </div>
          ` : this.error ? html`
            <div class="bg-white border border-red-100 shadow-sm p-8 rounded-3xl text-center max-w-md mx-auto mt-10">
              <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">⚠️</div>
              <h3 class="text-gray-900 font-bold mb-2">Something went wrong</h3>
              <p class="text-sm text-gray-500 mb-6">${this.error}</p>
              <button @click=${() => this.fetchItems()} class="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-full transition shadow-sm">Try Again</button>
            </div>
          ` : this.items.length === 0 ? html`
            <div class="bg-white border border-gray-100 shadow-sm p-12 rounded-3xl text-center max-w-md mx-auto mt-10">
              <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-5 opacity-80">📭</div>
              <h3 class="text-gray-900 font-bold mb-2">No items found</h3>
              <p class="text-sm text-gray-500 mb-6">We couldn't find any items ${this.search ? ` matching "${this.search}"` : 'in the showroom right now'}.</p>
            </div>
          ` : html`
            <div class="flex items-center justify-between mb-8 px-2">
              <h1 class="text-2xl font-extrabold text-gray-900 tracking-tight">Recent Additions</h1>
              <span class="text-xs font-semibold bg-white border border-gray-200 text-gray-500 px-3 py-1.5 rounded-full shadow-sm">
                ${this.items.length} item${this.items.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <!-- Item Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              ${this.items.map(item => html`
                <item-card
                  .item=${item}
                  .user=${this.user}
                  @item-updated=${() => this.fetchItems(this.search)}
                ></item-card>
              `)}
            </div>
          `}
        </main>
      </div>
    `;
  }
}

customElements.define('market-page', MarketPage);