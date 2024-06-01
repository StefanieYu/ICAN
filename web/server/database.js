const mysql = require('mysql2');
const { Sequelize } = require('sequelize');
const session = require('express-session'); // 确保引入 express-session
const SequelizeStore = require('connect-session-sequelize')(session.Store);

// 创建数据库连接池
const pool = mysql.createPool({
    connectionLimit: 10,
    host: '39.101.70.247',
    user: 'root', // 替换为你的数据库用户名
    password: 'Zyy200404181109!', // 替换为你的数据库密码
    database: 'my_database' // 替换为你的数据库名称
});

// 封装数据库查询函数
function query(sql, params) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (error, results) => {
            if (error) {
                return reject(error);
            }
            resolve(results);
        });
    });
}

// 配置 Sequelize
const sequelize = new Sequelize('my_database', 'root', 'Zyy200404181109!', {
    host: '39.101.70.247',
    dialect: 'mysql',
    logging: false,
});

// 定义会话表
const sessionStore = new SequelizeStore({
    db: sequelize,
});

// 同步会话表
sessionStore.sync();

// 导出数据库操作函数和会话存储
module.exports = {
    query,
    sequelize,
    sessionStore
};
