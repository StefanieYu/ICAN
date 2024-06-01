document.addEventListener("DOMContentLoaded", function() {
    const eyeIcon = document.getElementById("eye-icon");
    const passwordInput = document.querySelector("input[name='password']");

    eyeIcon.addEventListener("mousedown", function() {
        passwordInput.type = "text";
        eyeIcon.src = "icons/eye_icon.png";
    });

    eyeIcon.addEventListener("mouseup", function() {
        passwordInput.type = "password";
        eyeIcon.src = "icons/eye_slash_icon.png";
    });

    eyeIcon.addEventListener("mouseleave", function() {
        passwordInput.type = "password";
        eyeIcon.src = "icons/eye_slash_icon.png";
    });
    const loginForm = document.getElementById("login-form");

    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault(); // 阻止表单默认提交行为

        const username = document.querySelector("input[name='username']").value;
        const password = document.querySelector("input[name='password']").value;

        try {
            const response = await fetch("/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                // 登录成功，重定向到主页或者执行其他操作
                window.location.href = "/homepage";
            } else {
                // 登录失败，显示错误消息
                const errorMessage = await response.text();
                alert(errorMessage);
            }
        } catch (error) {
            console.error("An error occurred:", error);
            alert("An error occurred while processing your request.");
        }
    });
});


