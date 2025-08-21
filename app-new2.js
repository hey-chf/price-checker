// [保留原有polyfill和初始化代码...]

async function startScan() {
    let stream;
    try {
        // 创建扫码界面
        const scannerView = document.createElement('div');
        scannerView.className = 'scanner-view';
        scannerView.innerHTML = `
            <video id="scanner-video" autoplay playsinline></video>
            <div class="scanner-guide">将条形码对准扫描框</div>
            <button id="cancel-scan" class="cancel-btn">取消</button>
        `;
        document.body.appendChild(scannerView);

        // 获取摄像头
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        const video = document.getElementById('scanner-video');
        video.srcObject = stream;

        // 设置超时
        const timeout = setTimeout(() => {
            alert('扫码超时，请重试');
            closeScanner();
        }, 30000);

        // 绑定取消按钮
        document.getElementById('cancel-scan').onclick = closeScanner;

        // 扫码识别
        const scanFrame = async () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);

            try {
                const barcodes = await window.BarcodeDetector?.detect(canvas) || [];
                if (barcodes.length > 0) {
                    clearTimeout(timeout);
                    const barcode = barcodes[0].rawValue;
                    closeScanner();
                    await queryPrice(barcode);
                    return;
                }
                requestAnimationFrame(scanFrame);
            } catch (e) {
                console.error('扫码错误:', e);
            }
        };
        scanFrame();

        function closeScanner() {
            if (stream) stream.getTracks().forEach(track => track.stop());
            document.querySelector('.scanner-view')?.remove();
            clearTimeout(timeout);
        }
    } catch (e) {
        alert('摄像头访问失败: ' + e.message);
        document.querySelector('.scanner-view')?.remove();
    }
}

// [保留原有queryPrice函数...]