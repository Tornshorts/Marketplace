import { LitElement, html } from 'lit';

import './offer-modal.js';
import './chat-panel.js';

class ItemCard extends LitElement {
  // Disable Shadow DOM styles apply globally
  createRenderRoot() { return this; }

  // Reactive properties
  static properties = {
    item:          { type: Object },
    user:          { type: Object },
    showOffer:     { type: Boolean },
    showChat:      { type: Boolean },
    confirming:    { type: Boolean },
    confirmError:  { type: String },
  };

  // Initialize default states
  constructor() {
    super();
    this.showOffer    = false;
    this.showChat     = false;
    this.confirming   = false;
    this.confirmError = '';
  }

  // Handle the 'Buy' transaction
  handleBuy() {
    this.dispatchEvent(new CustomEvent('navigate', {
      bubbles: true, composed: true,
      detail: { page: 'checkout', item: this.item },
    }));
  }

  // Handle seller confirmation of a sold item
  async handleConfirmSale() {
    this.confirming   = true;
    this.confirmError = '';
    try {
      const res = await fetch(`/api/items/${this.item.id}/confirm-sale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId: this.user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Confirm failed');

      this.dispatchEvent(new CustomEvent('item-updated', {
        bubbles: true, composed: true,
      }));
    } catch (e) {
      this.confirmError = e.message;
    } finally {
      this.confirming = false;
    }
  }

  // Main layout render mapping
  render() {
    const { item, user } = this;

    const isMySale = user && (item.sellerId === user.id || item.sellerName === user.name);
    const isBuyer  = !isMySale;

    const isPaid    = item.paymentStatus === 'paid';

    return html`
      <div class="bg-white rounded-none border border-black transition-all duration-300 overflow-hidden flex flex-col group relative hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[8px_8px_0px_0px_#000]">
        <div class="aspect-square bg-white flex items-center justify-center relative overflow-hidden border-b border-black">
          ${item.image 
            ? html`<img src=${item.image} alt=${item.name} class="w-full h-full object-cover grayscale-0 group-hover:grayscale transition-all duration-300" />` 
            : html`<span class="text-6xl text-black">📦</span>`}
            
          <!-- Badges -->
          <div class="absolute top-4 left-4 bg-white text-black border border-black text-[10px] font-black px-3 py-1.5 rounded-none uppercase tracking-widest">
            ${item.status}
          </div>

          ${isPaid && isMySale ? html`
            <div class="absolute top-4 right-4 bg-emerald-700 text-white border border-black text-[10px] font-black px-3 py-1.5 rounded-none uppercase tracking-widest">💰 Paid</div>
          ` : ''}
          ${isPaid && isBuyer ? html`
            <div class="absolute top-4 right-4 bg-fuchsia-600 text-white border border-black text-[10px] font-black px-3 py-1.5 rounded-none uppercase tracking-widest">⏳ Awaiting</div>
          ` : ''}
        </div>
        
        <div class="p-6 flex-1 flex flex-col">
          <h3 class="font-black text-black text-xl mb-1 uppercase tracking-tighter truncate" title=${item.name}>${item.name}</h3>
          
          <div class="flex items-center gap-2 mb-6">
            <span class="text-xs font-bold text-gray-500 uppercase tracking-widest">by ${item.sellerName || 'User'}</span>
          </div>

          <div class="mt-auto">
            <div class="flex items-end justify-between mb-6">
              <span class="text-3xl font-black text-black">$${item.price}</span>
              ${item.highestOffer ? html`
                <span class="text-[10px] font-black text-white bg-black border border-black px-3 py-1.5 rounded-none uppercase tracking-widest">
                  Offer: $${item.highestOffer}
                </span>
              ` : ''}
            </div>
            
            ${this.confirmError ? html`<p class="text-white text-xs mb-4 font-black bg-black border border-black px-3 py-2 rounded-none text-center uppercase tracking-widest">${this.confirmError}</p>` : ''}
            
            <div class="flex flex-col gap-3">
              <button @click=${() => this.showChat = true} class="w-full py-3 px-4 text-sm font-black border border-black text-black bg-white hover:bg-black hover:text-white transition-all flex items-center justify-center focus:-translate-y-0.5 focus:-translate-x-0.5 focus:shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_#000] active:translate-y-0 active:translate-x-0 active:shadow-none focus:outline-none rounded-none uppercase tracking-widest" title="Chat">
                Chat With Seller
              </button>
              
              <div class="flex gap-3 w-full">
              ${isBuyer ? html`
                <button @click=${() => this.showOffer = true} class="flex-1 py-3 px-2 text-xs font-black border border-black text-black bg-white hover:bg-black hover:text-white transition-all flex items-center justify-center focus:-translate-y-0.5 focus:-translate-x-0.5 focus:shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_#000] active:translate-y-0 active:translate-x-0 active:shadow-none focus:outline-none rounded-none uppercase tracking-widest">
                  Make Offer
                </button>
                <button @click=${this.handleBuy} ?disabled=${isPaid} class="flex-1 py-3 px-2 text-xs font-black bg-orange-600 text-white border border-black hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center focus:-translate-y-0.5 focus:-translate-x-0.5 focus:shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_#000] active:translate-y-0 active:translate-x-0 active:shadow-none focus:outline-none rounded-none uppercase tracking-widest">
                  Buy Now
                </button>
              ` : ''}
              
              ${isMySale && isPaid ? html`
                <button @click=${this.handleConfirmSale} ?disabled=${this.confirming} class="flex-1 py-3 px-2 text-xs font-black bg-emerald-700 text-white border border-black hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_#000] active:translate-y-0 active:translate-x-0 active:shadow-none focus:-translate-y-0.5 focus:-translate-x-0.5 focus:shadow-[4px_4px_0px_0px_#000] focus:outline-none rounded-none uppercase tracking-widest">
                  Confirm Sale
                </button>
              ` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      ${this.showOffer ? html`
        <offer-modal
          .item=${item}
          .user=${user}
          @close-modal=${() => this.showOffer = false}
          @offer-made=${() => {
            this.showOffer = false;
            this.dispatchEvent(new CustomEvent('item-updated', { bubbles: true, composed: true }));
          }}
        ></offer-modal>
      ` : ''}

      ${this.showChat ? html`
        <chat-panel
          .item=${item}
          .user=${user}
          @close-chat=${() => this.showChat = false}
        ></chat-panel>
      ` : ''}
    `;
  }
}

customElements.define('item-card', ItemCard);