import http from 'http';

function getRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: path,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => { chunks.push(chunk); });
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({ status: res.statusCode, data: buffer, headers: res.headers });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testPDF() {
  console.log('=== 测试: 任务t1的PDF下载 ===');
  const pdfRes = await getRequest('/api/report/t1/pdf/download');
  console.log('状态码:', pdfRes.status);
  console.log('Content-Type:', pdfRes.headers['content-type']);
  console.log('Content-Disposition:', pdfRes.headers['content-disposition']);
  console.log('文件大小:', pdfRes.data.length, 'bytes');
  
  const header = pdfRes.data.slice(0, 5).toString();
  console.log('文件头:', header);
  console.log('是否为PDF:', header === '%PDF-');

  if (header === '%PDF-') {
    console.log('\n✓ PDF下载测试通过！');
    
    const filename = pdfRes.headers['content-disposition']?.match(/filename="?([^"]+)"?/)?.[1] || 'unknown';
    console.log('文件名:', decodeURIComponent(filename));
  } else {
    console.log('\n✗ PDF下载测试失败');
    console.log('响应内容:', pdfRes.data.toString().slice(0, 200));
  }
}

async function testReportData() {
  console.log('\n=== 测试: 任务t1的报告数据 ===');
  const res = await getRequest('/api/report/t1');
  const data = JSON.parse(res.data.toString());
  console.log('探测器显示名称:', data.detectorDisplayName || '未设置');
  console.log('噪声模型显示名称:', data.noiseDisplayName || '未设置');
  console.log('噪声模型显示版本:', data.noiseDisplayVersion || '未设置');
  console.log('SNR:', data.summary?.snr);
  
  if (data.task?.uploadedDetectorFile) {
    console.log('\n上传的探测器文件:');
    console.log('  文件名:', data.task.uploadedDetectorFile.fileName);
    console.log('  解析的配置:', JSON.stringify(data.task.uploadedDetectorFile.parsedDetectorConfig));
  }
  
  console.log('\n✓ 报告数据测试完成');
}

async function runAllTests() {
  await testPDF();
  await testReportData();
  console.log('\n=== 所有测试完成 ===');
}

runAllTests().catch(console.error);
