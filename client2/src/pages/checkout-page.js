import { LitElement, html } from 'lit';

class CheckoutPage extends LitElement {
  createRenderRoot() { return this; }

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

  get finalPrice() {
    if (!this.item) return 0;
    return this.item.highestOffer ?? this.item.price;
  }

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

  render() {
    if (!this.item) {
      return html`
        <div class="min-h-screen bg-gray-50 flex items-center justify-center">
          <div class="text-center">
            <div class="text-5xl mb-4 opacity-70">😕</div>
            <p class="text-gray-500 mb-6 font-medium">No item selected for checkout.</p>
            <button @click=${this.goBack}
              class="bg-gradient-to-r from-purple-500 to-indigo-400 text-white px-6 py-3 rounded-full text-sm font-semibold hover:shadow-md transition">
              Back to Showroom
            </button>
          </div>
        </div>`;
    }

    return html`
      <div class="min-h-screen bg-gray-50 flex flex-col">

        <!-- Top Bar -->
        <nav class="bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center gap-4 sticky top-0 z-50">
          <button @click=${this.goBack}
            class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition text-xl leading-none">←</button>
          <span class="font-extrabold text-gray-900 tracking-tight text-lg">Checkout</span>
        </nav>

        <div class="flex-1 max-w-xl mx-auto w-full px-4 py-8 md:py-12">

          ${this.step === 'success' ? this._renderSuccess() : this._renderForm()}

        </div>
      </div>
    `;
  }

  _renderSuccess() {
    return html`
      <div class="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-10 text-center relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-green-400"></div>
        <div class="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6 text-5xl">✅</div>
        <h2 class="text-2xl font-extrabold text-gray-900 mb-2">Payment Submitted!</h2>
        <p class="text-gray-500 text-sm mb-2">
          Your payment for <strong>${this.item.name}</strong> has been secured.
        </p>
        <p class="text-gray-400 text-xs mb-8">
          The seller will confirm shipping details shortly.
        </p>
        
        <div class="bg-gray-50 rounded-2xl px-6 py-5 mb-8 text-left border border-gray-100">
          <p class="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Order Summary</p>
          <p class="text-sm font-medium text-gray-900">${this.item.name}</p>
          <p class="text-xl font-bold text-purple-600 mt-1">$${this.finalPrice}</p>
        </div>
        
        <button @click=${this.goBack}
          class="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3.5 rounded-full transition shadow-sm">
          Return to Showroom
        </button>
      </div>
    `;
  }

  _renderForm() {
    const isPaying = this.step === 'paying';
    return html`
      <!-- Order Summary Card -->
      <div class="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6 flex gap-5 items-center">
        <div class="w-20 h-20 rounded-2xl bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center text-4xl">
          ${this.item.image
            ? html`<img src=${this.item.image} alt=${this.item.name} class="w-full h-full object-cover"/>`
            : '📦'}
        </div>
        <div class="flex-1">
          <p class="font-bold text-gray-900 text-lg tracking-tight mb-1">${this.item.name}</p>
          <p class="text-xs font-medium text-gray-400">Sold by ${this.item.sellerName ?? 'Seller'}</p>
        </div>
        <div class="text-right shrink-0">
          ${this.item.highestOffer ? html`
            <p class="text-xs line-through text-gray-300 font-medium mb-0.5">$${this.item.price}</p>
          ` : ''}
          <p class="text-purple-600 font-extrabold text-2xl">$${this.finalPrice}</p>
        </div>
      </div>

      <!-- Payment Card -->
      <div class="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6">Payment Details</p>

        <!-- Error -->
        ${this.error ? html`
          <div class="bg-red-50 text-red-500 font-medium text-xs px-4 py-3 rounded-xl mb-6 text-center">
            ⚠️ ${this.error}
          </div>
        ` : ''}

        <!-- Card Preview -->
        <div class="bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-2xl p-6 mb-8 relative overflow-hidden shadow-lg shadow-purple-200">
          <div class="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
          <div class="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full translate-y-1/3 -translate-x-1/4 blur-xl"></div>
          <div class="relative z-10">
            <p class="text-white/60 text-[10px] font-bold tracking-widest mb-6">CREDIT CARD</p>
            <p class="text-white font-mono text-xl tracking-[0.15em] mb-6 drop-shadow-sm">
              ${this.cardNumber || '•••• •••• •••• ••••'}
            </p>
            <div class="flex justify-between items-end">
              <div>
                <p class="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1">Cardholder</p>
                <p class="text-white text-sm font-medium tracking-wide uppercase">${this.cardName || 'YOUR NAME'}</p>
              </div>
              <div class="text-right">
                <p class="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1">Expires</p>
                <p class="text-white text-sm font-medium tracking-widest">${this.cardExpiry || 'MM/YY'}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Fields -->
        <div class="space-y-5">
          <!-- Name -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Cardholder Name</label>
            <input type="text" placeholder="John Smith"
              .value=${this.cardName}
              ?disabled=${isPaying}
              @input=${e => this.cardName = e.target.value}
              class="w-full bg-gray-50 border-0 rounded-2xl px-5 py-3.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition
                disabled:opacity-50 font-medium"/>
          </div>

          <!-- Card number -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Card Number</label>
            <input type="text" placeholder="1234 5678 9012 3456"
              .value=${this.cardNumber}
              ?disabled=${isPaying}
              maxlength="19"
              @input=${e => this.cardNumber = this.formatCard(e.target.value)}
              class="w-full bg-gray-50 border-0 rounded-2xl px-5 py-3.5 text-sm font-mono
                focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition
                disabled:opacity-50 font-medium tracking-wide"/>
          </div>

          <!-- Expiry + CVC -->
          <div class="flex gap-4">
            <div class="flex-1">
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Expiry</label>
              <input type="text" placeholder="MM/YY"
                .value=${this.cardExpiry}
                ?disabled=${isPaying}
                maxlength="5"
                @input=${e => this.cardExpiry = this.formatExpiry(e.target.value)}
                class="w-full bg-gray-50 border-0 rounded-2xl px-5 py-3.5 text-sm font-mono
                  focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition
                  disabled:opacity-50 font-medium"/>
            </div>
            <div class="flex-1">
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">CVC</label>
              <input type="text" placeholder="•••"
                .value=${this.cardCvc}
                ?disabled=${isPaying}
                maxlength="4"
                @input=${e => this.cardCvc = e.target.value.replace(/\D/g, '').slice(0, 4)}
                class="w-full bg-gray-50 border-0 rounded-2xl px-5 py-3.5 text-sm font-mono
                  focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition
                  disabled:opacity-50 font-medium tracking-widest"/>
            </div>
          </div>
        </div>

        <!-- Pay Button -->
        <button
          @click=${this.confirmPayment}
          ?disabled=${isPaying}
          class="mt-8 w-full bg-gradient-to-r from-purple-500 to-indigo-400 hover:from-purple-600 hover:to-indigo-500 hover:shadow-lg disabled:opacity-60 text-white
            font-bold py-4 rounded-full transition duration-300 text-sm flex items-center justify-center gap-2">
          ${isPaying ? html`
            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            Processing...
          ` : html`🔒 Pay $${this.finalPrice}`}
        </button>

        <p class="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-wider font-semibold">Secured · Encrypted · No real charges</p>
      </div>
    `;
  }
}

customElements.define('checkout-page', CheckoutPage);
