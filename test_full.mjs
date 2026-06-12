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

const taskId = 't1781302367224';

async function waitAndCheck() {
  console.log('等待任务完成...\n');
  
  let taskData;
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const res = await getRequest(`/api/tasks/${taskId}`);
    const data = JSON.parse(res.data.toString());
    taskData = data;
    const status = data.task?.status || 'unknown';
    const progress = data.task?.progress || 0;
    console.log(`  第${i + 1}秒: 状态=${status}, 进度=${progress}%`);
    if (status === 'completed' || status === 'pending_verification' || status === 'error' || status === 'approved') {
      break;
    }
  }

  console.log('\n=== 任务详情 ===');
  console.log('任务名称:', taskData.task?.name);
  console.log('任务状态:', taskData.task?.status);
  
  console.log('\n=== 上传文件信息 ===');
  if (taskData.task?.uploadedDetectorFile) {
    const f = taskData.task.uploadedDetectorFile;
    console.log('探测器文件:');
    console.log('  文件名:', f.fileName);
    console.log('  解析配置:', JSON.stringify(f.parsedDetectorConfig));
  }
  if (taskData.task?.uploadedNoiseFile) {
    const f = taskData.task.uploadedNoiseFile;
    console.log('噪声文件:');
    console.log('  文件名:', f.fileName);
    console.log('  解析版本:', f.parsedNoiseModel?.version);
    console.log('  谱数据点数:', f.parsedNoiseModel?.spectrum?.frequencies?.length);
  }

  console.log('\n=== 结果数据 ===');
  if (taskData.result) {
    console.log('SNR:', taskData.result.snr);
    console.log('灵敏度曲线点数:', taskData.result.sensitivityCurve?.frequencies?.length);
    console.log('噪声功率谱点数:', taskData.result.noisePowerSpectrum?.frequencies?.length);
    
    if (taskData.result.sensitivityCurve?.values?.length > 0) {
      const mid = Math.floor(taskData.result.sensitivityCurve.values.length / 2);
      console.log('中间点频率:', taskData.result.sensitivityCurve.frequencies[mid], 'Hz');
      console.log('中间点灵敏度:', taskData.result.sensitivityCurve.values[mid]);
    }
  }

  console.log('\n=== 报告数据中的版本 ===');
  const reportRes = await getRequest(`/api/report/${taskId}`);
  const reportData = JSON.parse(reportRes.data.toString());
  console.log('探测器显示名称:', reportData.detectorDisplayName);
  console.log('噪声显示名称:', reportData.noiseDisplayName);
  console.log('噪声显示版本:', reportData.noiseDisplayVersion);

  console.log('\n=== PDF下载测试 ===');
  const pdfRes = await getRequest(`/api/report/${taskId}/pdf/download`);
  console.log('状态码:', pdfRes.status);
  console.log('Content-Type:', pdfRes.headers['content-type']);
  console.log('文件大小:', pdfRes.data.length, 'bytes');
  const header = pdfRes.data.slice(0, 5).toString();
  console.log('是否为PDF:', header === '%PDF-');

  if (header === '%PDF-') {
    const filename = pdfRes.headers['content-disposition']?.match(/filename="?([^"]+)"?/)?.[1] || 'unknown';
    console.log('文件名:', decodeURIComponent(filename));
  }

  console.log('\n=== 所有验证完成 ===');
}

waitAndCheck().catch(console.error);
