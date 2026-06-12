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

async function checkTask() {
  console.log('=== 检查任务', taskId, '===\n');
  
  const res = await getRequest(`/api/tasks/${taskId}`);
  const data = JSON.parse(res.data.toString());
  
  console.log('任务状态:', data.task?.status);
  console.log('任务进度:', data.task?.progress, '%');
  
  console.log('\n--- 上传的探测器文件 ---');
  const detFile = data.task?.uploadedDetectorFile;
  if (detFile) {
    console.log('文件名:', detFile.fileName);
    console.log('解析配置:', JSON.stringify(detFile.parsedDetectorConfig, null, 2));
  } else {
    console.log('(无)');
  }
  
  console.log('\n--- 上传的噪声文件 ---');
  const noiseFile = data.task?.uploadedNoiseFile;
  if (noiseFile) {
    console.log('文件名:', noiseFile.fileName);
    console.log('模型名称:', noiseFile.parsedNoiseModel?.name);
    console.log('模型版本:', noiseFile.parsedNoiseModel?.version);
    console.log('谱数据点数:', noiseFile.parsedNoiseModel?.spectrum?.frequencies?.length);
  } else {
    console.log('(无)');
  }
  
  console.log('\n--- 结果数据 ---');
  const result = data.result;
  if (result) {
    console.log('SNR:', result.snr);
    console.log('灵敏度曲线点数:', result.sensitivityCurve?.frequencies?.length);
    
    if (result.sensitivityCurve?.values?.length > 0) {
      const freqs = result.sensitivityCurve.frequencies;
      const vals = result.sensitivityCurve.values;
      const mid = Math.floor(freqs.length / 2);
      console.log('起始点:', freqs[0].toFixed(1), 'Hz,', vals[0].toExponential(2));
      console.log('中间点:', freqs[mid].toFixed(1), 'Hz,', vals[mid].toExponential(2));
      console.log('结束点:', freqs[freqs.length - 1].toFixed(1), 'Hz,', vals[freqs.length - 1].toExponential(2));
    }
  } else {
    console.log('(暂无结果)');
  }

  console.log('\n--- 噪声模拟结果（检查是否使用了上传的谱）---');
  if (result?.noisePowerSpectrum) {
    const np = result.noisePowerSpectrum;
    const uploadedFreqs = noiseFile?.parsedNoiseModel?.spectrum?.frequencies;
    console.log('噪声谱点数:', np.frequencies.length);
    console.log('上传的谱点数:', uploadedFreqs?.length || 'N/A');
    console.log('点数是否一致:', np.frequencies.length === uploadedFreqs?.length);
  }

  console.log('\n=== 检查完成 ===');
}

checkTask().catch(console.error);
