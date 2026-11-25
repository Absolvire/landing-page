(()=>{
const $=s=>document.querySelector(s),cap=$('#cap-image'),form=$('#cap-configuration');let current={model:'Clasică',color:'Negru',band:'Alb',colorIndex:0},design='none';
const ids=['negru','albastru','visiniu'],format=n=>new Intl.NumberFormat('ro-RO').format(n);
cap.addEventListener('cap:change',e=>{current=e.detail;updateGallery();});
function updateRibbonFeature(){
 const host=$('#selected-ribbon-preview'),source=$('#cap-band-tint svg');
 if(!host||!source)return;
 const svg=source.cloneNode(true);
 svg.setAttribute('viewBox','310 540 765 245');
 svg.removeAttribute('aria-hidden');
 let markup=svg.outerHTML;
 const names=[...svg.querySelectorAll('[id]')].map(n=>n.id).sort((a,b)=>b.length-a.length);
 for(const id of names)markup=markup.split(id).join('feature-'+id);
 host.innerHTML=markup;
 host.style.color=document.querySelector('[data-band-color][aria-pressed="true"]')?.dataset.bandColor||'#ffffff';
 host.setAttribute('aria-label','Panglică '+current.band.toLowerCase());
}
function updateGallery(){updateRibbonFeature();const tassel=$('#selected-tassel-preview');if(tassel)tassel.style.color=['#161616','#064bdc','#b00b35'][current.colorIndex];const focus=['-87.5%','-47%'];cap.style.setProperty('--detail-y',(50+Number.parseFloat(focus[1]))+'%');const detail=$('[data-gallery="3"]');detail.style.setProperty('--medal-x',focus[0]);detail.style.setProperty('--medal-y',focus[1]);document.querySelectorAll('[data-gallery]').forEach(b=>b.setAttribute('aria-pressed',String(cap.dataset.detail==='true'?b.dataset.gallery==='3':b.dataset.gallery==='0')));document.querySelectorAll('[data-gallery]').forEach(button=>{const old=button.querySelector('.cap-thumbnail-layers')||button.querySelector('img');const preview=cap.cloneNode(true);preview.removeAttribute('id');preview.removeAttribute('role');preview.removeAttribute('aria-label');preview.className='cap-thumbnail-layers';preview.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));preview.removeAttribute('data-detail');old.replaceWith(preview);});}
document.querySelectorAll('[data-gallery]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.gallery==='3'){cap.dataset.detail='true';$('#gallery-label').textContent='DETALIU MEDALION';updateGallery();}else{cap.dataset.detail='false';$('#gallery-label').textContent='PREVIZUALIZARE';updateGallery();}}));
function renderDesign(){cap.dataset.personalized=String(design!=='none');const node=document.querySelector('[data-cap-color][aria-pressed="true"]');node?.click();}
function calculate(){const q=Number($('#quantity').value),individual=design==='individual',unit=design==='shared'?70:50;$('#unit-price').textContent=individual?'Preț la cerere':`${unit} lei`;if(!Number.isInteger(q)||q<1||q>10000)return;$('#total').textContent=individual?'La cerere':`${format(q*unit)} lei`;$('#calculation').textContent=individual?`${format(q)} bucăți · design individual; prețul se confirmă în ofertă.`:`${format(q)} × ${unit} lei / bucată${design==='shared'?' (50 + 20 lei personalizare)':''}`;$('#minus').disabled=q===1;$('#plus').disabled=q===10000;}
document.querySelectorAll('[name="design"]').forEach(input=>input.addEventListener('change',()=>{design=input.value;renderDesign();calculate();}));
$('#quantity').addEventListener('input',calculate);$('#quantity').addEventListener('change',()=>{if(!$('#quantity').checkValidity())$('#quantity').value=25;calculate()});for(const [id,delta] of [['minus',-1],['plus',1]])$('#'+id).onclick=()=>{$('#quantity').value=Math.max(1,Math.min(10000,(Number($('#quantity').value)||1)+delta));calculate()};
$('#promotion').addEventListener('input',()=>{const year=$('#promotion').value;document.querySelectorAll('.selected-year').forEach(n=>n.textContent=year);$('#cap-year-badge').textContent=year;$('#cap-year-badge').hidden=year==='2027'||!$('#promotion').checkValidity();$('#cap-medallion').hidden=year!=='2027';updateGallery()});
form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;const q=Number($('#quantity').value),year=$('#promotion').value,mode={none:'Fără personalizare',shared:'Design comun pentru clasă (+20 lei / bucată)',individual:'Design individual (preț la cerere)'}[design];const text=`Tocă de absolvire ${current.model}\nCuloare: ${current.color}\nPanglică: ${current.band}\nPersonalizare: ${mode}\nPromoția: ${year}\nCantitate: ${q} bucăți\nTotal estimat: ${$('#total').textContent}`;$('#request-details').textContent=text;$('#quote-email').href='mailto:comenzi.scoli@gmail.com?subject='+encodeURIComponent('Cerere de ofertă — toci de absolvire')+'&body='+encodeURIComponent(text+'\n\nNume și telefon de contact: ');$('#cap-request').showModal();};$('#cap-request .close').onclick=()=>$('#cap-request').close();calculate();updateGallery();
})();
