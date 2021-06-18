import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const useSocket = () => {
  const [state, set] = useState();

  useEffect(() => {
    console.log("socket reset!");

    const socket = io(process.env.REACT_APP_SOCKET_URL, {
      path: "/socket.io",
      forceNew: true,
      reconnectionAttempts: 3,
      timeout: 2000,
    });

    socket.on("connect", () => {
      console.log(socket.id, socket);
      set(socket);
    });

    socket.on("disconnect", () => {
      console.log(socket.id, socket);
      set(socket);
    });
  }, []);

  return state;
};

export default useSocket;
