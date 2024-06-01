document.addEventListener("DOMContentLoaded", function() {
    const homeLink = document.getElementById("home");
    const aboutLink = document.getElementById("about");
    const contactLink = document.getElementById("contact");
    const realtimeTempOption = document.getElementById('realtime-temp');
    const predictedTempOption = document.getElementById('predicted-temp');
    const warningHistoryOption = document.getElementById('warnning-history');
    const mainContent = document.querySelector(".content");
    const userInfo = document.getElementById("user-info");
    
    // 获取用户信息并更新显示
    fetch('/api/user')
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Failed to fetch user info');
            }
        })
        .then(data => {
            if (data.username) {
                userInfo.innerText = `${data.username}`;
            } else {
                userInfo.innerText = '';
            }
        })
        .catch(error => {
            console.error('Error fetching user info:', error);
            userInfo.innerText = '';
        });

    // 设置首页链接的点击事件
    homeLink.addEventListener("click", function(event) {
        event.preventDefault();
        mainContent.innerHTML = "<h2>Welcome to Home Page</h2>";
    });

    // 设置关于我们链接的点击事件
    aboutLink.addEventListener("click", function(event) {
        event.preventDefault();
        mainContent.innerHTML = "<h2>About Us</h2><p>This is the about page content.</p>";
    });

    // 设置联系我们链接的点击事件
    contactLink.addEventListener("click", function(event) {
        event.preventDefault();
        mainContent.innerHTML = "<h2>Contact Us</h2><p>Contact information goes here.</p>";
    });

    // 监听实时温度选项的点击事件
    realtimeTempOption.addEventListener('click', () => {
        // 加载实时温度的页面
        window.location.href = 'realtemp.html';
    });

    // 监听预测温度选项的点击事件
    predictedTempOption.addEventListener('click', () => {
        // 加载预测温度的页面
        window.location.href = 'predtemp.html';
    });

    // 监听历史预警选项的点击事件
    warningHistoryOption.addEventListener('click', () => {
        window.location.href = 'warnninghistory.html';
    });

    // 初始化页面显示为首页内容
    mainContent.innerHTML = "<h2>Welcome to Home Page</h2>";
});
