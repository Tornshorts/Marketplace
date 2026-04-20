import { LitElement, html } from "lit";

class LoginPage extends LitElement{
  //Disable Shadow DOM styles apply globally
    createRenderRoot(){return this;}

    static properties ={
        name:{type: String},
        password:{type:String},
        error:{type:String},
        loading:{type: Boolean},
    };

    // Reactive properties
    constructor(){
        super();
        this.name='';
        this.password='';
        this.error='';
        this.loading=false;
    }


    // Handle login logic
    async handleLogin(){
        if(!this.name || !this.password){
            this.error='Please fill in both fields';
            return;
        }

        // Reset error and show loading state
        this.error = '';
        this.loading = true;

        try{
          // Send login request to backend API
            const res = await fetch('/api/users/login',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({name: this.name, password: this.password}),
            });

            // Parse response data
            const data = await res.json();
            if(!res.ok) throw new Error(data.error || data.message || 'Login failed');
            
            // Emit custom event on successful login
            this.dispatchEvent(new CustomEvent('login-success',{
                bubbles:true, composed:true,
                detail:{user: data},
            }));
        }
        catch(err){
          // Show error message if request fails
            this.error = err.message;
        }finally{
          // Always stop loading state
            this.loading=false;
        }
    }
    
    render() {
      return html`
        <div class="min-h-screen bg-white flex items-center justify-center p-4 font-sans">
          <div class="max-w-md w-full bg-white border border-black p-10 shadow-[12px_12px_0px_0px_#000] transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[16px_16px_0px_0px_#000]">
            <div class="mb-8 border-b border-black pb-4">
              <h2 class="text-4xl font-black text-black mb-1 uppercase tracking-tighter">Marketplace Login</h2>
              <p class="text-sm font-bold text-black uppercase tracking-widest">Sign in to access your items and chat</p>
            </div>

            ${this.error ? html`
              <div class="mb-6 bg-black border border-black text-white px-4 py-3 text-sm font-bold uppercase tracking-wider animate-bounce">
                ${this.error}
              </div>
            ` : ''}

            <div class="space-y-6">
              <div class="group">
                <label class="block text-xs font-black text-black uppercase tracking-widest mb-2 group-focus-within:text-fuchsia-600 transition-colors">Username</label>
                <input
                  type="text"
                  class="w-full px-5 py-4 bg-white border border-black focus:outline-none focus:-translate-y-1 focus:-translate-x-1 focus:shadow-[6px_6px_0px_0px_#000] transition-all text-black font-bold placeholder-gray-300 rounded-none"
                  placeholder="Enter your username"
                  .value=${this.name}
                  @input=${e => this.name = e.target.value}
                  @keydown=${e => e.key === 'Enter' && this.handleLogin()}
                />
              </div>

              <div class="group">
                <label class="block text-xs font-black text-black uppercase tracking-widest mb-2 group-focus-within:text-fuchsia-600 transition-colors">Password</label>
                <input
                  type="password"
                  class="w-full px-5 py-4 bg-white border border-black focus:outline-none focus:-translate-y-1 focus:-translate-x-1 focus:shadow-[6px_6px_0px_0px_#000] transition-all text-black font-bold placeholder-gray-300 rounded-none"
                  placeholder="Enter your password"
                  .value=${this.password}
                  @input=${e => this.password = e.target.value}
                  @keydown=${e => e.key === 'Enter' && this.handleLogin()}
                />
              </div>

              <button
                @click=${this.handleLogin}
                ?disabled=${this.loading}
                class="mt-8 w-full bg-orange-600 border border-black text-white font-black py-4 disabled:opacity-50 transition-all hover:bg-black hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0 active:translate-x-0 active:shadow-none flex justify-center items-center gap-2 uppercase tracking-widest text-lg rounded-none shadow-[4px_4px_0px_0px_#000]"
              >
                ${this.loading ? html`
                  <span class="animate-pulse">Entering...</span>
                ` : 'Enter Showroom'}
              </button>
            </div>
          </div>
        </div>
      `;
    }
}

customElements.define('login-page', LoginPage);