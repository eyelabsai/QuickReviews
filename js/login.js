document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (username === "admin" && password === "letmein") {
    window.location.href = "dashboard.html";
  } else {
    document.getElementById("error").style.display = "block";
  }
});


{
  "hosting": {
    "public": "./",                // Serve from the root directory
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
