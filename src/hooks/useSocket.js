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
      timeout: 5000,
      transports: ["websocket"],
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
