(function(){
  const key='noun-number-theme-v1';
  const toggle=document.getElementById('theme-switch');
  const name=document.getElementById('theme-name');
  const meta=document.querySelector('meta[name="theme-color"]');
  if(!toggle||!name)return;
  function useTheme(value,persist){
    const dark=value==='dark';
    document.documentElement.dataset.theme=dark?'dark':'light';
    toggle.checked=dark;
    toggle.setAttribute('aria-checked',String(dark));
    toggle.setAttribute('aria-label',dark?'Тёмная тема включена':'Светлая тема включена');
    name.textContent=dark?'Тёмная':'Светлая';
    if(meta)meta.setAttribute('content',dark?'#101b29':'#142f4a');
    if(persist){try{localStorage.setItem(key,dark?'dark':'light');}catch(e){}}
  }
  useTheme(document.documentElement.dataset.theme==='dark'?'dark':'light',false);
  toggle.addEventListener('change',()=>useTheme(toggle.checked?'dark':'light',true));
})();