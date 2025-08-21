// 配置Supabase客户端
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_KEY';

// 从CDN加载Supabase客户端库
const script = document.createElement('script');
script.src = 'https://unpkg.com/@supabase/supabase-js@2';
script.onload = () => {
    window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
};
document.head.appendChild(script);