import http from 'http';

function postRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

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

async function runTests() {
  console.log('=== 测试 1: 上传不合法的探测器文件 ===');
  const badDetectorResult = await postRequest('/api/tasks', {
    name: '测试任务-不合法文件',
    detectorConfigId: 'det1',
    noiseModelId: 'nm1',
    signalSource: { type: 'BBH', mass1: 30, mass2: 20 },
    uploadedDetectorFile: {
      fileName: 'bad.json',
      fileSize: 100,
      uploadedAt: new Date().toISOString(),
      content: '这不是合法的JSON',
      parsedDetectorConfig: { armLength: '不是数字' },
    },
  });
  console.log('状态码:', badDetectorResult.status);
  console.log('返回:', JSON.stringify(badDetectorResult.data, null, 2));
  console.log('✓ 测试1完成\n');

  console.log('=== 测试 2: 上传合法的自定义探测器和噪声文件 ===');
  
  // 构造一个明显不同的谱数据
  const frequencies = [];
  const values = [];
  for (let i = 0; i < 200; i++) {
    const f = 10 * Math.pow(2000 / 10, i / 199);
    frequencies.push(f);
    // 比默认值大100倍，这样灵敏度曲线会明显不同
    values.push(1e-44 * Math.pow(f / 100, -2) * 100);
  }

  const goodResult = await postRequest('/api/tasks', {
    name: '测试-自定义参数验证',
    detectorConfigId: 'det1',
    noiseModelId: 'nm1',
    signalSource: { type: 'BBH', mass1: 30, mass2: 20, distance: 500 },
    uploadedDetectorFile: {
      fileName: 'super_detector.json',
      fileSize: 200,
      uploadedAt: new Date().toISOString(),
      content: JSON.stringify({
        name: '超级探测器-测试版',
        armLength: 20000,
        laserPower: 500,
      }),
      parsedDetectorConfig: {
        name: '超级探测器-测试版',
        armLength: 20000,
        laserPower: 500,
      },
    },
    uploadedNoiseFile: {
      fileName: 'custom_noise.json',
      fileSize: 5000,
      uploadedAt: new Date().toISOString(),
      content: JSON.stringify({
        name: '自定义超高精度噪声模型',
        version: 'v9.9.9_custom',
        spectrum: { frequencies, values },
      }),
      parsedNoiseModel: {
        name: '自定义超高精度噪声模型',
        version: 'v9.9.9_custom',
        spectrum: { frequencies, values },
      },
    },
  });

  console.log('状态码:', goodResult.status);
  console.log('任务ID:', goodResult.data.id);
  console.log('任务名称:', goodResult.data.name);
  console.log('上传探测器文件:', !!goodResult.data.uploadedDetectorFile);
  console.log('上传噪声文件:', !!goodResult.data.uploadedNoiseFile);
  console.log('✓ 测试2完成\n');

  const taskId = goodResult.data.id;

  console.log('=== 测试 3: 等待任务完成并检查结果 ===');
  console.log('等待任务执行...');
  
  // 轮询任务状态
  let taskResult;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const res = await getRequest(`/api/tasks/${taskId}`);
    taskResult = JSON.parse(res.data.toString());
    console.log(`  第${i + 1}秒: 状态=${taskResult.status}, 进度=${taskResult.progress}%`);
    if (taskResult.status === 'completed' || taskResult.status === 'pending_verification' || taskResult.status === 'error') {
      break;
    }
  }

  console.log('最终状态:', taskResult.status);
  
  // 检查上传的文件信息
  console.log('\n上传探测器配置:');
  if (taskResult.uploadedDetectorFile?.parsedDetectorConfig) {
    const c = taskResult.uploadedDetectorFile.parsedDetectorConfig;
    console.log('  名称:', c.name);
    console.log('  臂长:', c.armLength, 'm');
    console.log('  激光功率:', c.laserPower, 'W');
  }

  console.log('\n上传噪声模型:');
  if (taskResult.uploadedNoiseFile?.parsedNoiseModel) {
    const n = taskResult.uploadedNoiseFile.parsedNoiseModel;
    console.log('  名称:', n.name);
    console.log('  版本:', n.version);
    console.log('  谱数据点数:', n.spectrum?.frequencies?.length);
  }
  console.log('✓ 测试3完成\n');

  console.log('=== 测试 4: 检查报告数据中的版本号 ===');
  const reportRes = await getRequest(`/api/report/${taskId}`);
  const reportData = JSON.parse(reportRes.data.toString());
  console.log('报告中的探测器名称:', reportData.detectorDisplayName || reportData.detector?.name);
  console.log('报告中的噪声名称:', reportData.noiseDisplayName || 'N/A');
  console.log('报告中的噪声版本:', reportData.noiseDisplayVersion || 'N/A');
  console.log('✓ 测试4完成\n');

  console.log('=== 测试 5: PDF下载接口 ===');
  const pdfRes = await getRequest(`/api/report/${taskId}/pdf/download`);
  console.log('状态码:', pdfRes.status);
  console.log('Content-Type:', pdfRes.headers['content-type']);
  console.log('Content-Disposition:', pdfRes.headers['content-disposition']);
  console.log('Content-Length:', pdfRes.headers['content-length']);
  console.log('文件大小:', pdfRes.data.length, 'bytes');
  
  // 检查PDF文件头
  const header = pdfRes.data.slice(0, 5).toString();
  console.log('文件头:', header);
  console.log('是否为PDF:', header === '%PDF-');
  console.log('✓ 测试5完成\n');

  console.log('=== 测试 6: 检查灵敏度曲线数据 ===');
  const resultRes = await getRequest(`/api/tasks/${taskId}/result`);
  let resultData;
  try {
    resultData = JSON.parse(resultRes.data.toString());
  } catch (e) {
    console.log('获取结果失败，可能状态不对');
    resultData = null;
  }
  
  if (resultData && resultData.sensitivityCurve) {
    console.log('灵敏度曲线点数:', resultData.sensitivityCurve.frequencies.length);
    console.log('起始频率:', resultData.sensitivityCurve.frequencies[0], 'Hz');
    console.log('结束频率:', resultData.sensitivityCurve.frequencies[resultData.sensitivityCurve.frequencies.length - 1], 'Hz');
    console.log('中间点灵敏度:', resultData.sensitivityCurve.values[Math.floor(resultData.sensitivityCurve.values.length / 2)]);
    console.log('✓ 测试6完成');
  }

  console.log('\n=== 所有测试完成 ===');
}

runTests().catch(console.error);
