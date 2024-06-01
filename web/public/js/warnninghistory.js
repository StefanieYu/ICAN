document.addEventListener("DOMContentLoaded", function() {
    const warningsList = document.getElementById("warnings-list");
    const prevPageButton = document.getElementById("prev-page");
    const nextPageButton = document.getElementById("next-page");
    const pageInfo = document.getElementById("page-info");
    
    let currentPage = 1;
    const limit = 10;

    // 加载历史预警信息
    function loadWarnings(page) {
        fetch(`/api/warnings?page=${page}&limit=${limit}`)
            .then(response => {
                console.log('Response received');
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Failed to fetch warnings');
                }
            })
            .then(data => {
                displayWarnings(data.warnings, (page - 1) * limit);
                pageInfo.innerText = `第 ${data.page} 页，共 ${Math.ceil(data.total / data.limit)} 页`;
                currentPage = data.page;
                prevPageButton.disabled = currentPage === 1;
                nextPageButton.disabled = currentPage * limit >= data.total;
            })
            .catch(error => {
                console.error('Error fetching warnings:', error);
                warningsList.innerHTML = '<tr><td colspan="3">加载预警信息时出错。</td></tr>';
            });
    }

    // 显示历史预警信息
    function displayWarnings(warnings, startIndex) {
        warningsList.innerHTML = warnings.map((warning, index) => `
            <tr>
                <td>${startIndex + index + 1}</td>
                <td>${new Date(warning.warning_time).toLocaleString()}</td>
                <td>${warning.warning_content}</td>
            </tr>
        `).join('');
    }

    // 设置分页按钮点击事件
    prevPageButton.addEventListener('click', () => {
        if (currentPage > 1) {
            loadWarnings(currentPage - 1);
        }
    });

    nextPageButton.addEventListener('click', () => {
        loadWarnings(currentPage + 1);
    });

    // 初始化加载第一页的预警信息
    loadWarnings(currentPage);
});
