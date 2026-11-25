(async()=>{
const colors=await fetch('colors.json').then(r=>r.json());
const $=s=>document.querySelector(s);let selected=colors.find(c=>c.id==='alb'),saved=null;
const dark=new Set(['albastru','visiniu','mov','verde','rosu','gri-inchis','caramiziu']);
const preview=$('.scarf-preview');
const previewStage=preview.querySelector('.scarf-image-wrap');
const product=previewStage.querySelector('.scarf-product');
previewStage.dataset.frame='full';
previewStage.setAttribute('role','region');
previewStage.setAttribute('aria-label','Vedere completă a eșarfei');
const frameButtons=[...document.querySelectorAll('.scarf-frame')];
frameButtons.forEach(button=>{
 const copy=product.cloneNode(true);
 copy.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
 const image=copy.querySelector('img');image.classList.add('frame-image');image.alt='';
 button.querySelector('.frame-stage').append(copy);
 button.addEventListener('click',()=>{
  previewStage.dataset.frame=button.dataset.frame;
  previewStage.setAttribute('aria-label',button.getAttribute('aria-label'));
  frameButtons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
 });
});
function syncScarf(){
 preview.querySelectorAll('.scarf-imprint').forEach(node=>node.style.color=dark.has(selected.id)?'white':'#101010');
 preview.querySelectorAll('.frame-image').forEach(image=>image.src=$('#scarf-image').src);
}
$('#scarf-image').addEventListener('scarf:change',e=>{selected=colors.find(c=>c.id===e.detail.id);syncScarf()});
$('#school').oninput=()=>document.querySelectorAll('.school-preview').forEach(node=>node.textContent=$('#school').value.trim()||'Instituția\nvoastră');$('#promotion').oninput=()=>document.querySelectorAll('.year-preview').forEach(node=>node.textContent=$('#promotion').value);
const money=n=>new Intl.NumberFormat('ro-RO').format(n);
function quantity(){const q=Number($('#quantity').value);if(!Number.isInteger(q)||q<1||q>10000)return;$('#pieces').textContent=`${money(q)} ${q===1?'bucată':'bucăți'}`;$('#total').textContent=`${money(q*35)} lei`;$('#calculation').textContent=`${money(q)} × 35 lei`;$('#minus').disabled=q===1;$('#plus').disabled=q===10000;}
$('#quantity').oninput=quantity;$('#quantity').onchange=()=>{if(!$('#quantity').checkValidity())$('#quantity').value=25;quantity()};for(const [id,delta] of [['minus',-1],['plus',1]])$('#'+id).onclick=()=>{$('#quantity').value=Math.min(10000,Math.max(1,(Number($('#quantity').value)||1)+delta));quantity()};
try{saved=JSON.parse(localStorage.getItem('absolvire-scarf-request'))}catch{}
function showRequest(){const text=saved?`Eșarfă de absolvire — ${saved.color}\nInstituția: ${saved.school}\nPromoția: ${saved.year}\nCantitate: ${saved.quantity} bucăți\nTotal estimat: ${money(saved.quantity*35)} lei`:'Nu ai adăugat încă o eșarfă. Alege culoarea și completează datele instituției.';$('#request-details').textContent=text;$('#email').hidden=!saved;$('#email').href='mailto:comenzi.scoli@gmail.com?subject='+encodeURIComponent('Cerere de ofertă — eșarfe de absolvire')+'&body='+encodeURIComponent(text+'\n\nNume și telefon de contact: ');$('#request').showModal()}
$('#configuration').onsubmit=e=>{e.preventDefault();if(!e.currentTarget.reportValidity())return;saved={color:selected.label,school:$('#school').value.trim(),year:$('#promotion').value,quantity:Number($('#quantity').value)};if(!saved.school){$('#school').setCustomValidity('Completează denumirea instituției.');$('#school').reportValidity();return}try{localStorage.setItem('absolvire-scarf-request',JSON.stringify(saved))}catch{}showRequest()};$('#school').addEventListener('input',()=>$('#school').setCustomValidity(''));$('.close').onclick=()=>$('#request').close();syncScarf();quantity();
})();
