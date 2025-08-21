// 全局错误处理器
window.addEventListener('error', (e) => {
    const resultDiv = document.getElementById('result');
    if (e.message.includes('BarcodeDetector')) {
        resultDiv.innerHTML = '扫码功能需要最新版Chrome浏览器';
    } else if (e.message.includes('getUserMedia')) {
        resultDiv.innerHTML = '请允许摄像头权限';
    }
    console.error('Runtime error:', e);
});

// 未处理的Promise rejection
window.addEventListener('unhandledrejection', (e) => {
    alert(`操作失败: ${e.reason.message}`);
});