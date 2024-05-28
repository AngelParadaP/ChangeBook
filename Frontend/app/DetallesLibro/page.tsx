"use client";
import BookCard from "./cardBook";
import { IdBooks } from "./libro.service";
import React, { useState, useEffect } from "react";
import axios from "axios";
import ChatsModal from "../chatlist/page"
import { useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  faComments,
  faExchangeAlt,
} from "@fortawesome/free-solid-svg-icons";
import { redirect } from "next/navigation";
import AddBookForm from "../Publicar/page";
import { useRouter } from "next/navigation";
import IntercambiosActivos from "../IntercambiosActivos/page";

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

interface PerfilUsuario {
  codigo: string;
  nombre: string;
  strikes: number;
  imagenPerfil: string;
  creadoEn: string;
  actualizadoEn: string;
  notificaciones: Notificacion[];

}

interface Notificacion {
  idNotificacion: string;
  mensaje: string;
  resuelto: boolean;
  fecha: Date;
  roomId:string | null
}

const DetallesLibro = () => {
  const [showChatModal, setShowChatModal] = useState(false);
    const handleChatModalClose = () => {
    setShowChatModal(false);
  };
  const [showIntercambiosActivosModal, setShowIntercambiosActivosModal] = useState(false);
 const handleIntercambiosActivosModalClose = () => {
    setShowIntercambiosActivosModal(false);
  };

const handleNotificationClick = (roomId: string | null, idNotificacion: string) => {
  // Verificar si roomId es nulo o indefinido
  if (roomId==="1" || roomId===null) {
    // Aquí puedes manejar la lógica para las notificaciones normales
    console.log("Notificación normal");
    return;
  }

  // Redirigir al usuario al chat con la sala específica
      if (perfilUsuario) {
            const currentUserCode = localStorage.getItem("codigoUsuario");

      axios.delete(`api/notificaciones/borrar/${idNotificacion}`);
       axios.patch(`/api/chat/mark-as-read?room=${roomId}&codigoUsuario=${currentUserCode}`);

      const nuevasNotificaciones = perfilUsuario.notificaciones.filter(
        (notificacion) => notificacion.idNotificacion !== idNotificacion
      );
      // Crear un nuevo objeto de perfil de usuario con las notificaciones actualizadas
      const nuevoPerfilUsuario: PerfilUsuario = {
        ...perfilUsuario,
        notificaciones: nuevasNotificaciones,
      };
      setPerfilUsuario(nuevoPerfilUsuario); // Aquí deberías usar setPerfilUsuario en lugar de setPerfil
          setNotificacionModal(false);
        router.push(`/chat?roomId=${roomId}`);

    }
};
  const searchParams = useSearchParams();
  const idLibro = searchParams.get("idLibro");
  const [navOption, setNavOption] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [perfilUsuario, setPerfilUsuario] = useState<PerfilUsuario | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);

  const handleModalClose = () => {
    setShowModal(false);
  };

  const router = useRouter();
  const handleUserClick = () => {
    router.push(`/Perfil?codigoUsuario=${books[0].codigoUsuario}`);
  };

  const handleChat = () => {
    const currentUserCode = localStorage.getItem("codigoUsuario");
    if (currentUserCode) {
      // Ordenar los IDs para que el roomId sea el mismo independientemente del orden
      const roomId = [currentUserCode, books[0].codigoUsuario].sort().join("-");
      axios.patch(`/api/chat/mark-as-read?room=${roomId}&codigoUsuario=${currentUserCode}`);

      router.push(`/chat?roomId=${roomId}`);
    } else {
      console.error("User ID not found in localStorage.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("codigoUsuario");
    redirect("/InicioSesion");
  };

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

  useEffect(() => {
    const codigoUsuario = localStorage.getItem("codigoUsuario");

    const obtenerPerfilUsuario = async () => {
      try {
        const response = await axios.get(`api/user/get/${codigoUsuario}`);
        setPerfilUsuario(response.data);
      } catch (error) {
        console.error("Error al obtener el perfil del usuario:", error);
      }
    };

    if (codigoUsuario) {
      obtenerPerfilUsuario();
    }
  }, []);

  useEffect(() => {
    const codigoUsuario = localStorage.getItem("codigoUsuario");
    if (!codigoUsuario) {
      redirect("/InicioSesion");
    }
  }, []);

  useEffect(() => {
    IdBooks(idLibro)
      .then((IdBooks) => {
        setBooks(IdBooks);
      })
      .catch((error) => {
        console.error("Error fetching books:", error);
      });
  }, [idLibro]);

    useEffect(() => {
    const codigoUsuario = localStorage.getItem("codigoUsuario");

    const obtenerPerfilUsuario = async () => {
      try {
        const response = await axios.get(`api/user/get/${codigoUsuario}`);
        const perfil = response.data;
        setPerfilUsuario(perfil);
        if (perfil.notificaciones.length > 0) {
        }
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

  return (
    <div className="grid grid-cols-9 grid-rows-10 gap-3 bg-gray-50 w-screen h-screen">
      {/*Navigator de la izquierda */}
      <div className="hidden sm:block bg-cbookC-500 rounded-r-3xl shadow-xl col-span-1 row-span-10 flex-col h-screen justify-between">
        <div className="flex items-center justify-center m-5 mb-10">
          <img
            src="/logo_completo_blanco_recortado.png"
            alt="Logo de la empresa"
            className="w-48 h-auto"
          />
        </div>

        {/* Menú lateral izquierdo*/}
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
            ></FontAwesomeIcon>
            <span>Inicio</span>
          </a>

           <button
            className={`py-4 text-white flex items-center p-3 transition duration-0 ${
              navOption === "chatlist"
                ? "bg-cbookC-700 rounded-l-3xl"
                : "hover:bg-cbookC-700 hover:rounded-l-3xl hover:pr-12"
            }`}
            onClick={() => {
              setNavOption("chatlist");
              setShowChatModal(true);
            }}
          >
            <FontAwesomeIcon
              icon={faComments}
              className="inline-block w-8 h-8 mr-3"
            />
            <span>mis chats</span>
          </button>

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
            ></FontAwesomeIcon>
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
            ></FontAwesomeIcon>
            <span>Mi perfil</span>
          </a>

        <button
            className={`py-4 text-white flex items-center p-3 transition duration-0 ${
              navOption === "IntercambiosActivos"
                ? "bg-cbookC-700 rounded-l-3xl"
                : "hover:bg-cbookC-700 hover:rounded-l-3xl hover:pr-12"
            }`}
            onClick={() => {
              setNavOption("IntercambiosActivos");
              setShowIntercambiosActivosModal(true)
            }}
          >
            <FontAwesomeIcon
              icon={faExchangeAlt}
              className="inline-block w-8 h-8 mr-3"
            ></FontAwesomeIcon>
            <span>            Intercambios </span>
          </button>

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
            ></FontAwesomeIcon>
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
            ></FontAwesomeIcon>
            <span>Salir</span>
          </a>
            
        </div>
      </div>
      {/*Barra superior con notificaciones */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl col-span-8 row-span-1 mt-3 mr-3 flex items-center justify-end relative">
        <div>
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
        </div>
        <img
          className="ml-6 w-10 h-10 mr-6"
          src="/libro_morado.png"
          alt="Libro"
        />
      </div>

      {/* Muestra de los libros */}
      <div className="bg-white rounded-2xl shadow-xl col-span-6 row-span-9 mb-3 overflow-auto">
        <div className="flex items-center ml-4 h-4 font-cbookF font-bold text-2xl"></div>
        <div className="ml-4 mr-4 grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 gap-4 mb-4">
          {books.map((book) => (
            <BookCard key={book.idLibro} {...book} />
          ))}
        </div>
      </div>

      {/* Información del propietario del libro */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-xl col-span-2 row-span-9 mr-3 mb-3 flex justify-center items-center">
        <div className="flex flex-col items-center justify-between h-full space-y-4 p-8">
          {books.length > 0 ? (
            <>
              <span className="text-center font-cbookF font-bold text-3xl max-w-44 justify-center text-cbookC-700">
                Prestador
              </span>
              <div>
                {books[0].imagenPerfil ? (
                  <img
                    loading="lazy"
                    src={books[0].imagenPerfil}
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
                {books[0].userNombre}
                <br />
                <br />
                Intercambios: {books[0].intercambios}
              </span>
              <button
                onClick={handleUserClick}
                className="bg-cbookC-700 hover:bg-cbookC-600 text-white font-cbookF font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
              >
                Ver perfil
              </button>
              <button
                className="bg-cbookC-700 hover:bg-cbookC-600 text-white font-cbookF font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
                onClick={handleChat}
              >
                Chatear
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center"></div>
          )}
        </div>
      </div>
{/* Modal Intercambios Activos */}
      {showIntercambiosActivosModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg relative">
            <IntercambiosActivos closeModal={handleIntercambiosActivosModalClose} />
            <button
              className="absolute top-0 right-0 p-2"
              onClick={handleIntercambiosActivosModalClose}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>
      )}
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

      {showChatModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="bg-white p-6 rounded-lg shadow-lg z-10 w-full max-w-3xl h-5/6 flex flex-col">
            <h2 className="text-center font-cbookF font-bold text-3xl justify-center text-cbookC-700 mt-3 mb-5">
              Mis Chats
            </h2>
            <button
              className="absolute top-0 right-0 p-2"
              onClick={() => setShowChatModal(false)}
            >
              x
            </button>
            <div className="flex-1 overflow-auto">
              <ChatsModal closeModal={handleChatModalClose} />
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
  className={`border border-cbookC-500 rounded-md flex items-center justify-between p-2 mb-2 ${
    notificacion.roomId && notificacion.roomId !== "1" ? "cursor-pointer hover:bg-gray-100" : ""
  }`}
>
  <p   onClick={() => handleNotificationClick(notificacion.roomId,notificacion.idNotificacion)}
className="flex-1">{notificacion.mensaje}</p>
  {notificacion.roomId && (
    <button
      className="ml-4 p-2 rounded-xl bg-cbookC-500 text-cbookC-200 hover:text-white"
      onClick={() => solveNotification(notificacion.idNotificacion)}
    >
      Descartar
    </button>
  )}
</div>
                  ))
                ) : (
                  <div className="text-center">
                    No tienes notificaciones pendientes.
                  </div>
                )
              ) : (
                <div className="text-center">Cargando...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetallesLibro;
