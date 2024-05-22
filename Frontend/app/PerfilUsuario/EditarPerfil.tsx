import React, { useState } from "react";
import axios from "axios";

interface EditarPerfilProps {
  closeModal: () => void;
}

const EditarPerfil: React.FC<EditarPerfilProps> = ({ closeModal }) => {
  const [imagenPerfil, setImagenPerfil] = useState<File | null>(null);
  const [nombre, setNombre] = useState("");
  const [modificacionNombre, setModificacionNombre] = useState(false);
  const [modificacionImagen, setModificacionImagen] = useState(false);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);

  const handleNombreChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNombre(event.target.value);
    setModificacionNombre(true);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImagenPerfil(file);
      setModificacionImagen(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const codigoUsuario = localStorage.getItem("codigoUsuario");

    if (!codigoUsuario) {
      alert("No se encontró el código de usuario.");
      return;
    }

    try {
      if (modificacionImagen) {
        const formData = new FormData();
        if (imagenPerfil) {
          formData.append("file", imagenPerfil);
        }

        await axios.patch(`/api/user/patchImage/${codigoUsuario}`, formData);
        await axios.post(`/api/notificaciones/agregarPara`, {
          codigoUsuario,
          mensaje: "Se modificó tu imagen",
        });
      }

      if (modificacionNombre) {
        await axios.patch(`/api/user/patch/${codigoUsuario}`, { nombre });
        await axios.post(`/api/notificaciones/agregarPara`, {
          codigoUsuario,
          mensaje: "Se modificó tu nombre",
        });
      }

      alert("Perfil actualizado exitosamente.");
      window.location.reload();
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      alert("Hubo un error al actualizar el perfil.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="text-center">
      <div>
        <input
          type="text"
          placeholder="Nuevo nombre de usuario"
          value={nombre}
          onChange={handleNombreChange}
          className="rounded-lg p-2 w-full bg-gray-100 text-gray-600 font-cbookF focus:outline-none mb-8"
        />
        <div className="mt-2">
          <label
            htmlFor="imagenInput"
            className="cursor-pointer font-cbookF text-cbookC-800"
          >
            Subir imagen
          </label>
          <input
            id="imagenInput"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>
        {imagenPreview && (
          <img
            src={imagenPreview}
            alt="Vista previa de la imagen"
            className="object-cover h-52 w-52 rounded-full mt-4 mx-auto"
          />
        )}
      </div>
      <div className="mt-4 flex justify-between">
        <button
          type="submit"
          className="bg-cbookC-700 hover:bg-cbookC-600 text-white font-cbookF font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
        >
          Guardar
        </button>
        <button
          type="button"
          className="bg-gray-200 hover:bg-gray-300 text-cbookC-700 font-cbookF font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
          onClick={closeModal}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default EditarPerfil;
