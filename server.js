const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// HTML template for the main page
const getHTML = (stats, recentLogs) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 FastFlag Injector - Live Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', 'Cascadia Code', monospace;
        }
        
        body {
            background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%);
            min-height: 100vh;
            padding: 30px;
            color: #fff;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .header h1 {
            font-size: 48px;
            background: linear-gradient(90deg, #00d4ff, #7b2cbf);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        
        .header p {
            color: #a0a0b0;
            font-size: 18px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .stat-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0, 212, 255, 0.2);
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            transition: transform 0.3s;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
            border-color: #00d4ff;
        }
        
        .stat-value {
            font-size: 42px;
            font-weight: bold;
            background: linear-gradient(90deg, #00d4ff, #7b2cbf);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        
        .stat-label {
            color: #a0a0b0;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .section-title {
            font-size: 24px;
            margin: 30px 0 20px;
            color: #00d4ff;
            border-bottom: 2px solid rgba(0, 212, 255, 0.3);
            padding-bottom: 10px;
        }
        
        .logs-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
            gap: 20px;
        }
        
        .log-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px;
            transition: all 0.3s;
        }
        
        .log-card:hover {
            border-color: #00d4ff;
            background: rgba(0, 212, 255, 0.05);
        }
        
        .log-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .log-user {
            font-weight: bold;
            color: #00d4ff;
        }
        
        .log-time {
            color: #a0a0b0;
            font-size: 12px;
        }
        
        .log-process {
            background: rgba(0, 212, 255, 0.1);
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 12px;
            margin-bottom: 15px;
            color: #a0a0b0;
        }
        
        .log-flags {
            background: #0a0a0f;
            border-radius: 8px;
            padding: 15px;
            overflow-x: auto;
        }
        
        .log-flags pre {
            margin: 0;
            color: #00ff00;
            font-size: 12px;
            font-family: 'Cascadia Code', monospace;
        }
        
        .flag-count {
            display: inline-block;
            background: #00d4ff;
            color: #000;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 10px;
        }
        
        .refresh-btn {
            background: linear-gradient(90deg, #00d4ff, #7b2cbf);
            border: none;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin: 20px 0;
            transition: opacity 0.3s;
        }
        
        .refresh-btn:hover {
            opacity: 0.9;
        }
        
        .footer {
            text-align: center;
            margin-top: 50px;
            color: #a0a0b0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 FastFlag Injector Dashboard</h1>
            <p>Real-time injection monitoring - ${stats.totalUsers} users, ${stats.totalInjections} injections</p>
            <button class="refresh-btn" onclick="location.reload()">🔄 Refresh Dashboard</button>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${stats.totalUsers}</div>
                <div class="stat-label">Total Users</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.totalInjections}</div>
                <div class="stat-label">Total Injections</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.totalFlags}</div>
                <div class="stat-label">Total Flags</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.last24h}</div>
                <div class="stat-label">Last 24 Hours</div>
            </div>
        </div>
        
        <h2 class="section-title">📋 Recent Injections</h2>
        <div class="logs-container">
            ${recentLogs.map(log => `
                <div class="log-card">
                    <div class="log-header">
                        <span class="log-user">👤 ${log.user}</span>
                        <span class="log-time">${log.timestamp}</span>
                    </div>
                    <div class="log-process">
                        📁 ${log.processName} (PID: ${log.processId})<br>
                        🔧 ${log.executablePath}
                    </div>
                    <div class="log-flags">
                        <span style="color: #00d4ff">Flags: ${log.flagCount}</span>
                        <pre>${JSON.stringify(log.flags, null, 2)}</pre>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            FastFlag Injector v3.0 • ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>
`;

// Endpoint to receive injections
app.post('/api/log', (req, res) => {
    try {
        const { user, flags, timestamp, processName, processId, executablePath } = req.body;
        
        // Create log entry
        const logEntry = {
            timestamp: timestamp || new Date().toISOString(),
            user: user || 'unknown',
            processName: processName || 'unknown',
            processId: processId || 0,
            executablePath: executablePath || 'unknown',
            flagCount: flags ? Object.keys(flags).length : 0,
            flags: flags || {}
        };
        
        // Save to daily log file
        const date = new Date().toISOString().split('T')[0];
        const logFile = path.join(logsDir, `${date}.json`);
        
        let dailyLogs = [];
        if (fs.existsSync(logFile)) {
            dailyLogs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        }
        
        dailyLogs.push(logEntry);
        fs.writeFileSync(logFile, JSON.stringify(dailyLogs, null, 2));
        
        console.log(`✅ [${new Date().toISOString()}] ${logEntry.user} injected ${logEntry.flagCount} flags`);
        
        res.json({ 
            success: true, 
            message: 'Logged successfully',
            stats: {
                totalToday: dailyLogs.length
            }
        });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get stats and recent logs
app.get('/api/stats', (req, res) => {
    try {
        const files = fs.readdirSync(logsDir);
        const stats = {
            totalUsers: new Set(),
            totalInjections: 0,
            totalFlags: 0,
            last24h: 0
        };
        
        const recentLogs = [];
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        
        // Get last 20 logs from recent files
        files.sort().reverse().forEach(file => {
            if (file.endsWith('.json') && recentLogs.length < 20) {
                const data = JSON.parse(fs.readFileSync(path.join(logsDir, file), 'utf8'));
                stats.totalInjections += data.length;
                
                data.reverse().forEach(entry => {
                    if (recentLogs.length < 20) {
                        recentLogs.push(entry);
                    }
                    
                    stats.totalUsers.add(entry.user);
                    stats.totalFlags += entry.flagCount || 0;
                    
                    const entryTime = new Date(entry.timestamp).getTime();
                    if (entryTime > oneDayAgo) {
                        stats.last24h++;
                    }
                });
            }
        });
        
        stats.totalUsers = stats.totalUsers.size;
        
        res.json({ stats, recentLogs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Main page
app.get('/', (req, res) => {
    try {
        const files = fs.readdirSync(logsDir);
        const stats = {
            totalUsers: new Set(),
            totalInjections: 0,
            totalFlags: 0,
            last24h: 0
        };
        
        const recentLogs = [];
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        
        // Get last 50 logs
        files.sort().reverse().forEach(file => {
            if (file.endsWith('.json')) {
                const data = JSON.parse(fs.readFileSync(path.join(logsDir, file), 'utf8'));
                stats.totalInjections += data.length;
                
                data.reverse().forEach(entry => {
                    if (recentLogs.length < 50) {
                        recentLogs.push(entry);
                    }
                    
                    stats.totalUsers.add(entry.user);
                    stats.totalFlags += entry.flagCount || 0;
                    
                    const entryTime = new Date(entry.timestamp).getTime();
                    if (entryTime > oneDayAgo) {
                        stats.last24h++;
                    }
                });
            }
        });
        
        stats.totalUsers = stats.totalUsers.size;
        
        res.send(getHTML(stats, recentLogs));
    } catch (error) {
        res.status(500).send('Error loading dashboard');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
});
