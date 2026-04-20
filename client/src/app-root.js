// manage navigation

import { LitElement, html } from "lit";
import './pages/chat-panel';
import './pages/login-page';
import './pages/market-page';
import './pages/checkout-page';

class AppRoot extends LitElement{
   // Disable Shadow DOM styles apply globally
   createRenderRoot(){return this;}

    // Reactive properties
    static properties = {
        page:         { type: String },
        user:         { type: Object },
        checkoutItem: { type: Object },
    };

    // Initialize default states
    constructor (){
        super();
        this.page         = 'login';
        this.user         = null;
        this.checkoutItem = null;
    }

    // Handle successful user login
    handleLogin(e){
        this.user = e.detail.user;
        this.page = 'market';
    }

    // Intercept client-side routing and page transitions
    handleNavigate(e){
        this.page = e.detail.page;
        if (e.detail.item) {
            this.checkoutItem = e.detail.item;
        }
    }

    // Main layout router rendering
    render(){
       return html`
        ${this.page === 'login'    ? html`<login-page @login-success=${this.handleLogin}></login-page>` : ''}
        ${this.page === 'market'   ? html`<market-page .user=${this.user} @navigate=${this.handleNavigate}></market-page>` : ''}
        ${this.page === 'checkout' ? html`<checkout-page .user=${this.user} .item=${this.checkoutItem} @navigate=${this.handleNavigate}></checkout-page>` : ''}
        `;
    }
}
customElements.define('app-root', AppRoot);
