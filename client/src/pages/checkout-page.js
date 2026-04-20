import { LitElement, html } from 'lit';

class CheckoutPage extends LitElement {
  // Disable Shadow DOM styles apply globally
  createRenderRoot() { return this; }

  // Reactive properties
  static properties = {
    user:    { type: Object },
    item:    { type: Object },
    step:    { type: String },   // 'review' | 'paying' | 'success' | 'error'
    error:   { type: String },
    loading: { type: Boolean },
    // fake card fields
    cardName:   { type: String },
    cardNumber: { type: String },
    cardExpiry: { type: String },
    cardCvc:    { type: String },
  };

  // Initialize default states
  constructor() {
    super();
    this.step      = 'review';
    this.error     = '';
    this.loading   = false;
    this.cardName   = '';
    this.cardNumber = '';
    this.cardExpiry = '';
    this.cardCvc    = '';
  }

  // Extract numeric final price properly handling offers
  get finalPrice() {
    if (!this.item) return 0;
    return this.item.highestOffer ?? this.item.price;
  }

  // Return to market page
  goBack() {
    this.dispatchEvent(new CustomEvent('navigate', {
      bubbles: true, composed: true,
      detail: { page: 'market' },
    }));
  }

  validateCard() {
    if (!this.cardName.trim())                          return 'Please enter the cardholder name.';
    if (this.cardNumber.replace(/\s/g, '').length < 16) return 'Please enter a valid 16-digit card number.';
    if (!this.cardExpiry.match(/^\d{2}\/\d{2}$/))       return 'Expiry must be MM/YY.';
    if (this.cardCvc.length < 3)                        return 'CVC must be at least 3 digits.';
    return null;
  }

  formatCard(val) {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  }

  formatExpiry(val) {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    return clean.length > 2 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean;
  }

