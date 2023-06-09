import { studentWall_backend } from "../../declarations/studentWall_backend";
import { AuthClient } from "@dfinity/auth-client";
import { Actor } from "@dfinity/agent";

let authClient = null;
let principalId = localStorage.getItem('principalId') || "";
let username = localStorage.getItem('username') || "anon";
/* let delArr = document.querySelectorAll(".delete");
 */
let messageId = -1;

async function init() {
    authClient = await AuthClient.create();
    if (principalId != "") {
      Actor.agentOf(studentWall_backend).replaceIdentity(authClient.getIdentity());
    }
    getMessages();
}

//Event Handlers

document.addEventListener("DOMContentLoaded", ready);

document.body.addEventListener( 'click', function (event) {
  if ( event.target.className == 'update' ) {
    updateMsg(event);
  }
});

function updateMsg(event) {
  let post = nthParent(event.target, 2);
  let message = post.querySelector(".postarea").innerText;
  messageId = parseInt(post.id, 10);

  document.getElementById("textarea").value = message;
  document.getElementById("textarea").style.display = "flex";
  document.getElementById("textarea").style.transition = "width 2s, height 2s, background-color 2s";
  document.getElementById("post").style.display = "flex";
  document.getElementById("post").style.transition = "width 2s, height 2s, background-color 2s";

  document.getElementById("topContainer").scrollIntoView();
}

document.body.addEventListener( 'click', function (event) {
  if ( event.target.className == 'delete' ) {
    deleteMsg(event);
  }
});

async function deleteMsg(event) {
  let post = nthParent(event.target, 2);
  let id = parseInt(post.id, 10);
  let result = await studentWall_backend.deleteMessage(id);
  post.style.display = "none";
  post.style.transition = "width 2s, height 2s, background-color 2s";
}

document.getElementById("logout").addEventListener("click", async (e) => {
  principalId = "";
  localStorage.setItem('principalId', principalId);
  document.getElementById("writeMsg").style.display = "none";
  document.getElementById("post").style.display = "none";
  document.getElementById("textarea").style.display = "none";
  showDashboard();
  showLogin(true);
  toggleButtons();
});

document.getElementById("writeMsg").addEventListener("click", async (e) => {
  if (  document.getElementById("post").style.display != "none" && document.getElementById("textarea").style.display != "none") {
    document.getElementById("textarea").style.display = "none";
    document.getElementById("textarea").style.transition = "width 2s, height 2s, background-color 2s";
    document.getElementById("post").style.display = "none";
    document.getElementById("post").style.transition = "width 2s, height 2s, background-color 2s";
  } else {
    document.getElementById("textarea").style.display = "flex";
    document.getElementById("textarea").style.transition = "width 2s, height 2s, background-color 2s";
    document.getElementById("post").style.display = "flex";
    document.getElementById("post").style.transition = "width 2s, height 2s, background-color 2s";
  }
});

document.getElementById("textarea").addEventListener("focus", async (e) => {
  if (document.getElementById("textarea").value == "...") {
  document.getElementById("textarea").value = "";
  }
});

document.getElementById("post").addEventListener("click", (e) => {
  postMessage(e);
});

async function postMessage(e) {
  const button = document.getElementById("post");
  button.setAttribute("disabled", true);
  // send message to backend
  const message = document.getElementById("textarea").value;
  let content = {Text : message};
  if (messageId < 0) {
    let msgId = await studentWall_backend.writeMessage(content, username);
  }
  else {
    let result = await studentWall_backend.updateMessage(messageId, content);
      let id = messageId;
      messageId = -1;
      let postarea = document.getElementById(id).querySelector(".postarea");
      postarea.innerText = message;
      document.getElementById(id).scrollIntoView();
  }
  
  button.removeAttribute("disabled");

  document.getElementById("textarea").value = "";
  document.getElementById("post").style.display = "none";
  document.getElementById("textarea").style.display = "none";
}



document.querySelector("form").addEventListener("submit", async (e) => {

  e.preventDefault();
  //const button = e.target.querySelector("button");

  

  //button.setAttribute("disabled", true);

  // Interact with foo actor, calling the greet method

  if (!authClient) throw new Error("AuthClient not initialized");

  authClient.login({
    onSuccess: handleSuccess,
  });

  const greeting = await studentWall_backend.greet(username);

  //button.removeAttribute("disabled");

  return false;
});

function handleSuccess() {
  principalId = authClient.getIdentity().getPrincipal().toText();
  if (document.getElementById("name").value != "") {  
    username = document.getElementById("name").value;
  } 
  localStorage.setItem('principalId', principalId);
  localStorage.setItem('username', username);
  showLogin(false);
  showDashboard();

  document.getElementById("principalId").innerText = `Principal Id: ${principalId}`;
  document.getElementById("username").innerText = `${username}`;
  document.getElementById("writeMsg").style.display = "block";
  toggleButtons();

  Actor.agentOf(studentWall_backend).replaceIdentity(authClient.getIdentity());
}


