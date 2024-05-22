import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import ReactStars from "react-stars";

interface ReviewModalProps {
  idLibro: string;
  isAddingReview: boolean;
  onClose: () => void;
}

interface Review {
  comentario: string;
  calificacion: number;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  idLibro,
  isAddingReview,
  onClose,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({
    comentario: "",
    calificacion: 0,
  });

  useEffect(() => {
    if (!isAddingReview) {
      axios
        .get(`api/comentarios/get/${idLibro}`)
        .then((response) => setReviews(response.data.comments))
        .catch((error) => console.error("Error fetching reviews:", error));
    }
  }, [idLibro, isAddingReview]);

  const handleAddReview = async () => {
    try {
      await axios.post("api/comentarios", {
        comentario: newReview.comentario,
        idLibro,
        calificacion: newReview.calificacion,
      });
      onClose();
    } catch (error) {
      console.error("Error adding review:", error);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="bg-white p-6 rounded-lg shadow-lg z-10 w-full max-w-xl relative">
        <a
          className="absolute top-0 right-0 p-2 text-xl text-gray-400 hover:text-gray-900 hover:cursor-pointer"
          onClick={onClose}
        >
          <FontAwesomeIcon
            icon={faTimes}
            className="text-cbookC-700 w-8 h-8"
          ></FontAwesomeIcon>
        </a>
        {isAddingReview ? (
          <div className="flex flex-col items-center">
            <h2 className="text-3xl font-cbookF font-bold text-cbookC-700 mt-3 mb-5 flex justify-center">
              Agregar Reseña
            </h2>
            <textarea
              className="w-full p-2 border rounded mb-8 mt-4 bg-gray-100 text-gray-600 text-xl font-cbookF focus:outline-none"
              placeholder="Escribe tu reseña"
              value={newReview.comentario}
              onChange={(e) =>
                setNewReview({ ...newReview, comentario: e.target.value })
              }
            />
            <div className="flex items-center">
              <label className="text-gray-600 text-xl font-cbookF">
                Calificación:{" "}
              </label>
              <ReactStars
                count={5}
                size={24}
                half={false} // Aquí se deshabilitan las medias estrellas
                value={newReview.calificacion}
                onChange={(newRating) =>
                  setNewReview({ ...newReview, calificacion: newRating })
                }
                edit={true}
                color2={"#ffd700"}
              />
            </div>
            <button
              className="bg-cbookC-700 hover:bg-cbookC-600 text-white font-cbookF font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline mt-8 mb-4"
              onClick={handleAddReview}
            >
              Agregar
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-3xl font-cbookF font-bold text-cbookC-700 mt-3 mb-5 flex justify-center">
              Reseñas
            </h2>
            {reviews.length === 0 ? (
              <p>No hay reseñas.</p>
            ) : (
              <ul>
                {reviews.map((review, index) => (
                  <li
                    key={index}
                    className="mb-2 text-gray-600 text-xl font-cbookF mt-8"
                  >
                    <p>{review.comentario}</p>
                    <div className="flex items-center">
                      <p className="mr-2">Calificación: </p>
                      <ReactStars
                        count={5}
                        size={24}
                        half={false} // Aquí se deshabilitan las medias estrellas
                        value={review.calificacion}
                        edit={false}
                        color2={"#ffd700"}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewModal;
