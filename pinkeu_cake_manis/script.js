'use strict';

/*
  Pinkeu Cake Manis — versi tanpa backend.
  localStorage dipakai sebagai database lokal browser. Data tersimpan di browser/perangkat ini.
  Untuk database SQL/MySQL multi-pengguna, diperlukan backend terpisah.
*/
const DB_KEY = 'pinkeuCakeManisDB_v1';
const rupiah = value => new Intl.NumberFormat('id-ID', {style:'currency', currency:'IDR', maximumFractionDigits:0}).format(Number(value)||0);
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const dateTime = value => new Date(value).toLocaleString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
const dateOnly = value => new Date(value+'T12:00:00').toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'});
const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const makeId = prefix => `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;

const seed = {
  products:[
    {id:'P001',name:'Strawberry Shortcake',category:'Cake',price:85000,stock:8,emoji:'🍓',description:'Sponge cake lembut dengan krim stroberi.'},
    {id:'P002',name:'Chocolate Fudge Cake',category:'Cake',price:95000,stock:4,emoji:'🍫',description:'Cake cokelat dengan lapisan ganache.'},
    {id:'P003',name:'Red Velvet Slice',category:'Cake',price:28000,stock:14,emoji:'🍰',description:'Potongan red velvet dengan cream cheese.'},
    {id:'P004',name:'Butter Croissant',category:'Pastry',price:18000,stock:20,emoji:'🥐',description:'Pastry berlapis dengan butter.'},
    {id:'P005',name:'Choco Chip Cookies',category:'Cookies',price:35000,stock:3,emoji:'🍪',description:'Cookies renyah dengan choco chips.'},
    {id:'P006',name:'Roti Sobek Cream',category:'Roti',price:25000,stock:12,emoji:'🍞',description:'Roti sobek empuk dengan isian krim.'},
    {id:'P007',name:'Cheesecake Blueberry',category:'Cake',price:78000,stock:6,emoji:'🫐',description:'Cheesecake lembut dengan topping blueberry.'}
  ],
  customers:[
    {id:'C001',name:'Nadia Putri',phone:'081234567890',email:'nadia@example.com',address:'Jember'},
    {id:'C002',name:'Raka Pratama',phone:'082145678901',email:'raka@example.com',address:'Bondowoso'},
    {id:'C003',name:'Pelanggan Umum',phone:'-',email:'-',address:'-'}
  ],
  transactions:[]
};
let db, cart = [], editing = null, modalType = null, salesChart = null, toastTimer = null;

function loadDB(){
  try{
    const raw=localStorage.getItem(DB_KEY);
    if(!raw){ localStorage.setItem(DB_KEY,JSON.stringify(seed)); return structuredClone(seed); }
    const parsed=JSON.parse(raw);
    if(!parsed || !Array.isArray(parsed.products)||!Array.isArray(parsed.customers)||!Array.isArray(parsed.transactions)) throw new Error('Format data tidak sesuai');
    return parsed;
  }catch(error){
    console.error('Gagal membaca data Pinkeu:',error);
    localStorage.setItem(DB_KEY,JSON.stringify(seed));
    return structuredClone(seed);
  }
}
function saveDB(){ try{localStorage.setItem(DB_KEY,JSON.stringify(db));}catch(e){showToast('Penyimpanan gagal. Periksa ruang penyimpanan browser.');throw e;} }
function showToast(message){const el=document.getElementById('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2800);}
function setPage(page){
  document.querySelectorAll('.page').forEach(el=>el.classList.toggle('active',el.id===`page-${page}`));
  document.querySelectorAll('.nav-link').forEach(el=>el.classList.toggle('active',el.dataset.page===page));
  const titles={dashboard:'Dashboard',products:'Produk & Stok',transactions:'Transaksi Penjualan',customers:'Data Pelanggan',reports:'Laporan Penjualan'};
  document.getElementById('pageTitle').textContent=titles[page]||'Dashboard';
  document.getElementById('sidebar').classList.remove('open');
  if(page==='dashboard') renderDashboard();
  if(page==='products') renderProducts();
  if(page==='transactions') renderSaleOptions();
  if(page==='customers') renderCustomers();
  if(page==='reports') renderReports();
}
function productStatus(p){return p.stock<=0?['Habis','out']:p.stock<=5?['Menipis','low']:['Tersedia','good'];}
function renderDashboard(){
  const today=todayISO(), todays=db.transactions.filter(t=>t.date.slice(0,10)===today);
  document.getElementById('statToday').textContent=rupiah(todays.reduce((s,t)=>s+t.total,0));
  document.getElementById('statTodayCount').textContent=`${todays.length} transaksi`;
  document.getElementById('statProducts').textContent=db.products.length;
  document.getElementById('statCustomers').textContent=db.customers.length;
  document.getElementById('statLowStock').textContent=db.products.filter(p=>p.stock<=5).length;
  const low=db.products.filter(p=>p.stock<=5).sort((a,b)=>a.stock-b.stock);
  document.getElementById('lowStockList').innerHTML=low.length?low.slice(0,5).map(p=>`<div class="stock-row"><div class="product-dot">${safe(p.emoji||'🍰')}</div><div class="stock-info"><b>${safe(p.name)}</b><small>${safe(p.category)}</small></div><span class="stock-count">${p.stock} tersisa</span></div>`).join(''):'<div class="empty-inline">Semua stok produk aman. ✨</div>';
  const recent=[...db.transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
  document.getElementById('recentTransactions').innerHTML=recent.length?recent.map(t=>`<tr><td><b>${safe(t.id)}</b></td><td>${safe(dateTime(t.date))}</td><td>${safe(t.customerName)}</td><td><b>${rupiah(t.total)}</b></td><td>${safe(t.payment)}</td></tr>`).join(''):'<tr><td colspan="5" class="empty-inline">Belum ada transaksi. Transaksi yang disimpan akan muncul di sini.</td></tr>';
  renderChart();
}
function renderChart(){
  const canvas=document.getElementById('salesChart'); if(!canvas||!window.Chart)return;
  const labels=[],values=[];
  for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const iso=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;labels.push(d.toLocaleDateString('id-ID',{weekday:'short'}));values.push(db.transactions.filter(t=>t.date.slice(0,10)===iso).reduce((s,t)=>s+t.total,0));}
  if(salesChart)salesChart.destroy();
  salesChart=new Chart(canvas,{type:'line',data:{labels,datasets:[{label:'Penjualan',data:values,borderColor:'#e86f9c',backgroundColor:'rgba(232,111,156,.12)',fill:true,tension:.35,borderWidth:3,pointRadius:4,pointBackgroundColor:'#fff',pointBorderColor:'#e86f9c',pointBorderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>rupiah(c.raw)}}},scales:{y:{beginAtZero:true,ticks:{font:{size:10},callback:v=>v>=1000000?(v/1000000)+' jt':v>=1000?(v/1000)+' rb':v},grid:{color:'#f5edf1'}},x:{grid:{display:false},ticks:{font:{size:10}}}}}});
}
function renderProducts(){
  const query=(document.getElementById('productSearch').value||'').toLowerCase(),category=document.getElementById('productCategoryFilter').value,stock=document.getElementById('stockFilter').value;
  const items=db.products.filter(p=>(p.name+' '+p.category).toLowerCase().includes(query)&&(!category||p.category===category)&&(!stock||(stock==='low'?p.stock<=5:p.stock>5))).sort((a,b)=>a.name.localeCompare(b.name));
  document.getElementById('productsTable').innerHTML=items.map(p=>{const [label,cls]=productStatus(p);return `<tr><td><div class="table-product"><div class="product-dot">${safe(p.emoji||'🍰')}</div><div><b>${safe(p.name)}</b><small>${safe(p.description||'')}</small></div></div></td><td>${safe(p.category)}</td><td><b>${rupiah(p.price)}</b></td><td>${p.stock} pcs</td><td><span class="status ${cls}">${label}</span></td><td><div class="action-group"><button class="action-btn" data-action="edit-product" data-id="${safe(p.id)}">Edit</button><button class="action-btn delete" data-action="delete-product" data-id="${safe(p.id)}">Hapus</button></div></td></tr>`}).join('');
  document.getElementById('productsEmpty').classList.toggle('hidden',items.length>0);
}
function renderCustomers(){
  const q=(document.getElementById('customerSearch').value||'').toLowerCase();
  const items=db.customers.filter(c=>(c.name+' '+c.phone+' '+c.email+' '+c.address).toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name));
  document.getElementById('customersTable').innerHTML=items.map(c=>`<tr><td><b>${safe(c.name)}</b></td><td>${safe(c.phone)}</td><td>${safe(c.email)}</td><td>${safe(c.address)}</td><td><div class="action-group"><button class="action-btn" data-action="edit-customer" data-id="${safe(c.id)}">Edit</button><button class="action-btn delete" data-action="delete-customer" data-id="${safe(c.id)}">Hapus</button></div></td></tr>`).join('');
  document.getElementById('customersEmpty').classList.toggle('hidden',items.length>0);
}
function renderSaleOptions(){
  const customer=document.getElementById('saleCustomer'),product=document.getElementById('saleProduct');
  customer.innerHTML=db.customers.map(c=>`<option value="${safe(c.id)}">${safe(c.name)}</option>`).join('');
  product.innerHTML='<option value="">Pilih produk...</option>'+db.products.filter(p=>p.stock>0).map(p=>`<option value="${safe(p.id)}">${safe(p.name)} — ${rupiah(p.price)} (stok ${p.stock})</option>`).join('');
  renderCart();
}
function renderCart(){
  document.getElementById('cartTable').innerHTML=cart.length?cart.map(item=>`<tr><td>${safe(item.name)}</td><td>${rupiah(item.price)}</td><td>${item.qty}</td><td><b>${rupiah(item.price*item.qty)}</b></td><td><button class="action-btn delete" data-action="remove-cart" data-id="${safe(item.productId)}" aria-label="Hapus ${safe(item.name)}">×</button></td></tr>`).join(''):'<tr><td colspan="5" class="empty-inline">Belum ada produk di pesanan.</td></tr>';
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0);document.getElementById('cartTotal').textContent=rupiah(total);document.getElementById('paymentTotal').textContent=rupiah(total);updateChange();
}
function updateChange(){
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0),paid=Number(document.getElementById('amountPaid').value)||0;
  document.getElementById('changeDue').textContent=rupiah(Math.max(0,paid-total));
  document.getElementById('paymentHint').textContent=!cart.length?'Tambahkan produk ke pesanan terlebih dahulu.':paid<total?'Uang diterima masih kurang dari total belanja.':`Kembalian yang harus diberikan: ${rupiah(paid-total)}.`;
}
function addCart(){
  const id=document.getElementById('saleProduct').value,qty=Number(document.getElementById('saleQty').value),p=db.products.find(x=>x.id===id);
  if(!p){showToast('Pilih produk terlebih dahulu.');return;}
  if(!Number.isInteger(qty)||qty<1){showToast('Jumlah harus bilangan bulat minimal 1.');return;}
  const existing=cart.find(i=>i.productId===id),already=existing?existing.qty:0;
  if(already+qty>p.stock){showToast(`Stok ${p.name} hanya ${p.stock} pcs.`);return;}
  if(existing)existing.qty+=qty;else cart.push({productId:p.id,name:p.name,price:p.price,qty});
  document.getElementById('saleQty').value=1;renderCart();showToast('Produk ditambahkan ke pesanan.');
}
function completeSale(){
  if(!cart.length){showToast('Pesanan masih kosong.');return;}
  const customer=db.customers.find(c=>c.id===document.getElementById('saleCustomer').value);
  if(!customer){showToast('Tambahkan data pelanggan terlebih dahulu.');return;}
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0),paid=Number(document.getElementById('amountPaid').value);
  if(!Number.isFinite(paid)||paid<total){showToast('Uang diterima harus sama dengan atau lebih besar dari total.');return;}
  for(const item of cart){const p=db.products.find(x=>x.id===item.productId);if(!p||p.stock<item.qty){showToast(`Stok ${item.name} berubah. Periksa pesanan kembali.`);return;}}
  const transaction={id:makeId('TRX'),date:new Date().toISOString(),customerId:customer.id,customerName:customer.name,payment:document.getElementById('paymentMethod').value,items:cart.map(i=>({...i})),total,paid,change:paid-total};
  cart.forEach(item=>{db.products.find(p=>p.id===item.productId).stock-=item.qty;});
  db.transactions.push(transaction);saveDB();cart=[];document.getElementById('amountPaid').value='';renderSaleOptions();renderDashboard();showToast(`Transaksi tersimpan. Kembalian ${rupiah(transaction.change)}.`);
}
function renderReports(){
  const start=document.getElementById('reportStart').value,end=document.getElementById('reportEnd').value;
  const items=[...db.transactions].filter(t=>(!start||t.date.slice(0,10)>=start)&&(!end||t.date.slice(0,10)<=end)).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const revenue=items.reduce((s,t)=>s+t.total,0),count=items.reduce((s,t)=>s+t.items.reduce((n,i)=>n+i.qty,0),0);
  document.getElementById('reportRevenue').textContent=rupiah(revenue);document.getElementById('reportCount').textContent=items.length;document.getElementById('reportItems').textContent=count;
  document.getElementById('reportsTable').innerHTML=items.map(t=>`<tr><td><b>${safe(t.id)}</b></td><td>${safe(dateTime(t.date))}</td><td>${safe(t.customerName)}</td><td>${t.items.reduce((s,i)=>s+i.qty,0)} pcs</td><td>${safe(t.payment)}</td><td><b>${rupiah(t.total)}</b></td><td><button class="action-btn" data-action="view-transaction" data-id="${safe(t.id)}">Detail</button></td></tr>`).join('');
  document.getElementById('reportsEmpty').classList.toggle('hidden',items.length>0);
}
function openModal(type,item=null){
  modalType=type;editing=item?item.id:null;document.getElementById('formError').textContent='';
  const fields=document.getElementById('modalFields');
  if(type==='product'){
    document.getElementById('modalTitle').textContent=item?'Edit Produk':'Tambah Produk';
    fields.innerHTML=`<label class="full">Nama produk<input name="name" required maxlength="70" value="${safe(item?.name||'')}" placeholder="Contoh: Vanilla Birthday Cake"></label><label>Kategori<select name="category" required>${['Cake','Pastry','Cookies','Roti'].map(x=>`<option ${item?.category===x?'selected':''}>${x}</option>`).join('')}</select></label><label>Emoji produk<input name="emoji" maxlength="8" value="${safe(item?.emoji||'🍰')}" placeholder="🍰"></label><label>Harga jual (Rp)<input name="price" type="number" min="1" step="1" required value="${item?.price??''}" placeholder="50000"></label><label>Stok (pcs)<input name="stock" type="number" min="0" step="1" required value="${item?.stock??''}" placeholder="10"></label><label class="full">Deskripsi singkat<textarea name="description" maxlength="160" placeholder="Deskripsi produk">${safe(item?.description||'')}</textarea></label>`;
  }else{
    document.getElementById('modalTitle').textContent=item?'Edit Pelanggan':'Tambah Pelanggan';
    fields.innerHTML=`<label class="full">Nama pelanggan<input name="name" required maxlength="70" value="${safe(item?.name||'')}" placeholder="Nama lengkap"></label><label>No. telepon<input name="phone" required maxlength="20" value="${safe(item?.phone||'')}" placeholder="08xxxxxxxxxx"></label><label>Email<input name="email" type="email" maxlength="100" value="${safe(item?.email||'')}" placeholder="nama@email.com"></label><label class="full">Alamat<textarea name="address" required maxlength="180" placeholder="Kota atau alamat pelanggan">${safe(item?.address||'')}</textarea></label>`;
  }
  document.getElementById('modalBackdrop').classList.remove('hidden');
  const first=fields.querySelector('input');if(first)first.focus();
}
function closeModal(){document.getElementById('modalBackdrop').classList.add('hidden');document.getElementById('entityForm').reset();editing=null;modalType=null;}
function submitModal(event){
  event.preventDefault();const form=new FormData(event.currentTarget),v=Object.fromEntries(form.entries());
  if(!String(v.name||'').trim()){document.getElementById('formError').textContent='Nama wajib diisi.';return;}
  if(modalType==='product'){
    const price=Number(v.price),stock=Number(v.stock);
    if(!Number.isSafeInteger(price)||price<1){document.getElementById('formError').textContent='Harga harus bilangan bulat lebih dari 0.';return;}
    if(!Number.isSafeInteger(stock)||stock<0){document.getElementById('formError').textContent='Stok harus bilangan bulat 0 atau lebih.';return;}
    const item={id:editing||makeId('PRD'),name:v.name.trim(),category:v.category,emoji:v.emoji.trim()||'🍰',price,stock,description:v.description.trim()};
    const idx=db.products.findIndex(p=>p.id===editing);if(idx>=0)db.products[idx]=item;else db.products.push(item);
    saveDB();closeModal();renderProducts();renderDashboard();renderSaleOptions();showToast(editing?'Produk berhasil diperbarui.':'Produk berhasil ditambahkan.');
  }else{
    const item={id:editing||makeId('CUS'),name:v.name.trim(),phone:v.phone.trim(),email:v.email.trim()||'-',address:v.address.trim()};
    const duplicate=db.customers.some(c=>c.id!==editing&&c.name.toLowerCase()===item.name.toLowerCase()&&c.phone===item.phone);
    if(duplicate){document.getElementById('formError').textContent='Pelanggan dengan nama dan nomor telepon tersebut sudah ada.';return;}
    const idx=db.customers.findIndex(c=>c.id===editing);if(idx>=0)db.customers[idx]=item;else db.customers.push(item);
    // Perbarui nama pelanggan pada riwayat jika data pelanggan diedit.
    db.transactions.forEach(t=>{if(t.customerId===item.id)t.customerName=item.name;});
    saveDB();closeModal();renderCustomers();renderDashboard();renderSaleOptions();renderReports();showToast(editing?'Data pelanggan diperbarui.':'Pelanggan berhasil ditambahkan.');
  }
}
function deleteProduct(id){
  const p=db.products.find(x=>x.id===id);if(!p)return;
  if(db.transactions.some(t=>t.items.some(i=>i.productId===id))){showToast('Produk memiliki riwayat transaksi, jadi tidak dapat dihapus. Ubah stok menjadi 0 jika sudah tidak dijual.');return;}
  if(!confirm(`Hapus produk "${p.name}"?`))return;
  db.products=db.products.filter(x=>x.id!==id);cart=cart.filter(i=>i.productId!==id);saveDB();renderProducts();renderDashboard();renderSaleOptions();renderCart();showToast('Produk dihapus.');
}
function deleteCustomer(id){
  const c=db.customers.find(x=>x.id===id);if(!c)return;
  if(db.transactions.some(t=>t.customerId===id)){showToast('Pelanggan memiliki riwayat transaksi dan tidak dapat dihapus.');return;}
  if(!confirm(`Hapus pelanggan "${c.name}"?`))return;
  db.customers=db.customers.filter(x=>x.id!==id);saveDB();renderCustomers();renderDashboard();renderSaleOptions();showToast('Pelanggan dihapus.');
}
function viewTransaction(id){
  const t=db.transactions.find(x=>x.id===id);if(!t)return;
  const details=t.items.map(i=>`• ${i.name} × ${i.qty} = ${rupiah(i.price*i.qty)}`).join('\n');
  alert(`DETAIL TRANSAKSI\n${t.id}\nTanggal: ${dateTime(t.date)}\nPelanggan: ${t.customerName}\n\n${details}\n\nTotal: ${rupiah(t.total)}\nPembayaran: ${t.payment}\nUang diterima: ${rupiah(t.paid)}\nKembalian: ${rupiah(t.change)}`);
}
function resetReport(){document.getElementById('reportStart').value='';document.getElementById('reportEnd').value='';renderReports();}
function init(){
  db=loadDB();
  document.getElementById('todayLabel').textContent=new Date().toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
  document.querySelectorAll('.nav-link').forEach(b=>b.addEventListener('click',()=>setPage(b.dataset.page)));
  document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>setPage(b.dataset.goto)));
  document.getElementById('menuToggle').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));
  document.getElementById('addProductBtn').addEventListener('click',()=>openModal('product'));
  document.getElementById('addCustomerBtn').addEventListener('click',()=>openModal('customer'));
  document.getElementById('productSearch').addEventListener('input',renderProducts);
  document.getElementById('productCategoryFilter').addEventListener('change',renderProducts);
  document.getElementById('stockFilter').addEventListener('change',renderProducts);
  document.getElementById('customerSearch').addEventListener('input',renderCustomers);
  document.getElementById('addToCartBtn').addEventListener('click',addCart);
  document.getElementById('amountPaid').addEventListener('input',updateChange);
  document.getElementById('completeSaleBtn').addEventListener('click',completeSale);
  document.getElementById('clearCartBtn').addEventListener('click',()=>{cart=[];renderCart();showToast('Pesanan dikosongkan.');});
  document.getElementById('filterReportBtn').addEventListener('click',()=>{
    const s=document.getElementById('reportStart').value,e=document.getElementById('reportEnd').value;
    if(s&&e&&s>e){showToast('Tanggal awal tidak boleh melewati tanggal akhir.');return;}renderReports();
  });
  document.getElementById('resetReportBtn').addEventListener('click',resetReport);
  document.getElementById('printReportBtn').addEventListener('click',()=>{renderReports();window.print();});
  document.getElementById('closeModalBtn').addEventListener('click',closeModal);
  document.getElementById('cancelModalBtn').addEventListener('click',closeModal);
  document.getElementById('modalBackdrop').addEventListener('click',e=>{if(e.target.id==='modalBackdrop')closeModal();});
  document.getElementById('entityForm').addEventListener('submit',submitModal);
  document.body.addEventListener('click',e=>{
    const b=e.target.closest('[data-action]');if(!b)return;
    const {action,id}=b.dataset;
    if(action==='edit-product')openModal('product',db.products.find(p=>p.id===id));
    if(action==='delete-product')deleteProduct(id);
    if(action==='edit-customer')openModal('customer',db.customers.find(c=>c.id===id));
    if(action==='delete-customer')deleteCustomer(id);
    if(action==='remove-cart'){cart=cart.filter(i=>i.productId!==id);renderCart();}
    if(action==='view-transaction')viewTransaction(id);
  });
  renderDashboard();renderProducts();renderCustomers();renderSaleOptions();renderReports();
}
document.addEventListener('DOMContentLoaded',init);
