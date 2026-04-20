import { LitElement, html } from 'lit';

import './item-card.js';

class MarketPage extends LitElement {
  // Disable Shadow DOM so styles apply globally
  createRenderRoot() {
    return this;
  }

  // Reactive properties
  static properties = {
    user:      { type: Object },
    items:     { type: Array },
    search:    { type: String },
    loading:   { type: Boolean },
    error:     { type: String },
  };

  // Initialize default states
  constructor() {
    super();
    this.user    = null;
    this.items   = [];
    this.search  = '';
    this.loading = false;
    this.error   = '';
    this._searchTimer = null;
  }

  // Fetch items upon component initialization
  connectedCallback() {
    super.connectedCallback();
    this.fetchItems();
  }

  // Filter items matching the search query locally
  get filteredItems() {
    return this.items.filter(item => 
      item.name.toLowerCase().includes(this.search.toLowerCase())
    );
  }

  // Retrieve the global list of items from the backend
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

  // Update local search state based on input
  handleSearch(e) {
    this.search = e.target.value;

    // Debounce — wait 400ms after user stops typing
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      this.fetchItems(this.search);
    }, 400);
  }

  // End the user session
  handleLogout() {
    this.dispatchEvent(new CustomEvent('navigate', {
      bubbles: true, composed: true,
      detail: { page: 'login' },
    }));
  }

  // Main layout render mapping
  render() {
    return html`
      <div class="min-h-screen bg-white flex flex-col items-stretch font-sans">
        <!-- Flat Navbar -->
        <div class="sticky top-0 z-50 pt-4 px-4 pb-4 bg-white border-b border-black">
          <nav class="max-w-5xl mx-auto flex items-center justify-between">
            <!-- Logo -->
            <div class="flex items-center gap-2 group cursor-pointer">
              <div class="w-10 h-10 border border-black bg-emerald-700 flex items-center justify-center text-white font-black text-xl uppercase rounded-none shadow-[2px_2px_0px_0px_#000] group-hover:-translate-y-0.5 group-hover:-translate-x-0.5 group-hover:shadow-[4px_4px_0px_0px_#000] transition-all">
                SM
              </div>
              <span class="font-black text-black text-2xl tracking-tighter uppercase hidden sm:block group-hover:text-emerald-700 transition-colors">Social Marketplace</span>
            </div>

            <!-- Search Bar (Flat) -->
            <div class="flex-1 max-w-md mx-4">
              <div class="relative group">
                <input
                  type="text"
                  placeholder="SEARCH ITEMS..."
                  .value=${this.search}
                  @input=${this.handleSearch}
                  class="w-full px-4 py-3 bg-white border border-black text-sm text-black font-bold uppercase placeholder-gray-400 focus:outline-none focus:-translate-y-0.5 focus:-translate-x-0.5 focus:shadow-[4px_4px_0px_0px_#000] transition-all rounded-none"
                />
                ${this.search ? html`
                  <button
                    @click=${() => { this.search = ''; this.fetchItems(); }}
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-orange-600 font-bold focus:outline-none uppercase"
                  >✕</button>
                ` : ''}
              </div>
            </div>

            <!-- User Context -->
            <div class="flex items-center gap-4">
              <div class="hidden md:flex flex-col items-end">
                <span class="text-sm font-black text-black uppercase tracking-widest">${this.user?.name}</span>
                <span class="text-[10px] text-black font-bold uppercase tracking-widest border border-black px-1 mt-0.5 bg-fuchsia-600 text-white">Collector</span>
              </div>
              <button
                @click=${this.handleLogout}
                class="text-sm font-black text-black bg-white border border-black hover:bg-black hover:text-white px-6 py-2.5 rounded-none transition-all uppercase tracking-widest hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_#000] active:translate-y-0 active:translate-x-0 active:shadow-none"
              >
                Logout
              </button>
            </div>
          </nav>
        </div>

        <!-- Main Content -->
        <main class="flex-1 max-w-6xl w-full mx-auto px-4 py-12">
          
          <!-- States -->
          ${this.loading ? html`
            <div class="flex justify-center items-center py-32">
              <div class="bg-fuchsia-600 border border-black p-6 flex items-center gap-3">
                <span class="text-xl font-black text-white uppercase tracking-widest animate-pulse">Curating...</span>
              </div>
            </div>
          ` : this.error ? html`
            <div class="bg-white border border-black p-10 text-center max-w-md mx-auto mt-10">
              <div class="text-4xl text-black mx-auto mb-4 font-black">⚠️</div>
              <h3 class="text-black font-black text-2xl uppercase tracking-tighter mb-2">Error</h3>
              <p class="text-sm font-bold text-black uppercase tracking-widest mb-8">${this.error}</p>
              <button @click=${() => this.fetchItems()} class="px-8 py-3 bg-orange-600 hover:bg-black text-white text-sm font-black rounded-none border border-black uppercase tracking-widest transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0 active:translate-x-0 active:shadow-none">Retry</button>
            </div>
          ` : this.items.length === 0 ? html`
            <div class="bg-white border border-black p-12 text-center max-w-md mx-auto mt-10">
              <div class="text-4xl mx-auto mb-4 grayscale">📭</div>
              <h3 class="text-black font-black text-2xl uppercase tracking-tighter mb-2">No Items</h3>
              <p class="text-sm font-bold text-black uppercase tracking-widest mb-6">We couldn't find any items ${this.search ? ` matching "${this.search}"` : 'in the showroom right now'}.</p>
            </div>
          ` : html`
            <div class="flex items-center justify-between mb-10 px-2 border-b border-black pb-4">
              <h1 class="text-3xl font-black text-black tracking-tighter uppercase whitespace-nowrap overflow-hidden text-clip">Recent Additions</h1>
              <span class="text-xs font-black bg-emerald-700 border border-black text-white px-3 py-1.5 uppercase tracking-widest ml-4">
                ${this.items.length} ITEM${this.items.length !== 1 ? 'S' : ''}
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