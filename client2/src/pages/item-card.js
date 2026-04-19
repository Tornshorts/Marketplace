import { LitElement, html } from 'lit';

import './offer-modal.js';
import './chat-panel.js';

class ItemCard extends LitElement {
  createRenderRoot() { return this; }

  static properties = {
    item:          { type: Object },
    user:          { type: Object },
    showOffer:     { type: Boolean },
    showChat:      { type: Boolean },
    confirming:    { type: Boolean },
    confirmError:  { type: String },
  };

  constructor() {
    super();
    this.showOffer    = false;
    this.showChat     = false;
    this.confirming   = false;
    this.confirmError = '';
  }

  handleBuy() {
    this.dispatchEvent(new CustomEvent('navigate', {
      bubbles: true, composed: true,
      detail: { page: 'checkout', item: this.item },
    }));
  }

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

  render() {
    const { item, user } = this;

    const isMySale = user && (item.sellerId === user.id || item.sellerName === user.name);
    const isBuyer  = !isMySale;

    const isPaid    = item.paymentStatus === 'paid';

    return html`
      <div class="bg-white rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group relative">
        <div class="aspect-square bg-gray-50 flex items-center justify-center relative overflow-hidden">
          ${item.image 
            ? html`<img src=${item.image} alt=${item.name} class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />` 
            : html`<span class="text-6xl text-gray-300">📦</span>`}
            
          <!-- Badges -->
          <div class="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-purple-600 text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wider">
            ${item.status}
          </div>

          ${isPaid && isMySale ? html`
            <div class="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-400 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm">💰 Payment Received</div>
          ` : ''}
          ${isPaid && isBuyer ? html`
            <div class="absolute top-4 right-4 bg-amber-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm">⏳ Awaiting Confirmation</div>
          ` : ''}
        </div>
        
        <div class="p-6 flex-1 flex flex-col">
          <h3 class="font-bold text-gray-900 text-lg mb-1 truncate" title=${item.name}>${item.name}</h3>
          
          <div class="flex items-center gap-2 mb-6">
            <span class="text-xs font-medium text-gray-400">by ${item.sellerName || 'User'}</span>
          </div>

          <div class="mt-auto">
            <div class="flex items-end justify-between mb-6">
              <span class="text-2xl font-bold text-purple-600">$${item.price}</span>
              ${item.highestOffer ? html`
                <span class="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full uppercase tracking-wide">
                  Offer: $${item.highestOffer}
                </span>
              ` : ''}
            </div>
            
            ${this.confirmError ? html`<p class="text-red-500 text-xs mb-4 font-medium bg-red-50 px-3 py-2 rounded-xl text-center">${this.confirmError}</p>` : ''}
            
            <div class="flex gap-2">
              <button @click=${() => this.showChat = true} class="px-5 py-2.5 text-sm font-semibold border border-gray-200 text-gray-500 rounded-full hover:bg-gray-50 hover:text-gray-900 transition flex items-center justify-center focus:ring-2 focus:ring-gray-200 focus:outline-none shrink-0" title="Chat">
                💬
              </button>
              
              ${isBuyer ? html`
                <button @click=${() => this.showOffer = true} class="flex-1 py-2.5 px-2 text-xs sm:text-sm font-semibold border border-purple-200 text-purple-600 bg-white rounded-full hover:bg-purple-50 transition flex items-center justify-center focus:ring-2 focus:ring-purple-200 focus:outline-none">
                  Make Offer
                </button>
                <button @click=${this.handleBuy} ?disabled=${isPaid} class="flex-1 py-2.5 px-2 text-xs sm:text-sm font-semibold bg-gradient-to-r from-purple-500 to-indigo-400 text-white rounded-full hover:from-purple-600 hover:to-indigo-500 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center focus:ring-2 focus:ring-purple-400 focus:outline-none shadow-sm">
                  Buy Now
                </button>
              ` : ''}
              
              ${isMySale && isPaid ? html`
                <button @click=${this.handleConfirmSale} ?disabled=${this.confirming} class="flex-1 py-2.5 text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-400 text-white rounded-full hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center focus:ring-2 focus:ring-green-400 focus:outline-none shadow-sm">
                  Confirm Sale
                </button>
              ` : ''}
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