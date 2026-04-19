import { LitElement, html } from 'lit';

class MyElement extends LitElement {
  // Disable Shadow DOM so Tailwind styles reach the element
  createRenderRoot() {
    return this;
  }
  // reactive state properties
  static properties ={
    searchQuery:{type: String},
    items:{type: Array},
    loading:{type: Boolean},  
  };

  //initialize properties in a constructor
  constructor (){
    super();
    this.searchQuery='';
    this.items=[];
    this.loading=false;
  }

  //load items when the component first mounts
  connectedCallback(){
    super.connectedCallback();
    this._fetchItems();
  }

  //fetch method

  async _fetchItems(){
    this.loading= true;
    const url = this.searchQuery.trim()
    ?`http://localhost:3000/api/items?search=${encodeURIComponent(this.searchQuery)}`
    : `http://localhost:3000/api/items`

    const res = await fetch(url);
    this.items = await res.json();
    this.loading=false
  }

  //input handler
  _onSearch(e){
    this.searchQuery = e.target.value;
    this._fetchItems();
  }

  render() {
  return html`
    <div class="max-w-4xl mx-auto p-6">
      <h1 class="text-3xl font-bold mb-6">Item Search</h1>
      <!-- Search bar -->
      <input
        id="search-input"
        type="text"
        placeholder="Search items by name or description..."
        .value=${this.searchQuery}
        @input=${this._onSearch}
        class="w-full border border-gray-300 rounded-lg p-3 mb-6 text-lg"
      />
      <!-- Loading state -->
      ${this.loading ? html`<p>Loading...</p>` : ''}
      <!-- Results -->
      <ul class="space-y-4">
        ${this.items.map(item => html`
          <li class="border rounded-lg p-4 flex gap-4">
            <img src=${item.image} alt=${item.name} class="w-24 h-24 object-cover rounded" />
            <div>
              <h2 class="text-xl font-semibold">${item.name}</h2>
              <p class="text-gray-500">${item.description}</p>
              <p class="text-green-600 font-bold mt-1">$${item.price}</p>
            </div>
          </li>
        `)}
      </ul>
      <!-- No results -->
      ${!this.loading && this.items.length === 0 ? html`
        <p class="text-gray-400 text-center mt-10">No items found.</p>
      ` : ''}
    </div>
  `;
}
}

customElements.define('my-element', MyElement);
