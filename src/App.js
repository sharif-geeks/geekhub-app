import { useEffect, useState } from "react";
import "./App.css";
import useSocket from "./hooks/useSocket";

function App() {
  const socket = useSocket();
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [room, setRoom] = useState("");
  const [roomId, setRoomId] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (socket?.connected) {
      console.log("adding listeners");

      socket.on("server/join", (id) => {
        console.log("joined room: ", id);
        setRoomId(id);
      });

      socket.on("server/leave", (prevRoom) => {
        console.log("left room: " + prevRoom);
      });

      socket.on("server/message", (item) => setHistory((s) => [...s, item]));

      setUsername(socket.id);
      setRoomId(socket.id);
    }
  }, [socket]);

  const handleJoinRoom = (id) => {
    if (!socket?.connected) return alert("you are not connected!");
    console.log("joining room: " + id);
    if (roomId !== "" && roomId !== socket?.id) {
      socket.emit("client/leave", { username, room: roomId }, (ack) => {
        console.log("leaveing room: ", roomId);
        setRoomId(null);
      });
      socket.emit("client/join", { username, room: id });
    } else socket.emit("client/join", { username, room: id });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!socket?.connected) return alert("you are not connected!");
    socket.emit("client/message", { username, room: roomId, message });
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
          placeholder="room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <input type="submit" disabled={!isConnected} value="join" />
      </form>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="message"
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
                <span>{" >>> "}</span>
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
