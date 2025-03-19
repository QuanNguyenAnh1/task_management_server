const { exec } = require('child_process');

const PORT = process.env.PORT || 3002;

// Hàm tìm và kill process đang sử dụng port
function killProcessOnPort() {
  return new Promise((resolve, reject) => {
    // Lệnh tìm process ID (PID) khác nhau giữa Windows và Unix-based systems
    const findCommand = process.platform === 'win32'
      ? `netstat -ano | findstr :${PORT}`
      : `lsof -i :${PORT} | grep LISTEN`;

    exec(findCommand, (error, stdout, stderr) => {
      if (error) {
        // Nếu không tìm thấy process nào, có thể coi là thành công
        if (error.code === 1) {
          console.log(`No process found using port ${PORT}`);
          return resolve();
        }
        return reject(new Error(`Failed to find process: ${error.message}`));
      }

      if (!stdout) {
        console.log(`No process found using port ${PORT}`);
        return resolve();
      }

      // Xử lý output để lấy PID
      let pid;
      if (process.platform === 'win32') {
        // Trên Windows, PID là cột cuối cùng
        const lines = stdout.split('\n');
        for (const line of lines) {
          if (line.includes(`LISTENING`)) {
            const parts = line.trim().split(/\s+/);
            pid = parts[parts.length - 1];
            break;
          }
        }
      } else {
        // Trên Unix-based systems, PID là cột thứ 2
        const lines = stdout.split('\n');
        if (lines.length > 0) {
          const parts = lines[0].trim().split(/\s+/);
          pid = parts[1];
        }
      }

      if (!pid) {
        console.log(`No process found using port ${PORT}`);
        return resolve();
      }

      console.log(`Found process ${pid} using port ${PORT}, killing it...`);

      // Kill process
      const killCommand = process.platform === 'win32'
        ? `taskkill /F /PID ${pid}`
        : `kill -9 ${pid}`;

      exec(killCommand, (killError) => {
        if (killError) {
          return reject(new Error(`Failed to kill process: ${killError.message}`));
        }
        console.log(`Successfully killed process ${pid}`);
        resolve();
      });
    });
  });
}

// Thực thi hàm
killProcessOnPort()
  .then(() => {
    console.log(`Port ${PORT} is now available`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });