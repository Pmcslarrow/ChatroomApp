import './App.css';
import io from "socket.io-client"
import {useEffect, useState} from 'react'
import {BrowserRouter, Routes, Route, createHashRouter} from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { get, getDatabase, ref, set, child, onValue } from "firebase/database";
import {sha256} from 'js-sha256'
const socket = io.connect("http://localhost:3001")

/* ######################## Firebase Setup ########################*/
const firebaseConfig = {
  apiKey: "AIzaSyBUmj5104Hb8QA9yvCUv_dxk-76aTlhvB8",
  authDomain: "willamettemajorchatroom.firebaseapp.com",
  projectId: "willamettemajorchatroom",
  storageBucket: "willamettemajorchatroom.appspot.com",
  messagingSenderId: "1084318268943",
  appId: "1:1084318268943:web:549f018da09d0c66f42d7a",
  measurementId: "G-GEN5KBHKVJ"
};
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

/* sha256 hash function */
function CREATE_HASH(password)
{
  var hash = sha256.create()
  hash.update(password)
  return hash.hex()
}


function App() {
  var ACCESS = false

  function Chatroom()
{
  const MAX_SIZE = 6;
  const [message, setMessage] = useState("");
  const [messageRecv, setMessageRecv] = useState("");
  const {state} = useLocation()
  const username = state.username

  function sendMessage()
  {
    updateScreen(message, username, "SENDER");
    socket.emit("SEND_MESSAGE", { message, username });
  }

  function delete_first_node(parent, lst)
  {
    var first = lst[0];
    parent.removeChild(first);
  }

  function adjustCoordinates(element)
  {
    var width = element.offsetWidth;
    if (width <= 50)
    {
      element.style.left = "86%";
    } else if (width > 50 && width <= 125)
    {
      element.style.left = "75%";
    } else if (width > 125 && width < 175){
      element.style.left = "62%";
    } else {
      element.style.left = "50%";
    }
  }

  // Updates the chat list and colors based on sender and/ or receiver
  function updateScreen(message, username, flag)
  {
    const LIST = document.getElementById("messageListId");
    var DIV = document.createElement("div")
    var LI = document.createElement("li");
    LI.innerHTML = message;
    DIV.innerHTML = username;
    DIV.setAttribute("class", "usernameMessage")

    var count = 0;
    for (var child of LIST.children)
    {
      var bottom = child.getBoundingClientRect().bottom;
      if (count++ >= MAX_SIZE || bottom >= 515)
      {
        delete_first_node(LIST, LIST.children)
      }
    }
    
    if (flag === "SENDER") {
        LI.setAttribute("class", "messageSender")
    } else {
      DIV.setAttribute("class", "leftAlign")
    }
    DIV.appendChild(LI)
    LIST.appendChild(DIV);
    adjustCoordinates(LI);
  }


  useEffect(() => {
    socket.on("RECEIVE_MESSAGE", (data) => {
      setMessageRecv(data.message);
      updateScreen(data.message, data.username);
    })
  }, [socket])

  return (
    <>      
    <div className='App'>
        <div className="messageContainer">
            <ul className="messageListClass" id="messageListId"></ul>
          </div>

          <div className="messageBar">
            <input className="messageInputBar" placeholder="Message..." onChange={ (event) => {
              setMessage(event.target.value);
            }}></input>
            <button className="sendButton" onClick={sendMessage}>Send</button>
        </div>
    </div>
    </>
  )
  }

  function LoginScreen()
  {
    var navigate = useNavigate();
    var [typedUser, setUsername] = useState("");
    var [typedPassword, setPassword] = useState("");

    function validateLogin()
    {

      /* Retrieve from database and validate login info */
      const db = getDatabase(app)
      const dbRef = ref(db, "users/" + typedUser)
      onValue(dbRef, (snapshot) => {
        const databaseResponse = snapshot.val()
        if (databaseResponse)
        {
          var databasePassword = databaseResponse.password
          const attemptedPassword = CREATE_HASH(typedPassword)
          if (databasePassword === attemptedPassword)
          {
            ACCESS = true
            navigate("/Chatroom", { state: {username : typedUser }})
          } else {
            alert("Username or Password is incorrect")
          }
        } else {
          alert("Username or Password is incorrect")
        }
      })
      
    }

    return (
      <>
          <div className="usernameDiv" id="usernameDivId">
              <input placeholder='Username' id="usernameInputId" onChange={(event) => {
                setUsername(event.target.value);
              }} required></input>
          </div>

          <div className="passwordDiv" id="passwordDivId">
              <input placeholder='Password' id="passwordInputId" onChange={(event) => {
                setPassword(event.target.value);
              }} required></input>
          </div>

          <div className="signinDiv" id="signinDivId">
            <button id="signinButtonId" type='submit' onClick={() => {(!typedUser || !typedPassword) ? alert("Enter username/password") : validateLogin()}}>Sign In</button>
          </div>
          
          <div className="registerDiv" id="registerDivId">
            <button id="registerButtonId" onClick={() => {navigate("/register")}}>Register</button>
          </div>
      </>

    )
  }

  function Register()
  {
    var navigate = useNavigate();
    var [registerUsername, setUsername] = useState("")
    var [registerPassword, setPassword] = useState("")

    /* createUser() pushes a username and password to the firebase database */
    function createUser() {
      const db = getDatabase();
      const dbRef = ref(db)

      /* Retrieving user data and checking to see if the typed username already exists */
      get(child(dbRef, "users"))
      .then((snapshot) => {

          var users = []
          snapshot.forEach(snap => {
            var user = snap.val().username;
            users.push(user)
          })
          
          var access_token = true
          users.map((user) => {
            if (user == registerUsername)
            {
              access_token = false
              alert("User already exists!")
            }
          })

          if (access_token)
          {
            var hashed_password = CREATE_HASH(registerPassword)
            set(ref(db, 'users/' + registerUsername), {
              username: registerUsername,
              password: hashed_password
            });
            navigate("/")
          }
          
      })
    }


    return (
      <>
        <div className="usernameDiv" id="registerUsernameDiv">
              <input placeholder='Username' onChange={(event) => {setUsername(event.target.value);}} required></input>
          </div>

          <div className="passwordDiv" id="registerPasswordDivId">
              <input placeholder='Password' onChange={(event) => {setPassword(event.target.value);}} required></input>
          </div>

          <div className="signinDiv" id="signinDivId">
            <button id="signinButtonId" type='submit' onClick={() => {createUser()}}>Submit</button>
        </div>
      </>
    )
  }

  function Dashboard()
  {
    return (
      <div></div>
    )
  }
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/Chatroom" element={<Chatroom />} />
        <Route path="/register" element={<Register />} />
        <Route path="/Dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
