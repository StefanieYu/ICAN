document.addEventListener("DOMContentLoaded", function() {
    const eyeIconPassword = document.getElementById("eye-icon-password");
    const passwordInput = document.querySelector("input[name='password']");
    const eyeIconConfirm = document.getElementById("eye-icon-confirm");
    const confirmPasswordInput = document.querySelector("input[name='confirm-password']");
    const registerForm = document.getElementById("signup-form");

    eyeIconPassword.addEventListener("mousedown", function() {
        passwordInput.type = "text";
        eyeIconPassword.src = "icons/eye_icon.png";
    });

    eyeIconPassword.addEventListener("mouseup", function() {
        passwordInput.type = "password";
        eyeIconPassword.src = "icons/eye_slash_icon.png";
    });

    eyeIconPassword.addEventListener("mouseleave", function() {
        passwordInput.type = "password";
        eyeIconPassword.src = "icons/eye_slash_icon.png";
    });

    eyeIconConfirm.addEventListener("mousedown", function() {
        confirmPasswordInput.type = "text";
        eyeIconConfirm.src = "icons/eye_icon.png";
    });

    eyeIconConfirm.addEventListener("mouseup", function() {
        confirmPasswordInput.type = "password";
        eyeIconConfirm.src = "icons/eye_slash_icon.png";
    });

    eyeIconConfirm.addEventListener("mouseleave", function() {
        confirmPasswordInput.type = "password";
        eyeIconConfirm.src = "icons/eye_slash_icon.png";
    });


    registerForm.addEventListener("submit", async function(event) {
        event.preventDefault(); // 阻止表单默认提交行为

        const username = document.querySelector("input[name='username']").value;
        const password = document.querySelector("input[name='password']").value;
        if (passwordInput.value !== confirmPasswordInput.value) {
            event.preventDefault();
            alert("Passwords do not match!");
        }
        else{
            try {
                const response = await fetch("/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ username, password })
                });

                if (response.ok) {
                    // 注册成功，重定向到登录页面或者执行其他操作
                    window.location.href = "/login";
                } else {
                    // 注册失败，显示错误消息
                    const errorMessage = await response.text();
                    alert(errorMessage);
                }
            } catch (error) {
                console.error("An error occurred:", error);
                alert("An error occurred while processing your request.");
            }
        }
    });
});