// UI functions
function ready() {
  showDashboard();
  if (principalId != "") {
    showLogin(false);
    document.getElementById("principalId").innerText = `Principal Id: ${principalId}`;
    document.getElementById("username").innerText = `${username}`;
    document.getElementById("writeMsg").style.display = "block";
  } else {
    showLogin(true);
  }
};

async function getMessages() {
  var messagesBuffer = await studentWall_backend.getAllMessages();
  loadMessage(messagesBuffer);
}

function loadMessage(messageData) {
  for (let data of messageData) {
    let msg = data.message;
    let user = msg.username;
    let pid = msg.creator;
    let m = parseContent(msg.content);
    let display = principalId == pid ? "inherit" : "none";
    var div = document.createElement('div');
    div.className = `postContainer`;
    div.setAttribute("id", data.id);
    div.setAttribute("href", `#message-${data.id}`);
    var html = `<div class="action-bar">`;
    html += `  <div class="votebox">`;
    html += `    <div class="up vote"></div>`;
    html += `    <div class="num">0</div>`;
    html += `    <div class="down vote"></div>`;
    html += `    <div id="vote-${data.id}">${data.voteCheck}</div>`
    html += `  </div>`;
    html += `  <button class="update" style="display: ${display}"><i class="fas fa-pen"></i></button>`;
    html += `  <button class="delete" style="display: ${display}"><i class="far fa-trash-alt"></i></button>`;
    html += `</div>`;
    html += '<div class="card">';
    html += `  <img id="avatar" src="motoko.gif" alt="Avatar" style="width:100%">`;
    html += '  <div class="container">';
    html += `      <h4>${user}</h4> `;
    html += `      <p id="pid">${pid}</p>`;
    html += `  </div>`;
    html += `</div>`;
    html += `<div class="postarea">${m}</div>`;
    div.innerHTML = html;
    document.getElementById("wall").appendChild(div);
  }
}

function parseContent(content) {
  let str = JSON.stringify(content);
  return str.split("\"")[3];
}

function showLogin(val) {
  if (val === true) {
    const loginElems = document.getElementsByClassName("loginContainer");
    for (var i = 0; i < loginElems.length; i++) {
      loginElems[i].style.display = "block";
    }
  } else {
    const loginElems = document.getElementsByClassName("loginContainer");
    for (var i = 0; i < loginElems.length; i++) {
      loginElems[i].style.display = "none";
    }
  }
}

function showDashboard() {
  if (principalId != "") {
    const Elems = document.getElementsByClassName("dashboardContainer");
    for (var i = 0; i < Elems.length; i++) {
      Elems[i].style.display = "flex";
    }
  } else {
    const Elems = document.getElementsByClassName("dashboardContainer");
    for (var i = 0; i < Elems.length; i++) {
      Elems[i].style.display = "none";
    }
  }
}

function toggleButtons() {
  let update = document.getElementsByClassName("update");
  let del = document.getElementsByClassName("delete");
  for (var i = 0; i < update.length; i++) {
    var updateBtn = update[i];
    var post = nthParent(updateBtn, 2);
    var msgCreator = post.querySelector("#pid").innerText; 
    if (principalId == msgCreator) {
      updateBtn.style.display = "inherit";
    }
    else updateBtn.style.display = "none";
  }
  for (var i = 0; i < del.length; i++) {
    var delBtn = del[i];
    var post = nthParent(delBtn, 2);
    var msgCreator = post.querySelector("#pid").innerText; 
    if (principalId == msgCreator) {
      delBtn.style.display = "inherit";
    }
    else delBtn.style.display = "none";
  }

}

//Utility functions
function nthParent(element, n) {
  while(n-- && element)  
    element = element.parentNode;
  return element;
}


/* document.getElementById("msgBtn").addEventListener("click", async (e) => {
  e.preventDefault();
  const button = document.getElementById("msgBtn");

  const myMessage = document.getElementById("msg").value.toString();

  button.setAttribute("disabled", true);
  // Write message to the wall and display it in the textbox
  const msgId = await studentWall_backend.writeMessage({Text : myMessage});
  const returnVal = await studentWall_backend.getMessage(msgId);
  const msg = JSON.stringify(returnVal['ok'].content);
  document.getElementById("msg").value = "Message: " + msg.split("\"")[3];

  button.removeAttribute("disabled");

  

  return false;
});
 */

/* document.getElementById("login").addEventListener("click", async (e) => {
  if (!authClient) throw new Error("AuthClient not initialized");

  authClient.login({
    onSuccess: handleSuccess,
  });
}); */

init();