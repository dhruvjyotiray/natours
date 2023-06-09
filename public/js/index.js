import { login, logout } from "./login";
import { displayMap } from "./mapbox";
import { updateSettings } from "./updateSettings";
import { bookTour } from "./stripe";
import { showAlert } from "./alerts";
import "core-js/stable";
import "regenerator-runtime/runtime";

//DOM ELEMENTS
const mapBox = document.getElementById("map");
const loginForm = document.querySelector(".form--login");
const logOutBtn = document.querySelector(".nav__el--logout");
const userDataForm = document.querySelector(".form-user-data");
const userPasswordForm = document.querySelector(".form-user-password");
const bookBtn = document.getElementById("book-tour");
const alertMessage = document.querySelector("body").dataset.alert;

//DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    //VALUES
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    login(email, password);
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener("click", logout);
}

if (userDataForm) {
  // Update the label text when a file is selected
  document.getElementById("photo").addEventListener("change", function () {
    const fileName =
      this.files && this.files.length > 0 ? this.files[0].name : "";
    const photoLabel = document.querySelector('label[for="photo"]');
    photoLabel.textContent = fileName || "Choose new photo";
  });

  userDataForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    document.querySelector(".btn--save-settings").textContent = "Updating...";

    //VALUES
    const form = new FormData();

    form.append("name", document.getElementById("name").value);
    form.append("email", document.getElementById("email").value);
    form.append("photo", document.getElementById("photo").files[0]);

    await updateSettings(form, "Data");

    document.querySelector(".btn--save-settings").textContent = "Save settings";

    setTimeout(() => {
      location.reload();
    }, 1500);
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    document.querySelector(".btn--save-password").textContent = "Updating...";

    //VALUES
    const passwordCurrent = document.getElementById("password-current").value;
    const passwordNew = document.getElementById("password").value;
    const passwordNewConfirm =
      document.getElementById("password-confirm").value;

    await updateSettings(
      { passwordCurrent, passwordNew, passwordNewConfirm },
      "Password"
    );

    document.getElementById("password-current").value = "";
    document.getElementById("password").value = "";
    document.getElementById("password-confirm").value = "";

    document.querySelector(".btn--save-password").textContent = "Save password";
  });
}

if (bookBtn) {
  bookBtn.addEventListener("click", (event) => {
    event.target.textContent = "Processing...";
    const { tourId } = event.target.dataset;
    bookTour(tourId);
  });
}

if (alertMessage) {
  showAlert("success", alertMessage, 10000);
}
