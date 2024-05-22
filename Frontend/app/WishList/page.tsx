"use client";
import BookCard from "./cardBook";
import { ratedBooks } from "./libro.service";

import React, { useState, useEffect } from "react";
import axios from "axios";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faHome } from "@fortawesome/free-solid-svg-icons";
import { faSignOut } from "@fortawesome/free-solid-svg-icons/faSignOut";
import { faBook } from "@fortawesome/free-solid-svg-icons/faBook";
import { faClock } from "@fortawesome/free-solid-svg-icons/faClock";
import { faUser } from "@fortawesome/free-solid-svg-icons/faUser";
import { faSearch } from "@fortawesome/free-solid-svg-icons/faSearch";
import { faBell } from "@fortawesome/free-solid-svg-icons/faBell";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";
import { parseCookies } from "nookies";
import AddBookForm from "../Publicar/page";

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

function Home() {
  const router = useRouter();
  const [navOption, setNavOption] =
    useState(""); /* Opcion de navegacion seleccionada */
  const [waitlist, setWaitlist] =
    useState(""); /* Representa la lista de espera */
  const [searchText, setSearchText] = useState("Mi Wish List");
  const [books, setBooks] = useState<Book[]>([]);
  const [searchResults, setSearchResults] = useState<Book[]>([]); // Estado para los resultados de búsqueda
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

  const [showModal, setShowModal] = useState(false);
  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("codigoUsuario");
    localStorage.removeItem("nombreUsuario"); // Eliminar el nombre de usuario del localStorage
    // Otras operaciones de limpieza, como redireccionar a la página de inicio de sesión
    router.push("/InicioSesion"); // Redireccionar a la página de inicio de sesión
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
    const codigoUsuario = localStorage.getItem("codigoUsuario");
    if (!codigoUsuario) {
      redirect("/InicioSesion");
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const codigoUsuario = localStorage.getItem("codigoUsuario");
        const response = await axios.get(
          `api/wishlist/userWishList/${codigoUsuario}`
        );
        const formattedData = response.data.map((book: any) => ({
          ...book,
          userNombre: book.user.nombre,
          codigoUsuario: book.user.codigo,
          imagen: book.imagen,
        }));
        setBooks(formattedData);
      } catch (error) {
        console.error("Error fetching books:", error);
      }
    };
    fetchData();
  }, []); // La dependencia vacía asegura que se ejecute solo una vez al montar el componente

  const redirectHome = () => {
    redirect("/Home");
  };

  const redirectPublish = () => {
    redirect("/Publicar");
  };

  const redirectLogin = () => {
    redirect("/inicioSesion");
  };

  return (
    <div className="grid grid-cols-9 grid-rows-10 gap-3 bg-gray-50 w-screen h-screen ">
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
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl col-span-8 row-span-1 mt-3 mr-3 flex items-center justify-end ">
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

      {/* Muestra de los libros */}
      <div
        className="bg-white rounded-2xl shadow-xl col-span-8 row-span-10 mb-3 overflow-auto"
        id="masLeidos"
      >
        {/* Cambios para mostrar los resultados de la búsqueda */}
        <div className="flex items-center ml-4 h-12 font-cbookF font-bold text-2xl">
          {searchText}
        </div>
        <div className="ml-4 mr-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {/* Mostrar los resultados de búsqueda si hay resultados, de lo contrario, mostrar los libros más leídos */}
          {books.map((book) => (
            <BookCard key={book.idLibro} {...book} />
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
}

export default Home;
