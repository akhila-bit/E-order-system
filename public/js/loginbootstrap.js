const menuBtn = document.querySelector(".btn-primary");
const repeatInput = document.querySelector(".new_pss");
const repeatInput_1 = document.querySelector(".user");
const repeatInput_2 = document.querySelector(".new_pss_rpt");
let menuOpen = false;
menuBtn.addEventListener("click", () => {});
document.querySelector("#login").addEventListener("click", () => {

  if (!menuOpen) {
        menuBtn.innerHTML = "Login";

    repeatInput.classList.add("open");
    repeatInput_1.classList.add("open");
    repeatInput_2.classList.add("open");
   document.getElementsByClassName("new_pss_rpt")[0].placeholder = "Password";
    $('.new_pss_rpt').attr('name','passwordlogin')
    menuOpen = true;
  } else {
    menuBtn.innerHTML = "Sign Up";
    repeatInput.classList.remove("open");
    repeatInput_1.classList.remove("open");
    repeatInput_2.classList.remove("open");
    document.getElementsByClassName("new_pss_rpt")[0].placeholder =
      "Repeat Password";
          $('.new_pss_rpt').attr('name','passwordconfirm')

    menuOpen = false;
  }
});

//Modal Popup Controller
function toggle_visibility(id, href) {
  //window.location = "contact-popup";
  window.open(href, "", "width=400,height=200,scrollbars=yes");
  var e = document.getElementById(id);

  if (e.style.display == "block") e.style.display = "none";
  else e.style.display = "block";
}





 function submitaction(){
  if(menuBtn.innerText=="Login"){
      document.querySelector('.form-signin').action="/login"

  }
  else{
          document.querySelector('.form-signin').action="/register"

  }
 }