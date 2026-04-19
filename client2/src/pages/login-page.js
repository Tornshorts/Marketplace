import { LitElement, html } from "lit";

class LoginPage extends LitElement{
    createRenderRoot(){return this;}

    static properties ={
        name:{type: String},
        password:{type:String},
        error:{type:String},
        loading:{type: Boolean},
    };

    constructor(){
        super();
        this.name='';
        this.password='';
        this.error='';
        this.loading=false;
    }

    async handleLogin(){
        if(!this.name || !this.password){
            this.error='Please fill in both fields';
            return;
        }
        this.error = '';
        this.loading = true;

        try{
            const res = await fetch('/api/users/login',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({name: this.name, password: this.password}),
            });

            const data = await res.json();
            if(!res.ok) throw new Error(data.error || data.message || 'Login failed');
            
            this.dispatchEvent(new CustomEvent('login-success',{
                bubbles:true, composed:true,
                detail:{user: data},
            }));
        }
        catch(err){
            this.error = err.message;
        }finally{
            this.loading=false;
        }
    }
    
    render() {
      return html`
        <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
          <div class="max-w-md w-full bg-white rounded-xl shadow-md p-8 border border-gray-100">
            <div class="text-center mb-8">
              <h2 class="text-3xl font-extrabold text-gray-900 mb-2">Marketplace Login</h2>
              <p class="text-sm text-gray-500">Sign in to access your items and chat</p>
            </div>

            ${this.error ? html`
              <div class="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm text-center font-medium">
                ${this.error}
              </div>
            ` : ''}

            <div class="space-y-6">
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Username</label>
                <input
                  type="text"
                  class="w-full px-5 py-3.5 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-green-300 focus:bg-white outline-none transition text-sm"
                  placeholder="Enter your username"
                  .value=${this.name}
                  @input=${e => this.name = e.target.value}
                  @keydown=${e => e.key === 'Enter' && this.handleLogin()}
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Password</label>
                <input
                  type="password"
                  class="w-full px-5 py-3.5 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-purple-300 focus:bg-white outline-none transition text-sm"
                  placeholder="Enter your password"
                  .value=${this.password}
                  @input=${e => this.password = e.target.value}
                  @keydown=${e => e.key === 'Enter' && this.handleLogin()}
                />
              </div>

              <button
                @click=${this.handleLogin}
                ?disabled=${this.loading}
                class="mt-8 w-full bg-gradient-to-r from-purple-500 to-indigo-400 hover:shadow-lg hover:from-purple-600 hover:to-indigo-500 text-white font-bold py-4 rounded-full disabled:opacity-50 transition duration-300 flex justify-center items-center gap-2"
              >
                ${this.loading ? html`
                  <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Entering...
                ` : 'Enter Showroom'}
              </button>
            </div>
          </div>
        </div>
      `;
    }
}

customElements.define('login-page', LoginPage);