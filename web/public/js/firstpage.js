document.addEventListener("DOMContentLoaded", function() {
    // 设置网站标题动效
    const websiteTitle = document.getElementById("website-title");
    const titleText = "Your Website Title";
    let index = 0;
    function typeEffect() {
        if (index < titleText.length) {
            websiteTitle.innerHTML += titleText.charAt(index);
            index++;
            setTimeout(typeEffect, 100);
        }
    }
    typeEffect();

    // 设置网站描述动效
    const websiteDescription = document.getElementById("website-description");
    const descriptionText = "Your website description with fancy effects.";
    let descIndex = 0;
    function typeDescription() {
        if (descIndex < descriptionText.length) {
            websiteDescription.innerHTML += descriptionText.charAt(descIndex);
            descIndex++;
            setTimeout(typeDescription, 100);
        }
    }
    typeDescription();

    // 下拉菜单
    const dropdownIcon = document.getElementById("dropdown-icon");
    const dropdownContent = document.getElementById("dropdown-content");
    dropdownIcon.addEventListener("click", function() {
        if (dropdownContent.style.display === "none" || dropdownContent.style.display === "") {
            dropdownContent.style.display = "block";
        } else {
            dropdownContent.style.display = "none";
        }
    });

    // 点击 "Sign In" 跳转到登录界面
    const signInLink = document.querySelector("#dropdown-content a[href='login.html']");
    signInLink.addEventListener("click", function(event) {
        event.preventDefault(); // 阻止默认跳转行为
        window.location.href = "login.html"; // 跳转到登录界面
    });

    // 点击 "Sign Up" 跳转到注册界面
    const signUpLink = document.querySelector("#dropdown-content a[href='register.html']");
    signUpLink.addEventListener("click", function(event) {
        event.preventDefault(); // 阻止默认跳转行为
        window.location.href = "register.html"; // 跳转到注册界面
    });

    // 点击页面其他地方关闭下拉菜单
    document.addEventListener("click", function(event) {
        if (!dropdownIcon.contains(event.target) && !dropdownContent.contains(event.target)) {
            dropdownContent.style.display = "none";
        }
    });
});
