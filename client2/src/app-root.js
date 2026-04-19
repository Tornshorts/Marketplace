// manage navigation

import { LitElement, html } from "lit";
import './pages/chat-panel';
import './pages/login-page';
import './pages/market-page';
import './pages/checkout-page';

class AppRoot extends LitElement{
   createRenderRoot(){return this;}

    static properties = {
        page:         { type: String },
        user:         { type: Object },
        checkoutItem: { type: Object },
    };

    constructor (){
        super();
        this.page         = 'login';
        this.user         = null;
        this.checkoutItem = null;
    }

    handleLogin(e){
        this.user = e.detail.user;
        this.page = 'market';
    }

    handleNavigate(e){
        this.page = e.detail.page;
        if (e.detail.item) {
            this.checkoutItem = e.detail.item;
        }
    }

    render(){
       return html`
        ${this.page === 'login'    ? html`<login-page @login-success=${this.handleLogin}></login-page>` : ''}
        ${this.page === 'market'   ? html`<market-page .user=${this.user} @navigate=${this.handleNavigate}></market-page>` : ''}
        ${this.page === 'checkout' ? html`<checkout-page .user=${this.user} .item=${this.checkoutItem} @navigate=${this.handleNavigate}></checkout-page>` : ''}
        `;
    }
}
customElements.define('app-root', AppRoot);
