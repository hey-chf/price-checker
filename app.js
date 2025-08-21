// 微信浏览器检测
const isWeChat = /MicroMessenger/i.test(navigator.userAgent);
const scannerView = document.createElement('div');
scannerView.className = 'scanner-view';
scannerView.innerHTML = `
    <video id="scanner-video" autoplay playsinline></video>
    <div class="scanner-guide">将条形码对准扫描框</div>
    <button id="cancel-scan" class="cancel-btn">取消</button>
`;
document.body.appendChild(scannerView);
// Polyfill for iOS Chrome
if (!window.BarcodeDetector && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    window.BarcodeDetector = {
        async detect(image) {
            const { data } = await Tesseract.recognize(image);
            const barcode = data.text.match(/\b\d{8,14}\b/);
            return barcode ? [{ rawValue: barcode[0] }] : [];
        }
    };
}

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

document.getElementById('scanBtn').addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        
        const video = document.createElement('video');
        video.playsInline = true;
        video.srcObject = stream;
        document.body.appendChild(video);
        await video.play();
        
        const scanFrame = async () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            
            try {
                const barcodes = await window.BarcodeDetector.detect(canvas);
                if (barcodes.length > 0) {
                    stream.getTracks().forEach(track => track.stop());
                    video.remove();
                    queryPrice(barcodes[0].rawValue);
                } else {
                    requestAnimationFrame(scanFrame);
                }
            } catch (e) {
                console.error('Scan error:', e);
                alert('扫码失败，请尝试对准商品条形码');
            }
        };
        scanFrame();
    } catch (e) {
        alert('摄像头访问失败: ' + e.message);
    }
});

async function queryPrice(barcode) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '查询中...';
    
    // 这里需要连接Supabase获取价格
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
    }
}