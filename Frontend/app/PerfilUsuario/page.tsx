"use client";
import React, { useEffect, useState } from "react";
import BookCard from "./cardBook";
import EditarPerfil from "./EditarPerfil"; // Importa el componente EditarPerfil
import { fetchBooks } from "./libro.service";
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

interface User {
  codigo: string;
  nombre: string;
  strikes: number;
  imagenPerfil: string;
  creadoEn: Date;
  actualizadoEn: Date;
}

interface PerfilUsuario {
  codigo: string;
  nombre: string;
  strikes: number;
  imagenPerfil: string;
  creadoEn: string;
  actualizadoEn: string;
}

//AQUI EMPIEZA LA FUNCION
const Perfil: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [navOption, setNavOption] = useState("");
  const [showModal, setShowModal] = useState(false);
  const searchParams = useSearchParams();
  const idLibro = searchParams.get("idLibro");
  const [showEditForm, setShowEditForm] = useState(false); // Nuevo estado para controlar la visibilidad del formulario de edición

  const handleLogout = () => {
    localStorage.removeItem("codigoUsuario");
    redirect("/InicioSesion");
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  useEffect(() => {
    const codigoUsuario = localStorage.getItem("codigoUsuario");

    const obtenerPerfilUsuario = async () => {
      try {
        const response = await axios.get(`api/user/get/${codigoUsuario}`);
        setUser(response.data);
        console.log(response.data);
      } catch (error) {
        console.error("Error al obtener el perfil del usuario:", error);
      }
    };

    if (codigoUsuario) {
      obtenerPerfilUsuario();
    }
  }, []);

  useEffect(() => {
    fetchBooks()
      .then((fetchedBooks) => {
        setBooks(fetchedBooks);
      })
      .catch((error) => {
        console.error("Error fetching books:", error);
      });
  }, []);

  const handleDeleteBook = (idLibro: string) => {
    setBooks(books.filter((book) => book.idLibro !== idLibro));
  };

  const handleUpdateAvailability = (idLibro: string, disponible: boolean) => {
    setBooks((prevBooks) =>
      prevBooks.map((book) =>
        book.idLibro === idLibro ? { ...book, disponible: !disponible } : book
      )
    );
  };

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
      {user && (
        <div className="flex items-center justify-between col-span-8 row-span-1 mt-3 mr-3 mb-4 border-gray-200 border-2 bg-gradient-to-r from-cbookC-400 via-cbookC-600 to-cbookC-700 rounded-2xl shadow-xl h-56">
          <div className="flex items-center">
            <div>
              {user.imagenPerfil ? (
                <img
                  loading="lazy"
                  src={user.imagenPerfil}
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
            <span className="text-justify font-cbookF font-bold text-2xl max-w-full justify-center text-white ml-5">
              {user.nombre}
              <br />
              <span className="text-cbookC-700">{user.codigo}</span>
              <br />
              <br />
              Strikes: {user.strikes}
            </span>
          </div>
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            className="bg-cbookC-400 hover:bg-cbookC-300 mr-8 text-white font-cbookF font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline mt-4"
          >
            Editar Perfil
          </button>
        </div>
      )}
      {showEditForm && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded-lg shadow-md w-1/3 relative">
            <h2 className="text-center font-cbookF font-bold text-3xl justify-center text-cbookC-700 mt-3 mb-8">
              Editar Perfil
            </h2>
            <button
              onClick={() => setShowEditForm(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 focus:outline-none flex"
            >
              x
            </button>
            <EditarPerfil closeModal={() => setShowEditForm(false)} />
          </div>
        </div>
      )}
      <div
        className="col-span-8 row-span-9 border-gray-200 border-2 overflow-auto mt-44"
        id="masLeidos"
      >
        <div className="grid grid-cols-1 gap-4">
          {books.map((book) => (
            <BookCard
              key={book.idLibro}
              book={book}
              onDelete={handleDeleteBook}
              onUpdateAvailability={handleUpdateAvailability}
            />
          ))}
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

export default Perfil;
