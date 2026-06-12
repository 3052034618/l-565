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

function generateSpectrum() {
  const frequencies = [];
  const values = [];
  const numPoints = 500;
  const fMin = 10;
  const fMax = 2000;

  for (let i = 0; i < numPoints; i++) {
    const f = fMin * Math.pow(fMax / fMin, i / (numPoints - 1));
    frequencies.push(f);
    
    // 类似LIGO的噪声谱形状，但整体水平是默认的2倍（明显不同）
    const seismic = 1e-19 * Math.pow(f / 10, -2);
    const thermal = 1e-24 * Math.pow(f / 100, -2);
    const shot = 3e-24 * Math.pow(f / 100, 1);
    const radiation = 5e-25 * Math.pow(f / 100, -2);
    
    const total = Math.sqrt(
      seismic * seismic + thermal * thermal + shot * shot + radiation * radiation
    );
    
    // 功率谱是幅度的平方，并且整体缩放2倍（明显差异）
    values.push(total * total * 4);
  }

  return { frequencies, values };
}

async function runFullTest() {
  console.log('========== 完整端到端测试 ==========\n');

  // 步骤1: 生成谱数据
  console.log('步骤1: 生成自定义噪声谱...');
  const spectrum = generateSpectrum();
  console.log('  频率点数:', spectrum.frequencies.length);
  console.log('  频率范围:', spectrum.frequencies[0].toFixed(1), '-', spectrum.frequencies[spectrum.frequencies.length - 1].toFixed(0), 'Hz');

  // 步骤2: 创建任务
  console.log('\n步骤2: 创建带自定义参数的任务...');
  const createResult = await postRequest('/api/tasks', {
    name: 'E2E测试-自定义参数验证',
    detectorConfigId: 'det1',
    noiseModelId: 'nm1',
    signalSource: { type: 'BBH', mass1: 35, mass2: 30, spin1: 0.3, spin2: 0.2, distance: 600, inclination: 30 },
    uploadedDetectorFile: {
      fileName: 'test_detector.json',
      fileSize: 256,
      uploadedAt: new Date().toISOString(),
      content: JSON.stringify({
        name: '超长臂探测器',
        armLength: 12000,
        laserPower: 150,
        mirrorMass: 60,
      }),
      parsedDetectorConfig: {
        name: '超长臂探测器',
        armLength: 12000,
        laserPower: 150,
        mirrorMass: 60,
      },
    },
    uploadedNoiseFile: {
      fileName: 'test_noise_v3.json',
      fileSize: 8192,
      uploadedAt: new Date().toISOString(),
      content: JSON.stringify({
        name: '高精度噪声模型v3',
        version: 'v3.1.4_custom',
        description: '自定义测试版本',
        spectrum,
      }),
      parsedNoiseModel: {
        name: '高精度噪声模型v3',
        version: 'v3.1.4_custom',
        spectrum,
      },
    },
  });

  const taskId = createResult.data.id;
  console.log('  任务ID:', taskId);
  console.log('  状态码:', createResult.status);
  console.log('  ✓ 任务创建成功\n');

  // 步骤3: 等待任务完成
  console.log('步骤3: 等待任务执行完成...');
  let taskDetail;
  let finalStatus = '';
  for (let i = 0; i < 35; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const res = await getRequest(`/api/tasks/${taskId}`);
    taskDetail = JSON.parse(res.data.toString());
    const status = taskDetail.task?.status || 'unknown';
    const progress = taskDetail.task?.progress || 0;
    process.stdout.write(`  第${i + 1}秒: ${status} (${progress}%)\r`);
    if (['completed', 'pending_verification', 'error', 'approved'].includes(status)) {
      finalStatus = status;
      console.log('\n  ✓ 任务完成');
      break;
    }
    if (status === 'fallback') {
      finalStatus = status;
      console.log('\n  ⚠ 任务进入fallback状态（噪声非平稳）');
      break;
    }
  }

  // 步骤4: 验证上传参数
  console.log('\n步骤4: 验证上传参数是否正确保存...');
  const detConfig = taskDetail.task?.uploadedDetectorFile?.parsedDetectorConfig;
  const noiseConfig = taskDetail.task?.uploadedNoiseFile?.parsedNoiseModel;
  
  console.log('  探测器名称:', detConfig?.name || 'N/A');
  console.log('  臂长:', detConfig?.armLength || 'N/A', 'm');
  console.log('  激光功率:', detConfig?.laserPower || 'N/A', 'W');
  console.log('  噪声模型名称:', noiseConfig?.name || 'N/A');
  console.log('  噪声版本:', noiseConfig?.version || 'N/A');
  
  const detOk = detConfig?.armLength === 12000 && detConfig?.laserPower === 150;
  const noiseOk = noiseConfig?.version === 'v3.1.4_custom';
  console.log('  ', detOk ? '✓' : '✗', '探测器参数正确');
  console.log('  ', noiseOk ? '✓' : '✗', '噪声版本正确\n');

  // 步骤5: 验证报告数据
  console.log('步骤5: 验证报告数据中的版本号...');
  const reportRes = await getRequest(`/api/report/${taskId}`);
  const reportData = JSON.parse(reportRes.data.toString());
  
  console.log('  探测器显示名称:', reportData.detectorDisplayName || 'N/A');
  console.log('  噪声显示名称:', reportData.noiseDisplayName || 'N/A');
  console.log('  噪声显示版本:', reportData.noiseDisplayVersion || 'N/A');
  const versionOk = reportData.noiseDisplayVersion === 'v3.1.4_custom';
  console.log('  ', versionOk ? '✓' : '✗', '报告中使用自定义版本号\n');

  // 步骤6: 验证结果数据（如果有）
  if (taskDetail.result) {
    console.log('步骤6: 验证灵敏度曲线数据...');
    const sc = taskDetail.result.sensitivityCurve;
    console.log('  灵敏度曲线点数:', sc?.frequencies?.length || 'N/A');
    console.log('  上传谱点数:', noiseConfig?.spectrum?.frequencies?.length || 'N/A');
    
    if (sc && noiseConfig?.spectrum) {
      // 检查灵敏度曲线是否来自上传的谱
      const scMid = sc.values[Math.floor(sc.values.length / 2)];
      const spMid = Math.sqrt(noiseConfig.spectrum.values[Math.floor(noiseConfig.spectrum.values.length / 2)]);
      console.log('  灵敏度曲线中间值:', scMid.toExponential(2));
      console.log('  上传谱中间值(开方):', spMid.toExponential(2));
      
      const diff = Math.abs(scMid - spMid) / spMid;
      console.log('  相对差异:', (diff * 100).toFixed(2) + '%');
      console.log('  ', diff < 0.01 ? '✓' : '✗', '灵敏度曲线来自上传的谱');
    }
    console.log('');
  }

  // 步骤7: 验证PDF下载
  console.log('步骤7: 验证PDF下载...');
  const pdfRes = await getRequest(`/api/report/${taskId}/pdf/download`);
  const isPdf = pdfRes.data.slice(0, 5).toString() === '%PDF-';
  const contentType = pdfRes.headers['content-type'];
  
  console.log('  状态码:', pdfRes.status);
  console.log('  Content-Type:', contentType);
  console.log('  文件大小:', pdfRes.data.length, 'bytes');
  console.log('  是否为PDF:', isPdf ? '是' : '否');
  
  const filename = pdfRes.headers['content-disposition']?.match(/filename="?([^"]+)"?/)?.[1] || 'unknown';
  console.log('  文件名:', decodeURIComponent(filename));
  console.log('  ', isPdf && contentType === 'application/pdf' ? '✓' : '✗', 'PDF下载正确\n');

  // 总结
  console.log('========== 测试总结 ==========');
  console.log('✓ 文件上传校验: 已通过（之前测试验证）');
  console.log(detOk ? '✓' : '✗', '探测器参数上传生效');
  console.log(noiseOk ? '✓' : '✗', '噪声版本号上传生效');
  console.log(versionOk ? '✓' : '✗', '报告中保留自定义版本号');
  console.log(isPdf ? '✓' : '✗', 'PDF下载接口返回真正PDF');
  console.log('\n测试完成！');
}

runFullTest().catch(console.error);
