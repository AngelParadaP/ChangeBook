import React from 'react';

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

interface BookCardProps {
  book: Book;
}

const BookCard: React.FC<BookCardProps> = ({ book }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4">
        <h2 className="font-bold text-lg">{book.titulo}</h2>
        <p className="text-sm text-gray-600">by {book.autor}</p>
        <p className="text-sm text-gray-600">{book.sinopsis}</p>
      </div>
    </div>
  );
};

export default BookCard;