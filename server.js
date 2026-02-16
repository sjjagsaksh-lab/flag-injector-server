const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '50mb' }));

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

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
        
        console.log(`[${new Date().toISOString()}] Received from ${logEntry.user}: ${logEntry.flagCount} flags`);
        
        res.json({ 
            success: true, 
            message: 'Logged successfully',
            stats: {
                totalToday: dailyLogs.length
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get stats
app.get('/api/stats', (req, res) => {
    try {
        const files = fs.readdirSync(logsDir);
        const stats = {
            totalUsers: new Set(),
            totalInjections: 0,
            totalFlags: 0,
            last24h: 0
        };
        
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        
        files.forEach(file => {
            if (file.endsWith('.json')) {
                const data = JSON.parse(fs.readFileSync(path.join(logsDir, file), 'utf8'));
                stats.totalInjections += data.length;
                
                data.forEach(entry => {
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
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Simple web interface to view logs
app.get('/', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>Flag Injector Stats</title>
            <style>
                body { font-family: Arial; background: #1a1a2e; color: #fff; padding: 20px; }
                .stats { background: #16213e; padding: 20px; border-radius: 10px; }
                .stat { margin: 10px 0; font-size: 18px; }
                .value { color: #00ff00; font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>🚀 Flag Injector Server</h1>
            <div class="stats" id="stats">Loading...</div>
            <script>
                fetch('/api/stats')
                    .then(r => r.json())
                    .then(stats => {
                        document.getElementById('stats').innerHTML = \`
                            <div class="stat">📊 Total Users: <span class="value">\${stats.totalUsers}</span></div>
                            <div class="stat">💉 Total Injections: <span class="value">\${stats.totalInjections}</span></div>
                            <div class="stat">🚩 Total Flags: <span class="value">\${stats.totalFlags}</span></div>
                            <div class="stat">⏱️ Last 24h: <span class="value">\${stats.last24h}</span></div>
                        \`;
                    });
            </script>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
