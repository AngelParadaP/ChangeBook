"use client"
import BookCard from './BookCard';
import { fetchBooks } from './libro.service';

import React, { useState, useEffect } from "react";
import axios from "axios";

interface Book {
  idLibro: string;
  titulo: string;
  editorial: string;
  descripcion: string;
  sinopsis: string;
  autor: string;
  calificacion: number;
  intercambios: number;
}


function ResultadoBusqueda() {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<any[]>([]);
  const [perfilUsuario, setPerfilUsuario] = useState<Book | null>(null);
    const [books, setBooks] = useState<Book[]>([]);
      const [searchText, setSearchText] = useState("Los más leídos");
        const [searchResults, setSearchResults] = useState<Book[]>([]); // Nuevo estado para los resultados de búsqueda


const handleLogout = () => {
  localStorage.removeItem("lastSearchQuery");
  // Otras operaciones de limpieza, como redireccionar a la página de inicio de sesión
};

useEffect(() => {
    const Busqueda = localStorage.getItem("lastSearchQuery");
    console.log(Busqueda)
    fetchBooks(`${Busqueda}`)
  .then((fetchedBooks) => {
    setBooks(fetchedBooks);
  })
  .catch((error) => {
    console.error('Error fetching books:', error);
  });
handleLogout()
  }, []);


  return (
      <div
        className="bg-white rounded-2xl shadow-xl col-span-6 row-span-6 mb-3 overflow-auto "
        id="masLeidos"
      >
        {/* Cambios para mostrar los resultados de la búsqueda */}
        <div className="flex items-center ml-4 h-12 font-cbookF font-bold text-2xl">
          {searchText}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Mostrar los resultados de búsqueda si hay resultados, de lo contrario, mostrar los libros más leídos */}
          {searchResults.length > 0 ? (
            searchResults.map((book) => (
              <BookCard key={book.idLibro} book={book} />
            ))
          ) : (
            books.map((book) => (
              <BookCard key={book.idLibro} book={book} />
            ))
          )}
          <button   onClick={handleLogout}
>Volver</button>
        </div>
      </div>
  );
}

export default ResultadoBusqueda;
