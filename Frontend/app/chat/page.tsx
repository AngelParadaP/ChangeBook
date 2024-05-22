"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { redirect } from "next/navigation";
import AddBookForm from "../Publicar/page";
import { useRouter } from "next/navigation";
import axios from "axios";
import "./Chat.css";
import {
  faHome,
  faSignOut,
  faBook,
  faClock,
  faUser,
  faSearch,
  faBell,
  faHeart,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

interface Book {
  idLibro: string;
  titulo: string;
  editorial: string;
  descripcion: string;
  sinopsis: string;
  autor: string;
  calificacion: number;
  intercambios: number;
  disponible: boolean;
  isbn: string;
  ano_de_publicacion: string;
  userNombre: string;
  codigoUsuario: string;
  imagenPerfil: string;
  imagen: string;
}

interface Notificacion {
  idNotificacion: string;
  mensaje: string;
  resuelto: boolean;
  fecha: Date;
}

interface PerfilUsuario {
  codigo: string;
  nombre: string;
  strikes: number;
  imagenPerfil: string;
  creadoEn: string;
  actualizadoEn: string;
  notificaciones: Notificacion[];
}

const Chat = () => {
  const [messages, setMessages] = useState<
    { message: string; username: string }[]
  >([]);
  const [input, setInput] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const searchParams = useSearchParams();
  const chatContainerRef = useRef<HTMLUListElement>(null);
  const [navOption, setNavOption] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const roomId = searchParams.get("roomId");
  const [codigoUsuario1, codigoUsuario2] = roomId
    ? roomId.split("-")
    : ["", ""];
  const myCodigoUsuario = localStorage.getItem("codigoUsuario");
  const otherCodigoUsuario =
    codigoUsuario1 === myCodigoUsuario ? codigoUsuario2 : codigoUsuario1;

  const [otherUser, setOtherUser] = useState<{
    nombre: string;
    imagenPerfil: string;
    strikes: number;
    creadoEn: string;
  } | null>(null);

  useEffect(() => {
    if (!otherCodigoUsuario) return;

    const fetchOtherUserInfo = async () => {
      try {
        const response = await axios.get(`api/user/get/${otherCodigoUsuario}`);
        setOtherUser(response.data);
      } catch (error) {
        console.error("Error fetching other user info:", error);
      }
    };

    fetchOtherUserInfo();
  }, [otherCodigoUsuario]);

  const [perfilUsuario, setPerfilUsuario] = useState<PerfilUsuario | null>(
    null
  );

  //MANEJO DE LAS NOTIFICACIONES EN MENU
  //OCUPAS INFO DE PERFIL DEL USUARIO
  const [notificacionModal, setNotificacionModal] = useState(false);
  const notificacionModalShow = () => {
    setNotificacionModal(true);
  };

  const notificacionModalClose = () => {
    setNotificacionModal(false);
  };

  const solveNotification = (idNotificacion: string) => {
    // Verificar si perfilUsuario no es null o undefined antes de usarlo
    if (perfilUsuario) {
      axios.delete(`api/notificaciones/borrar/${idNotificacion}`);
      const nuevasNotificaciones = perfilUsuario.notificaciones.filter(
        (notificacion) => notificacion.idNotificacion !== idNotificacion
      );

      // Crear un nuevo objeto de perfil de usuario con las notificaciones actualizadas
      const nuevoPerfilUsuario: PerfilUsuario = {
        ...perfilUsuario,
        notificaciones: nuevasNotificaciones,
      };
      setPerfilUsuario(nuevoPerfilUsuario); // Aquí deberías usar setPerfilUsuario en lugar de setPerfil
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  useEffect(() => {
    const codigoUsuario = localStorage.getItem("codigoUsuario");

    const obtenerPerfilUsuario = async () => {
      try {
        const response = await axios.get(`api/user/get/${codigoUsuario}`);
        const perfil = response.data;
        setPerfilUsuario(perfil);
        console.log(perfil);
        localStorage.setItem("nombreUsuario", perfil.nombre); // Guardar el nombre de usuario en el localStorage
      } catch (error) {
        console.error("Error al obtener el perfil del usuario:", error);
      }
    };

    if (codigoUsuario) {
      obtenerPerfilUsuario();
    }
  }, []);

  useEffect(() => {
    if (!roomId || typeof roomId !== "string") return;

    const username =
      localStorage.getItem("nombreUsuario") ||
      prompt("Please enter your username:");
    if (!username) return;

    localStorage.setItem("nombreUsuario", username);

    const socket = io("http://localhost:3500", {
      auth: { username },
      query: { room: roomId },
    });

    socketRef.current = socket;

    socket.on("chat message", ({ message, username }) => {
      setMessages((prev) => [...prev, { message, username }]);
    });

    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3500/chat/messages",
          {
            params: { room: roomId },
          }
        );
        setMessages(
          response.data.map((msg: { content: string; user: string }) => ({
            message: msg.content,
            username: msg.user,
          }))
        );
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  const handleLogout = () => {
    localStorage.removeItem("codigoUsuario");
    redirect("/InicioSesion");
  };

  const router = useRouter();

  const handleUserClick = () => {
    router.push(`/Perfil?codigoUsuario=${books[0].codigoUsuario}`);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input && socketRef.current) {
      try {
        await axios.post("http://localhost:3500/chat/message", {
          message: input,
          username: localStorage.getItem("nombreUsuario"),
          room: roomId,
        });
        setInput("");
        window.location.reload();
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="grid grid-cols-9 grid-rows-10 gap-3 bg-gray-50 w-screen h-screen">
      {/*MENU*/}
      <div className="hidden sm:block bg-cbookC-500 rounded-r-3xl shadow-xl col-span-1 row-span-10 flex-col h-screen justify-between">
        <div className="flex items-center justify-center m-5 mb-10">
          <img
            src="/logo_completo_blanco_recortado.png"
            alt="Logo de la empresa"
            className="w-48 h-auto"
          />
        </div>

        <div className="flex flex-col items-left mx-3 gap-50 font-cbookF font-bold text-x1 cursor-pointer overflow-hidden mr-0">
          <a
            href="/Home"
            className={`py-4 text-white flex items-center p-3 transition duration-0 ${
              navOption === "inicio"
                ? "bg-cbookC-700 rounded-l-3xl"
                : "hover:bg-cbookC-700 hover:rounded-l-3xl hover:pr-12"
            }`}
            onClick={() => setNavOption("inicio")}
          >
            <FontAwesomeIcon
              icon={faHome}
              className="inline-block w-8 h-8 mr-3"
            />
            <span>Inicio</span>
          </a>
          <button
            className={`py-4 text-white flex items-center p-3 transition duration-0 ${
              navOption === "publicar"
                ? "bg-cbookC-700 rounded-l-3xl"
                : "hover:bg-cbookC-700 hover:rounded-l-3xl hover:pr-12"
            }`}
            onClick={() => {
              setNavOption("Publicar");
              setShowModal(true);
            }}
          >
            <FontAwesomeIcon
              icon={faBook}
              className="inline-block w-8 h-8 mr-3"
            />
            <span>Publicar</span>
          </button>
          <a
            href="/WishList"
            className={`py-4 text-white flex items-center p-3 transition duration-0 ${
              navOption === "wishlist"
                ? "bg-cbookC-700 rounded-l-3xl"
                : "hover:bg-cbookC-700 hover:rounded-l-3xl hover:pr-12"
            }`}
            onClick={() => setNavOption("wishlist")}
          >
            <FontAwesomeIcon
              icon={faHeart}
              className="inline-block w-8 h-8 mr-3"
            ></FontAwesomeIcon>
            <span>Wish List</span>
          </a>
          <a
            href="PerfilUsuario"
            className={`py-4 text-white flex items-center p-3 transition duration-0 ${
              navOption === "perfil"
                ? "bg-cbookC-700 rounded-l-3xl"
                : "hover:bg-cbookC-700 hover:rounded-l-3xl hover:pr-12"
            }`}
            onClick={() => setNavOption("PerfilUsuario")}
          >
            <FontAwesomeIcon
              icon={faUser}
              className="inline-block w-8 h-8 mr-3"
            />
            <span>Mi perfil</span>
          </a>
          <a
            href="Home"
            className={`py-4 text-white flex items-center p-3 transition duration-0 ${
              navOption === "buscar"
                ? "bg-cbookC-700 rounded-l-3xl"
                : "hover:bg-cbookC-700 hover:rounded-l-3xl hover:pr-12"
            }`}
            onClick={() => setNavOption("buscar")}
          >
            <FontAwesomeIcon
              icon={faSearch}
              className="inline-block w-8 h-8 mr-3"
            />
            <span>Buscar</span>
          </a>

          <a
            href="InicioSesion"
            className={`py-4 text-white flex items-center p-3 transition duration-0 ${
              navOption === "salir"
                ? "bg-cbookC-700 rounded-l-3xl"
                : "hover:bg-cbookC-700 hover:rounded-l-3xl hover:pr-12"
            }`}
            onClick={handleLogout}
          >
            <FontAwesomeIcon
              icon={faSignOut}
              className="inline-block w-8 h-8 mr-3"
            />
            <span>Salir</span>
          </a>
        </div>
      </div>
      {/*NOTIFICACIONES*/}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl col-span-8 row-span-1 mt-3 mr-3 flex items-center justify-end">
        <a
          onClick={notificacionModalShow}
          className="flex items-center hover:cursor-pointer"
        >
          <span className="font-cbookF font-bold text-x1 text-cbookC-700 mr-2">
            Notificaciones
          </span>
          <div className="relative">
            <FontAwesomeIcon
              icon={faBell}
              className="w-8 h-8 text-cbookC-700 relative z-10"
            />
            {perfilUsuario && perfilUsuario.notificaciones.length > 0 && (
              <div className="absolute -bottom-1 -right-3 right-0 bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs z-20">
                {perfilUsuario.notificaciones.length}
              </div>
            )}
          </div>
        </a>
        <img
          className="ml-6 w-10 h-10 mr-6"
          src="/libro_morado.png"
          alt="Libro"
        />
      </div>
      {/* CHAT */}
      <div className="flex flex-col items-center justify-center bg-gradient-to-r from-cbookC-500 via-cbookC-700 to-cbookC-600 rounded-2xl shadow-xl col-span-6 row-span-9 mb-3 overflow-hidden">
        <h1 className="text-2xl font-bold font-cbookF text-cbookC-200 mb-4 mt-4">
          Chateando con: {otherUser?.nombre || "Cargando..."}
        </h1>
        <ul
          ref={chatContainerRef}
          className="chat-container flex flex-col flex-grow w-full max-w-full overflow-y-auto bg-cbookC-300 shadow-md p-4"
        >
          {messages.map((message, index) => (
            <li
              key={index}
              className={`flex flex-col py-0 ${
                message.username === localStorage.getItem("nombreUsuario")
                  ? "self-end items-end"
                  : "items-start"
              }`}
            >
              <div
                className={`message-bubble ${
                  message.username === localStorage.getItem("nombreUsuario")
                    ? "sender-bubble"
                    : "receiver-bubble"
                }`}
              >
                <strong className="message-username text-cbookC-400">
                  {message.username}
                </strong>
                <p className="message-text">{message.message}</p>
              </div>
            </li>
          ))}
        </ul>
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-full flex items-center bg-gradient-to-r from-cbookC-500 via-cbookC-700 to-cbookC-600 p-4"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message"
            className="flex-1 py-2 px-4 mr-2 font-cbookF rounded-lg focus:outline-none focus:border-cbookC-800"
          />
          <button
            type="submit"
            className="bg-cbookC-700 hover:bg-cbookC-600 text-white font-cbookF font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
          >
            Enviar
          </button>
        </form>
      </div>

      {/*INFO USER*/}
      <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-xl col-span-2 row-span-9 mr-3 mb-3 flex justify-center items-center">
        <div className="flex flex-col items-center justify-between h-full space-y-4 p-8">
          {otherUser ? (
            <>
              <span className="text-center font-cbookF font-bold text-3xl max-w-44 justify-center text-cbookC-700">
                Informacion del usuario
              </span>
              <div>
                {otherUser.imagenPerfil ? (
                  <img
                    loading="lazy"
                    src={otherUser.imagenPerfil}
                    alt="Imagen de perfil"
                    className="w-40 h-40 rounded-full"
                  />
                ) : (
                  <img
                    loading="lazy"
                    src="/no-user.png"
                    alt="Imagen de perfil"
                    className="w-40 h-40 rounded-full"
                  />
                )}
              </div>
              <span className="text-center font-cbookF font-bold text-2xl max-w-52 justify-center text-gray-500">
                {otherUser.nombre}
              </span>
              <span className="text-center font-cbookF font-bold text-xl max-w-52 justify-center text-gray-500">
                Strikes: {otherUser.strikes}
              </span>
              <span className="text-center font-cbookF font-bold text-xl max-w-52 justify-center text-gray-500">
                Creado en: {new Date(otherUser.creadoEn).toLocaleDateString()}
              </span>
            </>
          ) : (
            <div className="flex flex-col items-center">Cargando...</div>
          )}
        </div>
      </div>
      {/*FORM PUBLICAR*/}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="bg-white p-6 rounded-lg shadow-lg z-10 w-full max-w-3xl h-5/6 flex flex-col">
            <h2 className="text-center font-cbookF font-bold text-3xl justify-center text-cbookC-700 mt-3 mb-5">
              Publicar Nuevo Libro
            </h2>
            <button
              className="absolute top-0 right-0 p-2"
              onClick={() => setShowModal(false)}
            >
              x
            </button>
            <div className="flex-1 overflow-auto">
              <AddBookForm closeModal={handleModalClose} />
            </div>
          </div>
        </div>
      )}

      {notificacionModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="bg-white p-6 rounded-lg shadow-lg z-10 w-3/5 max-w-screen-2xl h-3/6 flex flex-col relative">
            <h2 className="text-center font-cbookF font-bold text-3xl justify-center text-cbookC-700 mt-3 mb-5">
              Notificaciones
            </h2>
            <button
              className="absolute top-0 right-0 p-2"
              onClick={notificacionModalClose}
            >
              <FontAwesomeIcon
                icon={faTimes}
                className="text-cbookC-700 w-8 h-8"
              ></FontAwesomeIcon>
            </button>
            {/* Renderización de las notificaciones */}
            <div
              className="flex-col overflow-auto border-cbookC-600"
              id="masLeidos"
            >
              {perfilUsuario ? (
                perfilUsuario?.notificaciones.length !== 0 ? (
                  perfilUsuario.notificaciones.map((notificacion) => (
                    <div
                      key={notificacion.idNotificacion}
                      className="border border-cbookC-500 rounded-md flex items-center justify-between p-2 mb-2"
                    >
                      <p className="flex-1">{notificacion.mensaje}</p>
                      <button
                        className="ml-4 p-2 rounded-xl bg-cbookC-500 text-cbookC-200 hover:text-white"
                        onClick={() =>
                          solveNotification(notificacion.idNotificacion)
                        }
                      >
                        Descartar
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center">
                    No hay notificaciones por mostrar
                  </div>
                )
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
