import './App.css';
import io from "socket.io-client"
import {useEffect, useState} from 'react'
import {BrowserRouter, Routes, Route, createHashRouter} from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router-dom';
const socket = io.connect("http://localhost:3001")




function App() {
  var ACCESS = false

  function Chatroom()
{
  const MAX_SIZE = 50;
  const [message, setMessage] = useState("");
  const [messageRecv, setMessageRecv] = useState("");
  const {state} = useLocation()
  const room = state.room
  const username = state.username;

  function sendMessage()
  {
    updateScreen(message, username, "SENDER");
    socket.emit("SEND_MESSAGE", { message, username, room });
  }

  function delete_first_node(parent, lst)
  {
    var first = lst[0];
    parent.removeChild(first);
  }


  // Updates the chat list.   If flag is 1, then its a new user joining a room
  function updateScreen(message, username, flag)
  {
    
    const LIST = document.getElementById("messageListId");
    var LI = document.createElement("li");
    if (flag === 1)
    {
      LI.innerHTML = `${username} joined the channel.`
    } else {
      LI.innerHTML = `[${username}] ${message}`;
    }

    var count = 0;
    for (var child of LIST.children)
    {
      var bottom = child.getBoundingClientRect().bottom;
      if (count++ >= MAX_SIZE || bottom >= 515)
      {
        delete_first_node(LIST, LIST.children)
      }
    }
    

    LIST.appendChild(LI);
  }


  useEffect(() => {
    socket.on("RECEIVE_MESSAGE", (data) => {
      setMessageRecv(data.message);
      updateScreen(data.message, data.username);
    })

    socket.on("USER_JOINED", (data) => {
      updateScreen("New user joined the room", data.user, 1)
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
    var [typedRoom, setRoom] = useState("");

    function validateLogin()
    {
      if (typedRoom !== "" && typedUser !== "")
      {
        socket.emit("JOIN_ROOM", {typedUser, typedRoom})
        navigate("/Chatroom", { state: {username:typedUser, room : typedRoom }})
      }
    }

    return (
      <>
        <div id="titlePage">Willamette.io</div>


        <div className='center'>

              <div className="usernameDiv" id="usernameDivId">
                  <input placeholder='Name' id="usernameInputId" onChange={(event) => {
                    setUsername(event.target.value);
                  }} required></input>
              </div>

              <div className="roomNameDiv" id="roomNameDivId">
                  <input placeholder='Room' id="roomInputId" onChange={(event) => {
                    setRoom(event.target.value);
                  }} required></input>
              </div>


              <div className="signinDiv" id="signinDivId">
                <button id="signinButtonId" type='submit' onClick={() => {validateLogin()}}>Join</button>
              </div>
        </div>
      </>

    )
  }


  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/Chatroom" element={<Chatroom />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
