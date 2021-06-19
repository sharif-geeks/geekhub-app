import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const urlParams = new URLSearchParams(window.location.search);
const customURL = urlParams.get("url");
const socketURL =
  customURL || process.env.NODE_ENV === "development"
    ? "http://" + window.location.hostname + ":5000"
    : "/";
console.log("connecting: ", socketURL);

const useSocket = () => {
  const [state, set] = useState();

  useEffect(() => {
    console.log("socket reset!");

    const socket = io(socketURL, {
      path: "/socket.io",
      forceNew: true,
      reconnectionAttempts: 3,
      timeout: 10000,
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