  async confirmPayment() {
    const err = this.validateCard();
    if (err) { this.error = err; return; }

    this.error   = '';
    this.loading = true;
    this.step    = 'paying';

    try {
      const res = await fetch(`/api/items/${this.item.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId: this.user.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');

      this.step = 'success';
    } catch (e) {
      this.error = e.message;
      this.step  = 'review';
    } finally {
      this.loading = false;
    }
  }

  // Main layout render mapping
  render() {
    if (!this.item) {
      return html`
        <div class="min-h-screen bg-white flex items-center justify-center font-sans">
          <div class="text-center border border-black bg-white p-12">
            <div class="text-5xl mb-4 grayscale">😕</div>
            <p class="text-black mb-8 font-black uppercase tracking-widest">No item selected for checkout.</p>
            <button @click=${this.goBack}
              class="bg-black hover:bg-gray-800 text-white border border-black px-8 py-4 rounded-none text-sm font-black uppercase tracking-widest transition-colors">
              Back to Showroom
            </button>
          </div>
        </div>`;
    }

    return html`
      <div class="min-h-screen bg-white flex flex-col font-sans">

        <!-- Top Bar -->
        <nav class="bg-white border-b border-black px-6 py-4 flex items-center gap-4 sticky top-0 z-50">
          <button @click=${this.goBack}
            class="w-12 h-12 border border-black flex items-center justify-center rounded-none bg-white text-black hover:bg-black hover:text-white transition-all text-xl leading-none hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_#000] active:translate-y-0 active:translate-x-0 active:shadow-none">←</button>
          <span class="font-black text-black tracking-tighter uppercase text-2xl">Checkout</span>
        </nav>

        <div class="flex-1 max-w-xl mx-auto w-full px-4 py-12">
          ${this.step === 'success' ? this._renderSuccess() : this._renderForm()}
        </div>
      </div>
    `;
  }

  _renderSuccess() {
    return html`
      <div class="bg-white rounded-none border border-black p-10 text-center relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-4 bg-emerald-700 border-b border-black"></div>
        <div class="w-24 h-24 bg-white border border-black flex items-center justify-center mx-auto mb-6 text-5xl mt-4">✅</div>
        <h2 class="text-4xl font-black text-black mb-2 uppercase tracking-tighter">Payment Submitted</h2>
        <p class="text-black font-bold text-sm mb-2 uppercase tracking-widest">
          Your payment for <span class="bg-black text-white px-2 py-0.5">${this.item.name}</span> has been secured.
        </p>
        <p class="text-gray-500 font-bold text-xs mb-8 uppercase tracking-widest">
          The seller will confirm shipping details shortly.
        </p>
        
        <div class="bg-white rounded-none px-6 py-5 mb-8 text-left border border-black">
          <p class="text-xs text-black font-black uppercase tracking-widest mb-2">Order Summary</p>
          <p class="text-sm font-bold text-black uppercase tracking-widest">${this.item.name}</p>
          <p class="text-3xl font-black text-black mt-2">$${this.finalPrice}</p>
        </div>
        
        <button @click=${this.goBack}
          class="w-full bg-black hover:bg-gray-800 text-white font-black py-4 border border-black rounded-none transition-all uppercase tracking-widest hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0 active:translate-x-0 active:shadow-none">
          Return to Showroom
        </button>
      </div>
    `;
  }

  _renderForm() {
    const isPaying = this.step === 'paying';
    return html`
      <!-- Order Summary Card -->
      <div class="bg-white rounded-none border border-black p-6 mb-6 flex gap-5 items-center transition-all hover:shadow-[8px_8px_0px_0px_#000] group cursor-default">
        <div class="w-24 h-24 bg-white border-r border-black overflow-hidden shrink-0 flex items-center justify-center text-4xl -ml-6 -my-6 mr-0">
          ${this.item.image
            ? html`<img src=${this.item.image} alt=${this.item.name} class="w-full h-full object-cover grayscale-0 hover:grayscale transition-all duration-300"/>`
            : '📦'}
        </div>
        <div class="flex-1 pl-4">
          <p class="font-black text-black text-xl tracking-tighter uppercase mb-1">${this.item.name}</p>
          <p class="text-xs font-bold text-gray-500 uppercase tracking-widest">Sold by ${this.item.sellerName ?? 'Seller'}</p>
        </div>
        <div class="text-right shrink-0">
          ${this.item.highestOffer ? html`
            <p class="text-xs line-through text-black font-bold mb-0.5">$${this.item.price}</p>
          ` : ''}
          <p class="text-black font-black text-3xl">$${this.finalPrice}</p>
        </div>
      </div>

      <!-- Payment Card -->
      <div class="bg-white rounded-none border border-black p-8">
        <p class="text-sm font-black text-black uppercase tracking-widest mb-6 pb-2 border-b border-black">Payment Details</p>

        <!-- Error -->
        ${this.error ? html`
          <div class="bg-white border border-black text-black font-black text-sm px-4 py-3 rounded-none mb-6 text-center uppercase tracking-widest">
            ⚠️ ${this.error}
          </div>
        ` : ''}

        <!-- Card Preview -->
        <div class="bg-black text-white rounded-none p-8 mb-8 relative border border-black">
          <div class="relative z-10">
            <p class="text-white/80 text-[10px] font-black tracking-widest mb-8 uppercase">CREDIT CARD</p>
            <p class="text-white font-mono font-bold text-xl tracking-[0.15em] mb-8">
              ${this.cardNumber || '•••• •••• •••• ••••'}
            </p>
            <div class="flex justify-between items-end">
              <div>
                <p class="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Cardholder</p>
                <p class="text-white text-sm font-bold tracking-widest uppercase">${this.cardName || 'YOUR NAME'}</p>
              </div>
              <div class="text-right">
                <p class="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Expires</p>
                <p class="text-white text-sm font-bold tracking-widest">${this.cardExpiry || 'MM/YY'}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Fields -->
        <div class="space-y-6">
          <!-- Name -->
          <div>
            <label class="block text-xs font-black text-black uppercase tracking-widest mb-2">Cardholder Name</label>
            <input type="text" placeholder="John Smith"
              .value=${this.cardName}
              ?disabled=${isPaying}
              @input=${e => this.cardName = e.target.value}
              class="w-full bg-white border border-black rounded-none px-5 py-4 text-sm
                focus:outline-none focus:-translate-y-0.5 focus:-translate-x-0.5 focus:shadow-[4px_4px_0px_0px_#000] focus:bg-white transition-all
                disabled:opacity-50 font-bold uppercase tracking-widest"/>
          </div>

          <!-- Card number -->
          <div>
            <label class="block text-xs font-black text-black uppercase tracking-widest mb-2">Card Number</label>
            <input type="text" placeholder="1234 5678 9012 3456"
              .value=${this.cardNumber}
              ?disabled=${isPaying}
              maxlength="19"
              @input=${e => this.cardNumber = this.formatCard(e.target.value)}
              class="w-full bg-white border border-black rounded-none px-5 py-4 text-sm font-mono
                focus:outline-none focus:-translate-y-0.5 focus:-translate-x-0.5 focus:shadow-[4px_4px_0px_0px_#000] focus:bg-white transition-all
                disabled:opacity-50 font-bold tracking-wide"/>
          </div>

          <!-- Expiry + CVC -->
          <div class="flex gap-6">
            <div class="flex-1">
              <label class="block text-xs font-black text-black uppercase tracking-widest mb-2">Expiry</label>
              <input type="text" placeholder="MM/YY"
                .value=${this.cardExpiry}
                ?disabled=${isPaying}
                maxlength="5"
                @input=${e => this.cardExpiry = this.formatExpiry(e.target.value)}
                class="w-full bg-white border border-black rounded-none px-5 py-4 text-sm font-mono
                  focus:outline-none focus:-translate-y-0.5 focus:-translate-x-0.5 focus:shadow-[4px_4px_0px_0px_#000] focus:bg-white transition-all
                  disabled:opacity-50 font-bold"/>
            </div>
            <div class="flex-1">
              <label class="block text-xs font-black text-black uppercase tracking-widest mb-2">CVC</label>
              <input type="text" placeholder="•••"
                .value=${this.cardCvc}
                ?disabled=${isPaying}
                maxlength="4"
                @input=${e => this.cardCvc = e.target.value.replace(/\D/g, '').slice(0, 4)}
                class="w-full bg-white border border-black rounded-none px-5 py-4 text-sm font-mono
                  focus:outline-none focus:-translate-y-0.5 focus:-translate-x-0.5 focus:shadow-[4px_4px_0px_0px_#000] focus:bg-white transition-all
                  disabled:opacity-50 font-bold tracking-widest"/>
            </div>
          </div>
        </div>

        <!-- Pay Button -->
        <button
          @click=${this.confirmPayment}
          ?disabled=${isPaying}
          class="mt-8 w-full bg-orange-600 disabled:opacity-60 text-white
            font-black py-4 border border-black rounded-none transition-all duration-300 text-lg flex items-center justify-center gap-2 uppercase tracking-widest hover:bg-black hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0 active:translate-x-0 active:shadow-none">
          ${isPaying ? html`
            <span class="animate-pulse">Processing...</span>
          ` : html`🔒 Pay $${this.finalPrice}`}
        </button>

        <p class="text-center text-[10px] text-gray-500 mt-6 uppercase tracking-widest font-bold">Secured · Encrypted · No real charges</p>
      </div>
    `;
  }
}

customElements.define('checkout-page', CheckoutPage);
