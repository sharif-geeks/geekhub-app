import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socketURL =
  window.location.hash === "#debug"
    ? "http://localhost:5000"
    : window.location.hash === "#pyan"
    ? "https://hayyaun.pythonanywhere.com"
    : window.location.hash === "#hero"
    ? "https://geekhub-api.herokuapp.com"
    : process.env.REACT_APP_SOCKET_URL;

const useSocket = () => {
  const [state, set] = useState();

  useEffect(() => {
    console.log("socket reset!");

    const socket = io(socketURL, {
      path: "/socket.io",
      forceNew: true,
      reconnectionAttempts: 3,
      timeout: 5000,
    });

    socket.on("connect", () => {
      console.log("connected", socket.id, socket);
      set(socket);
    });

    socket.on("disconnect", () => {
      console.log("diconnected", socket);
      set(socket);
    });
  }, []);

  return state;
};

export default useSocket;
