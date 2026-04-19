import { LitElement, html, unsafeCSS } from 'lit';


class OfferModal extends LitElement {
  createRenderRoot(){return this;}

  static properties = {
    item:    { type: Object },
    user:    { type: Object },
    offer:   { type: String },
    error:   { type: String },
    loading: { type: Boolean },
    success: { type: Boolean },
  };

  constructor() {
    super();
    this.offer   = '';
    this.error   = '';
    this.loading = false;
    this.success = false;
  }

  close() {
    this.dispatchEvent(new CustomEvent('close-modal', {
      bubbles: true, composed: true,
    }));
  }

  async submitOffer() {
    const amount = parseFloat(this.offer);

    if (!this.offer || isNaN(amount) || amount <= 0) {
      this.error = 'Please enter a valid offer amount.';
      return;
    }

    if (amount >= this.item.price) {
      this.error = `Offer must be less than the asking price ($${this.item.price}).`;
      return;
    }

    this.error   = '';
    this.loading = true;

    try {
      const res = await fetch(`/api/items/${this.item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          highestOffer:      amount,
          highestOfferBuyer: this.user.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Offer failed');

      this.success = true;

      // Close after 1.5s and refresh items
      setTimeout(() => {
        this.dispatchEvent(new CustomEvent('offer-made', {
          bubbles: true, composed: true,
        }));
        this.close();
      }, 1500);

    } catch (err) {
      this.error = err.message;
    } finally {
      this.loading = false;
    }
  }

  render() {
    return html`
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60] flex items-center justify-center px-4"
        @click=${e => e.target === e.currentTarget && this.close()}
      >
        <!-- Modal -->
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 z-[70] transform transition-all">

          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <h2 class="font-extrabold text-gray-900 text-xl tracking-tight">Make an Offer</h2>
            <button @click=${this.close} class="text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors">✕</button>
          </div>

          <!-- Item Summary -->
          <div class="bg-purple-50/50 rounded-2xl px-5 py-4 mb-6 border border-purple-100/50">
            <p class="text-sm font-bold text-gray-900 truncate">${this.item?.name}</p>
            <p class="text-xs text-gray-500 mt-1">Asking price:
              <span class="text-purple-600 font-bold">$${this.item?.price}</span>
            </p>
            ${this.item?.highestOffer ? html`
              <p class="text-xs text-gray-500 mt-1">Current highest:
                <span class="font-bold text-gray-900">$${this.item.highestOffer}</span>
              </p>
            ` : ''}
          </div>

          <!-- Success State -->
          ${this.success ? html`
            <div class="text-center py-6">
              <div class="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🎉</div>
              <p class="text-gray-900 font-extrabold text-lg">Offer submitted!</p>
              <p class="text-sm text-gray-500 mt-1">Waiting for seller response...</p>
            </div>
          ` : html`

            <!-- Error -->
            ${this.error ? html`
              <div class="bg-red-50 text-red-500 font-semibold text-xs px-4 py-3 rounded-xl mb-6 text-center">
                ⚠️ ${this.error}
              </div>
            ` : ''}

            <!-- Offer Input -->
            <div class="mb-8">
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Offer ($)</label>
              <input
                type="number"
                min="1"
                .value=${this.offer}
                @input=${e => this.offer = e.target.value}
                @keydown=${e => e.key === 'Enter' && this.submitOffer()}
                placeholder="0.00"
                class="w-full bg-gray-50 border-0 rounded-2xl px-5 py-3.5 text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition"
              />
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
              <button
                @click=${this.close}
                class="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold py-3.5 rounded-full transition text-sm"
              >Cancel</button>
              <button
                @click=${this.submitOffer}
                ?disabled=${this.loading}
                class="flex-1 bg-gradient-to-r from-purple-500 to-indigo-400 hover:from-purple-600 hover:to-indigo-500 hover:shadow-md disabled:opacity-50 text-white font-bold py-3.5 rounded-full transition text-sm flex items-center justify-center"
              >
                ${this.loading ? html`<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>` : 'Submit Offer'}
              </button>
            </div>
          `}

        </div>
      </div>
    `;
  }
}

customElements.define('offer-modal', OfferModal);