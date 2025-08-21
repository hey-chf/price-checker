// 注册Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker注册成功:', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker注册失败:', err);
            });
    });
}

let currentMode = 'query'; // query or add

// 模式切换
document.getElementById('queryMode').addEventListener('click', () => {
    currentMode = 'query';
    document.getElementById('queryMode').classList.add('active');
    document.getElementById('addMode').classList.remove('active');
    document.getElementById('addForm').style.display = 'none';
});

document.getElementById('addMode').addEventListener('click', () => {
    currentMode = 'add';
    document.getElementById('addMode').classList.add('active');
    document.getElementById('queryMode').classList.remove('active');
    document.getElementById('addForm').style.display = 'block';
});

document.getElementById('scanBtn').addEventListener('click', () => {
    if (!('BarcodeDetector' in window)) {
        alert('您的浏览器不支持扫码功能，请使用最新版Chrome或Edge浏览器');
        return;
    }

    const barcodeDetector = new BarcodeDetector();
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
            const video = document.createElement('video');
            document.body.appendChild(video);
            video.srcObject = stream;
            video.play();

            const detectBarcode = () => {
                barcodeDetector.detect(video)
                    .then(barcodes => {
                        if (barcodes.length > 0) {
                            const barcode = barcodes[0];
                            queryPrice(barcode.rawValue);
                            stream.getTracks().forEach(track => track.stop());
                            video.remove();
                        } else {
                            requestAnimationFrame(detectBarcode);
                        }
                    });
            };
            detectBarcode();
        });
});

async function queryPrice(barcode) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '查询中...';
    
    // 这里需要连接Supabase获取价格
    // 实际使用时需要替换为你的Supabase配置
    const SUPABASE_URL = 'YOUR_SUPABASE_URL';
    const SUPABASE_KEY = 'YOUR_SUPABASE_KEY';
    
    const { createClient } = supabase;
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    const { data, error } = await supabaseClient
        .from('products')
        .select('name, price')
        .eq('barcode', barcode);
    
    if (error) {
        resultDiv.innerHTML = `查询失败: ${error.message}`;
    } else if (data.length > 0) {
        const product = data[0];
        resultDiv.innerHTML = `
            <h3>${product.name}</h3>
            <p>价格: ¥${product.price}</p>
        `;
    } else {
        resultDiv.innerHTML = '未找到该商品';
        if(currentMode === 'add') {
            resultDiv.dataset.barcode = barcode;
            document.getElementById('addForm').style.display = 'block';
        }
    }
}

// 保存商品信息
document.getElementById('saveBtn').addEventListener('click', async () => {
    const barcode = document.getElementById('result').dataset.barcode;
    const name = document.getElementById('productName').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    
    if(!name || isNaN(price)) {
        alert('请填写完整的商品信息');
        return;
    }

    const { error } = await supabaseClient
        .from('products')
        .insert([{ barcode, name, price }]);
    
    if(error) {
        alert(`保存失败: ${error.message}`);
    } else {
        alert('商品信息保存成功');
        document.getElementById('productName').value = '';
        document.getElementById('productPrice').value = '';
        document.getElementById('addForm').style.display = 'none';
    }
});
