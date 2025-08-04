document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorElem = document.getElementById("error");

  // Hide error on new attempt
  errorElem.style.display = "none";

  try {
    // Look up Firestore document with this username
    const querySnapshot = await firebase.firestore()
      .collection("users")
      .where("username", "==", username)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      throw new Error("Username not found");
    }

    const userDoc = querySnapshot.docs[0];
    const email = userDoc.data().email;

    // Authenticate using the associated email
    await firebase.auth().signInWithEmailAndPassword(email, password);

    // Redirect on successful login
    window.location.href = "dashboard.html";
  } catch (error) {
    errorElem.innerText = error.message;
    errorElem.style.display = "block";
  }
});
