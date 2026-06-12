import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/report/t1/pdf/download',
  method: 'GET',
};

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Content-Type:', res.headers['content-type']);
  console.log('Content-Disposition:', res.headers['content-disposition']);
  console.log('Content-Length:', res.headers['content-length']);

  const chunks = [];
  res.on('data', (chunk) => {
    chunks.push(chunk);
  });

  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    console.log('Total size:', buffer.length, 'bytes');
    
    // 检查PDF文件头
    const header = buffer.slice(0, 5).toString();
    console.log('File header:', header);
    console.log('Is PDF:', header === '%PDF-');
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.end();
