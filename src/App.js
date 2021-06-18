import { useEffect, useState } from "react";
import "./App.css";
import useSocket from "./hooks/useSocket";

function App() {
  const socket = useSocket();
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [room, setRoom] = useState("");
  const [roomId, setRoomId] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (socket?.connected) {
      socket.on("server/join", (id) => {
        console.log("joined room: ", id);
        setRoomId(id);
      });

      socket.on("server/message", (item) => setHistory((s) => [...s, item]));

      setUsername(socket.id);
      setRoomId(socket.id);
    }
  }, [socket]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (socket?.connected) {
      socket.emit("client/message", { username, room: roomId, message });
    } else {
      alert("you are not connected!");
    }
  };

  const handleJoinRoom = (id) => {
    if (socket?.connected) {
      if (roomId !== "") {
        console.log("joining room: " + id);
        socket.emit("client/leave", { username, room: roomId });
        socket.on("server/leave", (prevRoom) => {
          console.log("left room: " + prevRoom);
          socket.emit("client/join", { username, room: id });
          socket.off("server/leave");
        });
      } else socket.emit("client/join", { username, room: id });
    } else {
      alert("you are not connected!");
    }
  };

  const isConnected = socket?.connected;
  const canSendMessage = isConnected && roomId;

  return (
    <div className="App">
      <div>
        <input
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleJoinRoom(room);
        }}
      >
        <input
          type="text"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <input type="submit" disabled={!isConnected} value="join" />
      </form>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <input type="submit" disabled={!canSendMessage} value="send" />
      </form>
      <div>
        <ul>
          {history.map((item, i) => {
            const isJoinable = item.sid !== socket?.id && item.sid !== 0;
            return (
              <li key={i} className="tooltip">
                <span
                  onClick={(e) => isJoinable && handleJoinRoom(item.sid)}
                  className={isJoinable ? "cursor-pointer" : undefined}
                >
                  {item.username}
                </span>
                <b>@{item.room}</b>
                &nbsp;
                <span>{item.message}</span>
                <span className="tooltiptext">{item.sid}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default App;
