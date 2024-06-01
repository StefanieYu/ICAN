const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database'); // 导入数据库配置
const session = require('express-session');
const crypto = require('crypto');

const sessionSecret = crypto.randomBytes(64).toString('hex');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use(session({
    secret: sessionSecret,
    store: db.sessionStore, // 使用数据库中的会话存储
    resave: false,
    saveUninitialized: false, // 如果使用 HTTPS，可以设置为 true
    cookie: { secure: false } // 如果你使用HTTPS，将secure设置为true
}));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'firstpage.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'register.html'));
});

app.get('/homepage', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'homepage.html'));
});

app.get('/realtemp', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'realtemp.html'));
});

app.get('/predtemp', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'predtemp.html'));
});

app.get('/warnninghistory', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'warnninghistory.html'));
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
        const results = await db.query(query, [username, password]);
        if (results.length > 0) {
            req.session.user = { username }; // 在会话中保存用户信息
            res.send('Login successful');
        } else {
            res.status(401).send('Invalid credentials');
        }
    } catch (error) {
        console.error('Error while fetching user: ' + error.message);
        res.status(500).send('Error while fetching user');
    }
});

app.post('/register', (req, res) => {
    res.status(403).send('Permission Denied.');
});

// 获取当前用户信息
app.get('/api/user', (req, res) => {
    if (req.session.user) {
        res.json({ username: req.session.user.username });
    } else {
        res.status(401).json({ error: 'User not logged in' });
    }
});

// 获取可用时间
app.get('/api/available-times', async (req, res) => {
    try {
        const query = "SHOW TABLES LIKE 'temperature_data_%'";
        const results = await db.query(query);
        const times = results.map(row => {
            const timeString = Object.values(row)[0].replace('temperature_data_', '');
            const formattedTime = formatTimeString(timeString);
            return { value: timeString, label: formattedTime };
        });
        times.sort((a, b) => new Date(b.label) - new Date(a.label));
        res.json(times);
    } catch (error) {
        console.error('Error fetching available times: ' + error.message);
        res.status(500).send('Error fetching available times');
    }
});

// 获取特定时间的数据
app.get('/api/temperature/:time', async (req, res) => {
    const { time } = req.params;
    try {
        const query = `SELECT x, y, z, temperature FROM temperature_data_${time}`;
        const results = await db.query(query);
        res.json(results);
    } catch (error) {
        console.error('Error fetching temperature data for time ' + time + ': ' + error.message);
        res.status(500).send('Error fetching temperature data');
    }
});

// 获取指定时间的未来24小时温度预测数据
app.get('/api/prediction/:time', async (req, res) => {
    const { time } = req.params;
    try {
        const predictionTable = `temperature_prediction_${time}`;
        const query = `SELECT hours, min_temperature_prediction AS minTemp, mean_temperature_prediction AS meanTemp FROM ${predictionTable}`;
        console.log(`Executing query: ${query}`);  // Log the query being executed
        const results = await db.query(query);
        console.log(`Query results: ${JSON.stringify(results)}`);  // Log the query results
        if (results.length === 0) {
            console.log(`No prediction data available for time ${time}`);
            return res.status(404).send('No prediction data available');
        }
        res.json(results);
    } catch (error) {
        console.error(`Error fetching prediction data for time ${time}:`, error);
        res.status(500).send(`Error fetching prediction data for time ${time}: ${error.message}`);
    }
});




// 格式化时间字符串
function formatTimeString(timeString) {
    const [year, month, day, hour] = timeString.split('_');
    return `${year}-${month}-${day} ${hour}:00`;
}

// 获取历史预警信息
app.get('/api/warnings', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const countQuery = 'SELECT COUNT(*) as count FROM warnings';
        const countResult = await db.query(countQuery);
        const totalCount = countResult[0].count;

        const query = 'SELECT * FROM warnings ORDER BY warning_time DESC LIMIT ? OFFSET ?';
        const results = await db.query(query, [limit, offset]);

        res.json({
            total: totalCount,
            page: page,
            limit: limit,
            warnings: results
        });
    } catch (error) {
        console.error('Error fetching warnings:', error.message);
        res.status(500).send('Error fetching warnings');
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
    console.error('Server error:', err);
});
