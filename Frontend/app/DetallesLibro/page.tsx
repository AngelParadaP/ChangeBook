"use client";
import BookCard from "./cardBook";
import { IdBooks } from "./libro.service";
import React, { useState, useEffect } from "react";
import axios from "axios";
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
} from "@fortawesome/free-solid-svg-icons";
import { redirect } from "next/navigation";
import AddBookForm from "../Publicar/page";
import { useRouter } from "next/navigation";

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
}

const DetallesLibro = () => {
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
      router.push(`/chat?roomId=${roomId}`);
    } else {
      console.error("User ID not found in localStorage.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("codigoUsuario");
    redirect("/InicioSesion");
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

  return (
    <div className="grid grid-cols-9 grid-rows-10 gap-3 bg-gray-50 w-screen h-screen">
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
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl col-span-8 row-span-1 mt-3 mr-3 flex items-center justify-end">
        <a href="" className="flex items-center">
          <span className="font-cbookF font-bold text-x1 text-cbookC-700 mr-2">
            Notificaciones
          </span>
          <FontAwesomeIcon icon={faBell} className="w-8 h-8 text-cbookC-700" />
        </a>
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
    </div>
  );
};

export default DetallesLibro;
