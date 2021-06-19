import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import colors from "./config/colors";
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

      socket.on("server/message", (item) => {
        setHistory((s) => [...s, item]);
        console.log("received message: ", item);
      });

      setUsername(socket.id);
      setRoom(socket.id);
      setRoomId(socket.id);

      return () => {
        socket.off("server/join");
        socket.off("server/leave");
        socket.off("server/message");
      };
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

  const _fileInput = useRef(null);
  const handleOpenFile = (e) => {
    e.preventDefault();
    _fileInput.current?.click();
  };

  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [history]);

  const isConnected = socket?.connected;
  const canJoinRoom = roomId !== room && isConnected;
  const canSendMessage = isConnected && roomId && message;
  const canSendFile = isConnected && roomId;

  return (
    <Container>
      {!isConnected && (
        <WarningBox>You are not connected. Reconnecting...</WarningBox>
      )}

      <MessagesBox>
        {history.map((item, i) => {
          const isJoinable = item.sid !== socket?.id && item.sid !== 0;
          const isCont = item.sid === history[history.indexOf(item) - 1]?.sid;
          const isEnd = item.sid !== history[history.indexOf(item) + 1]?.sid;
          const isMe = item.sid === socket?.id;
          return (
            <MessagesWrapper isMe={isMe} key={i}>
              {!isCont && (
                <SenderIdBox
                  onClick={(e) => isJoinable && handleJoinRoom(item.sid)}
                  className={isJoinable ? "cursor-pointer" : undefined}
                >
                  {item.username}
                </SenderIdBox>
              )}
              <MessageItem
                key={i}
                className="tooltip"
                isFirst={!isCont}
                isEnd={isEnd}
                isMe={isMe}
              >
                <MessageContent>
                  {item.message.type?.includes("image") ? (
                    <ImageContent message={item.message} />
                  ) : typeof item.message !== "string" ? (
                    <FileContent message={item.message} />
                  ) : (
                    item.message
                  )}
                </MessageContent>
              </MessageItem>
            </MessagesWrapper>
          );
        })}
        <div ref={messagesEndRef} />
      </MessagesBox>

      <InfoBox>
        <Input
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ flex: "20% 0 0" }}
        />
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            handleJoinRoom(room);
          }}
        >
          <Input
            type="text"
            placeholder="room"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
          <Button type="submit" disabled={!canJoinRoom}>
            join
          </Button>
        </Form>
      </InfoBox>

      <Form onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button type="submit" disabled={!canSendMessage}>
          send
        </Button>
        <Gap s={4} />
        <Button type="button" onClick={handleOpenFile} disabled={!canSendFile}>
          upload file
        </Button>
        <input
          ref={_fileInput}
          type="file"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files[0];
            console.log(file);
            var reader = new FileReader();
            reader.onload = function () {
              const bytes = new Uint8Array(this.result);
              console.log(bytes);
              if (isConnected && bytes)
                socket.emit("client/message", {
                  username,
                  room: roomId,
                  message: { file: bytes, type: file.type, name: file.name },
                });
            };
            reader.readAsArrayBuffer(file);
          }}
        />
      </Form>
    </Container>
  );
}

export default App;

const FileContent = ({ message: { file, type, name }, ...props }) => {
  const arrayBuffer = file;
  const blob = new Blob([arrayBuffer], { type });
  const objectURL = URL.createObjectURL(blob);

  const typeName = type.includes("audio")
    ? "Audio"
    : type.includes("video")
    ? "Video"
    : "File";

  return (
    <a href={objectURL}>
      Download {typeName} : {name}
    </a>
  );
};

const ImageContent = ({ message: { file, type }, ...props }) => {
  const arrayBuffer = file;
  const base64String = btoa(
    String.fromCharCode(...new Uint8Array(arrayBuffer))
  );
  var image = `data:${file.type};base64,${base64String}`;

  return (
    <div style={{ overflow: "hidden", maxWidth: 200, maxHeight: 200 }}>
      <img
        {...props}
        alt="message"
        src={image}
        style={{ maxWidth: 200, maxHeight: 200, objectFit: "contain" }}
      />
    </div>
  );
};

const Gap = styled.div`
  width: ${(props) => props.s}px;
  height: ${(props) => props.s}px;
`;

const Form = styled.form`
  width: 100%;
  position: relative;
  display: flex;
`;

const Input = styled.input`
  border: none;
  background-color: ${colors.bglight};
  color: inherit;
  box-sizing: border-box;
  cursor: text;
  width: auto;
  flex: 1;
  padding: 4px 8px;
  border-radius: 2px;

  &:disabled {
    background-color: ${colors.disabled};
    color: darkgray;
    cursor: none;
  }
`;

const Button = styled.button`
  border: none;
  background-color: ${colors.primary};
  color: inherit;
  box-sizing: border-box;
  cursor: pointer;
  padding: 4px 8px;
  min-width: 48px;
  border-radius: 2px;

  &:disabled {
    background-color: ${colors.disabled};
    color: darkgray;
    cursor: none;
  }
`;

const WarningBox = styled.div`
  background-color: tomato;
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  border-radius: 8px 8px 0 0;
`;

const InfoBox = styled.div`
  display: flex;
  justify-content: stretch;
  gap: 8px;
`;

const MessageContent = styled.div`
  font-weight: normal;
`;

const SenderIdBox = styled.div`
  font-size: 0.75rem;
  font-weight: bolder;
  color: #fff9;
  margin-top: 12px;
  margin-bottom: 4px;
`;

const MessageItem = styled.div`
  background-color: ${(props) =>
    props.isMe ? colors.primary : colors.secondary};
  padding: 8px 12px;
  width: max-content;
  max-width: 50%;
  border-radius: ${(props) => (props.isFirst ? "10px 10px" : "2px 2px")}
    ${(props) => (props.isEnd ? "10px 10px" : "2px 2px")};
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  min-width: 80px;
`;

const MessagesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: ${(props) => (props.isMe ? "start" : "end")};
  width: 100%;
`;

const MessagesBox = styled.div`
  flex: 1;
  background-color: ${colors.bglight};
  padding: 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-radius: 8px 8px 0 0;
  overflow-y: auto;
`;

const Container = styled.div`
  position: relative;
  height: 100vh;
  margin: 0 auto;
  padding: 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background-color: ${colors.bgdark};
  justify-content: stretch;
  gap: 8px;
`;
