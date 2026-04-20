import { LitElement, html, unsafeCSS } from 'lit';


class OfferModal extends LitElement {
  // Disable Shadow DOM styles apply globally
  createRenderRoot() { return this; }

  // Reactive properties
  static properties = {
    item:    { type: Object },
    user:    { type: Object },
    offer:   { type: String },
    error:   { type: String },
    loading: { type: Boolean },
    success: { type: Boolean },
  };

  // Initialize default states
  constructor() {
    super();
    this.offer   = '';
    this.error   = '';
    this.loading = false;
    this.success = false;
  }

  // Trigger close-modal event
  close() {
    this.dispatchEvent(new CustomEvent('close-modal', {
      bubbles: true, composed: true,
    }));
  }

  // Submit an offer to the backend API
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

  // Main layout render mapping
  render() {
    return html`
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center px-4"
        @click=${e => e.target === e.currentTarget && this.close()}
      >
        <!-- Modal -->
        <div class="bg-white rounded-none border border-black shadow-[12px_12px_0px_0px_#000] w-full max-w-sm p-10 z-[70] transform transition-all font-sans">

          <!-- Header -->
          <div class="flex items-center justify-between mb-8 pb-4 border-b border-black">
            <h2 class="font-black text-black text-2xl tracking-tighter uppercase">Make an Offer</h2>
            <button @click=${this.close} class="text-black bg-white hover:bg-black hover:text-white border border-black w-8 h-8 rounded-none flex items-center justify-center transition-all font-bold hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_#000] active:translate-y-0 active:translate-x-0 active:shadow-none">✕</button>
          </div>

          <!-- Item Summary -->
          <div class="bg-white rounded-none p-5 mb-8 border border-black">
            <p class="text-sm font-black text-black uppercase tracking-widest truncate mb-2">${this.item?.name}</p>
            <p class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Asking price:
              <span class="text-black font-black">$${this.item?.price}</span>
            </p>
            ${this.item?.highestOffer ? html`
              <p class="text-xs font-bold text-gray-500 uppercase tracking-widest">Current highest:
                <span class="font-black text-black">$${this.item.highestOffer}</span>
              </p>
            ` : ''}
          </div>

          <!-- Success State -->
          ${this.success ? html`
            <div class="text-center py-8">
              <div class="w-16 h-16 bg-white border border-black rounded-none flex items-center justify-center text-3xl mx-auto mb-6">🎉</div>
              <p class="text-black font-black text-2xl uppercase tracking-tighter">Offer Submitted!</p>
              <p class="text-xs font-bold text-gray-500 mt-2 uppercase tracking-widest">Waiting for seller response...</p>
            </div>
          ` : html`

            <!-- Error -->
            ${this.error ? html`
              <div class="bg-white border border-black text-black font-black text-xs px-4 py-3 rounded-none mb-8 text-center uppercase tracking-widest">
                ⚠️ ${this.error}
              </div>
            ` : ''}

            <!-- Offer Input -->
            <div class="mb-10">
              <label class="block text-xs font-black text-black uppercase tracking-widest mb-3">Your Offer ($)</label>
              <input
                type="number"
                min="1"
                .value=${this.offer}
                @input=${e => this.offer = e.target.value}
                @keydown=${e => e.key === 'Enter' && this.submitOffer()}
                placeholder="0.00"
                class="w-full bg-white border border-black rounded-none px-5 py-4 text-xl font-black text-black uppercase focus:outline-none focus:-translate-y-1 focus:-translate-x-1 focus:shadow-[4px_4px_0px_0px_#000] transition-all font-mono"
              />
            </div>

            <!-- Actions -->
            <div class="flex gap-4">
              <button
                @click=${this.close}
                class="flex-1 bg-white hover:bg-black hover:text-white border border-black text-black font-black py-4 rounded-none transition-all text-sm uppercase tracking-widest hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0 active:translate-x-0 active:shadow-none"
              >Cancel</button>
              <button
                @click=${this.submitOffer}
                ?disabled=${this.loading}
                class="flex-1 bg-orange-600 disabled:opacity-50 text-white font-black border border-black py-4 rounded-none transition-all text-sm uppercase tracking-widest flex items-center justify-center hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0 active:translate-x-0 active:shadow-none"
              >
                ${this.loading ? html`<span class="animate-pulse">Submitting...</span>` : 'Submit Offer'}
              </button>
            </div>
          `}

        </div>
      </div>
    `;
  }
}

customElements.define('offer-modal', OfferModal);