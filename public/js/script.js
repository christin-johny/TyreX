



const imageUpload = document.getElementById("imageUpload");
if (imageUpload) {
  imageUpload.addEventListener("change", function (event) {
    const file = event.target.files[0];
    const imagePreview = document.getElementById("imagePreview");

    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        imagePreview.src = e.target.result;
        imagePreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    } else {
      imagePreview.style.display = "none";
      imagePreview.src = "";
    }
  });
}

//user signup validation
const signForm = document.getElementById("signform");
  const nameId = document.getElementById("name");
  const emailId = document.getElementById("email");
  const phoneId = document.getElementById("phone");
  const passId = document.getElementById("password");
  const cpassId = document.getElementById("cpassword");
  const error1 = document.getElementById("error1");
  const error2 = document.getElementById("error2");
  const error3 = document.getElementById("error3");
  const error4 = document.getElementById("error4");
  const error5 = document.getElementById("error5");

  function nameValidateChecking(e) {
    const nameVal = nameId.value;
    const namePattern = /^[A-Za-z\s]+$/;

    if (nameVal.trim() === "") {
      error1.style.display = "block";
      error1.innerHTML = "Please enter a valid name";
    } else if (!namePattern.test(nameVal)) {
      error1.style.display = "block";
      error1.innerHTML = "Name can only contain alphabets and spaces";
    } else {
      error1.style.display = "none";
      error1.innerHTML = "";
    }
  }



 
  function emailValidateChecking(e) {
    const emailVal = emailId.value;
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(emailVal)) {
      error2.style.display = "block";
      error2.innerHTML = "Invalid Format";
    } else {
      error2.style.display = "none";
      error2.innerHTML = "";
    }
  }

  function phoneValidateChecking(e) {
    const phoneVal = phoneId.value;

    if (phoneVal.trim() === "") {
      error3.style.display = "block";
      error3.innerHTML = "Enter valid phone number";
    } else if (phoneVal.length < 10 || phoneVal.length > 10) {
      error3.style.display = "block";
      error3.innerHTML = "Enter 10 digit";
    } else {
      error3.style.display = "none";
      error3.innerHTML = "";
    }
  }

  function passValidateChecking(e){
    const passVal=passId.value;
    const cpassVal =cpassId.value;
    const alpha=/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
if(passVal.length<8){
    error4.style.display="block";
    error4.innerHTML="Should contain atleast 8 charactors"
}else if(!alpha.test(passVal)){
    error4.style.display="block";
    error4.innerHTML="Password must include uppercase, lowercase, number, and special character"
}else{
    error4.style.display="none";
    error4.innerHTML=""
}

if(passVal !==cpassVal){
    error5.style.display="block";
    error5.innerHTML="Password do not match"
}else{
    error5.style.display="none";
    error5.innerHTML="";
}
  }

  document.addEventListener("DOMContentLoaded", function () {
    signForm.addEventListener("submit", function (e) {
      nameValidateChecking();
      emailValidateChecking();
      phoneValidateChecking();
      passValidateChecking();

      if (
        !nameId ||
        !emailId ||
        !phoneId ||
        !passId ||
        !error1 ||
        !error2 ||
        !error3 ||
        !error4 ||
        !error5 ||
        !signForm
      ) {
        console.error("One or more elements not found");
      }

      if (
        error1.innerHTML ||
        error2.innerHTML ||
        error3.innerHTML ||
        error3.innerHTML ||
        error4.innerHTML ||
        error5.innerHTML
      ) {
        e.preventDefault();
      }
    });
  });




  //Otp verification
  document.getElementById("otp").focus();

  let timer = 60;
  let timerInterval;

  function startTimer() {
    timerInterval = setInterval(() => {
      timer--;
      document.getElementById("timerValue").textContent = timer;
      if (timer <= 0) {
        clearInterval(timerInterval);
        document.getElementById("timerValue").classList.add("expired");
        document.getElementById("timerValue").textContent = "Expired";
        document.getElementById("otp").disabled = true;
      }
    }, 1000);
  }
  startTimer();

  function validateOTPForm() {
    const otpInput = document.getElementById("otp").value;

    $.ajax({
      type: "POST",
      url: "/verifyOtp",
      data: { otp: otpInput },
      success: function (response) {
        if (response.success) {
          Swal.fire({
            icon: "success",
            title: "otp verified successfully",
            showConfirmButton: false,
            timer: 1500,
          }).then(() => {
            window.location.href = response.redirectUrl;
          });
        } else {
          Swal.fire({
            icon: "error",
            title: Error,
            text: response.message,
          });
        }
      },
      error: function () {
        Swal.fire({
          icon: "error",
          title: "Invalid OTP",
          text: "please try again",
        });
      },
    });
    return false;
  }

  function resendOTP() {
    clearInterval(timerInterval);
    timer=60;

    // Clear OTP input field
    document.getElementById("otp").value = "";
    document.getElementById("otp").disabled = false;

    document.getElementById("timerValue").classList.remove("expired");
    startTimer();
    $.ajax({
      type: "POST",
      url: "/resendOtp",
      success: function (response) {
        if (response.success) {
          Swal.fire({
            icon: "success",
            title: "OTP Resent Successfully",
            showConfirmButton: false,
            timer: 1500,
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "An error occurred while resending OTP. Please try again.",
          });
        }
      },
      error: function () {
        Swal.fire({
          icon: "error",
          title: "Server Error",
          text: "Failed to resend OTP. Please try again later.",
        });
      },
    });

    return false;
  }



  function validateEmail(){
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('errorMessage');
    const emailValue = emailInput.value.trim();
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if(emailValue===''){
      emailError.textContent='Please enter your email.';
      emailInput.classList.add('is-invalid');
      return false;
    }else if(!emailValue.match(emailPattern)){
      emailError.textContent="Please enter a valid email address.";
      emailInput.classList.add('is-invalid');
      return false;
    }else{
      emailError.textContent="";
      emailInput.classList.remove('is-invalid');
      return true;
    }
  }


