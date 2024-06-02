"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { fetchBooksByUser } from "./libro.service";
import BookCard from "./BookCard";
import AddBookForm from "../Publicar/page";
import ChatsModal from "../chatlist/page";
import { redirect } from "next/navigation";
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
  faComments,
  faTimes,
  faExchangeAlt,
} from "@fortawesome/free-solid-svg-icons";
import { ModalReportar } from "./ModalReportar";
import IntercambiosActivos from "../IntercambiosActivos/page";

interface PerfilUsuario {
  codigo: string;
  nombre: string;
  strikes: number;
  imagenPerfil: string;
  creadoEn: string;
  actualizadoEn: string;
}

interface Book {
  idLibro: string;
  titulo: string;
  autor: string;
  editorial: string;
  descripcion: string;
  sinopsis: string;
  calificacion: number;
  intercambios: number;
  disponible: boolean;
  userNombre: string;
  codigoUsuario: string;
  imagen: string; // Añadir esta propiedad
}

const PerfilUsuarioPage: React.FC = () => {
  const [showIntercambiosActivosModal, setShowIntercambiosActivosModal] = useState(false);
  const handleIntercambiosActivosModalClose = () => {
    setShowIntercambiosActivosModal(false);
  };

  const [showChatModal, setShowChatModal] = useState(false);
  const handleChatModalClose = () => {
    setShowChatModal(false);
  };

  const searchParams = useSearchParams();
  const router = useRouter();
  const codigoUsuario = searchParams.get("codigoUsuario");
  const [navOption, setNavOption] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [perfilUsuario, setPerfilUsuario] = useState<PerfilUsuario | null>(null);
  const [books, setBooks] = useState<Book[]>([]);

  const [isDarkMode] = useState(() => {
    const darkModeValue = localStorage.getItem('isDarkMode');
    return darkModeValue ? JSON.parse(darkModeValue) : false;
  });

  useEffect(() => {
    if (codigoUsuario) {
      const obtenerPerfilUsuario = async () => {
        try {
          const response = await axios.get(`/api/user/get/${codigoUsuario}`);
          setPerfilUsuario(response.data);
        } catch (error) {
          console.error("Error al obtener el perfil del usuario:", error);
        }
      };

      obtenerPerfilUsuario();
    }
  }, [codigoUsuario]);

  useEffect(() => {
    if (codigoUsuario) {
      fetchBooksByUser(codigoUsuario)
        .then((fetchedBooks) => {
          setBooks(fetchedBooks);
        })
        .catch((error) => {
          console.error("Error fetching books:", error);
        });
    }
  }, [codigoUsuario]);

  useEffect(() => {
    const body = document.querySelector('body');
    if (body) {
      body.classList.toggle('dark-mode', isDarkMode);
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  if (!perfilUsuario) {
    return <div>Cargando...</div>;
  }

  const handleLogout = () => {
    localStorage.removeItem("codigoUsuario");
    redirect("/InicioSesion");
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleChat = () => {
    const currentUserCode = localStorage.getItem("codigoUsuario");
    if (currentUserCode) {
      const roomId = [currentUserCode, codigoUsuario].sort().join("-");
      axios.patch(`/api/chat/mark-as-read?room=${roomId}&codigoUsuario=${currentUserCode}`);
      router.push(`/chat?roomId=${roomId}`);
    } else {
      console.error("User ID not found in localStorage.");
    }
  };

  const handleReportModal = () => {
    setShowReport(!showReport);
  };

 return (
    <div className={`grid grid-cols-9 grid-rows-10 gap-3 w-screen h-screen ${isDarkMode ? "bg-gray-800 text-white" : "bg-gray-50"}`}>
      <div className={`hidden sm:block ${isDarkMode ? "bg-gray-900" : "bg-cbookC-500"} rounded-r-3xl shadow-xl col-span-1 row-span-10 flex-col h-screen justify-between`}>
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

      {perfilUsuario && (
        <div className={`flex items-center justify-between col-span-8 row-span-1 mt-3 mr-3 mb-4 border-2 ${isDarkMode ? "border-gray-800 bg-gray-700" : "border-gray-200 bg-gradient-to-r from-cbookC-400 via-cbookC-600 to-cbookC-700"} rounded-2xl shadow-xl h-56`}>
          <div className="flex items-center">
            <div>
              {perfilUsuario.imagenPerfil ? (
                <img
                  loading="lazy"
                  src={perfilUsuario.imagenPerfil}
                  alt="Imagen de perfil"
                  className="ml-8 w-36 h-36 rounded-full mr-4"
                />
              ) : (
                <img
                  loading="lazy"
                  src="/no-user.png"
                  alt="Imagen de perfil"
                  className="ml-8 w-36 h-36 rounded-full mr-4"
                />
              )}
            </div>
            <span className="text-justify font-cbookF font-bold text-2xl max-w-full justify-center ml-5">
              <h1 className={`text-${isDarkMode ? "gray-300" : "cbookC-8s00"}`}>{perfilUsuario.nombre}</h1>
              <p className={`text-${isDarkMode ? "gray-400" : "cbookC-700"}`}>{perfilUsuario.codigo}</p>
              <br></br>
              <p className={`text-xl ${isDarkMode ? "text-gray-300" : "text-white"}`}>
                Strikes: {perfilUsuario.strikes}
              </p>
              <p className={`text-xl ${isDarkMode ? "text-gray-300" : "text-white"}`}>
                Miembro desde:{" "}
                {new Date(perfilUsuario.creadoEn).toLocaleDateString()}
              </p>
              <p className={`text-xl ${isDarkMode ? "text-gray-300" : "text-white"}`}>
                Última actualización:{" "}
                {new Date(perfilUsuario.actualizadoEn).toLocaleDateString()}
              </p>
            </span>
          </div>
          <div>
            <button
              className={`bg-cbookC-400 hover:bg-cbookC-300 mr-8 ${isDarkMode ? "text-gray-200" : "text-white"} font-cbookF font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline`}
              onClick={handleChat}
            >
              Chatear
            </button>
            <button
              className="bg-red-400 hover:bg-cbookC-300 mr-8 text-white font-cbookF font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
              onClick={handleReportModal}
              // onClick={() => setShowReport(true)}
            >
              Reportar
            </button>
          </div>
        </div>
      )}
      <div className="col-span-8 row-span-9 mt-44 mr-4 overflow-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {books.map((book) => (
            <BookCard key={book.idLibro} book={book} isDarkMode={isDarkMode} />
          ))}
        </div>
      </div>
     {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className={`p-6 rounded-lg shadow-lg z-10 w-full max-w-3xl h-5/6 flex flex-col ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
            <h2 className={`text-center font-cbookF font-bold text-3xl justify-center ${isDarkMode ? "text-white" : "text-cbookC-700"} mt-3 mb-5`}>
              Publicar Nuevo Libro
            </h2>
            <button
              className="absolute top-0 right-0 p-2"
              onClick={() => setShowModal(false)}
            >
              x
            </button>
            <div className="flex-1 overflow-auto">
              <AddBookForm isDarkMode={isDarkMode} closeModal={handleModalClose} />
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
              <ChatsModal isDarkMode={isDarkMode} closeModal={handleChatModalClose} />
            </div>
          </div>
        </div>
      )}

         {showIntercambiosActivosModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className={`p-6 rounded-lg shadow-lg relative ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
            <IntercambiosActivos isDarkMode={isDarkMode} closeModal={handleIntercambiosActivosModalClose} />
          </div>
        </div>
      )}
      {showReport && (
        <ModalReportar
        isDarkMode={isDarkMode}
          codigo={codigoUsuario}
          onButtonClick={handleReportModal}
        />
      )}
    </div>
  );
};

export default PerfilUsuarioPage;