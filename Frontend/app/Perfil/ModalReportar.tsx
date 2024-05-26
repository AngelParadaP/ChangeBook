'use client'

import axios from "axios";
import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Props {
    codigo: string | null
    onButtonClick: () => void;
}

export const ModalReportar = ({ codigo, onButtonClick }: Props) => {
    const [descripcion, setDescripcion] = useState('');
    const [message, setMessage] = useState('');
    const codigo_remitente = localStorage.getItem("codigoUsuario");

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const response = await axios.post(`/api/report/to/${codigo}`, { descripcion, codigo_remitente });
            toast.success("Reporte enviado con exito", {
                autoClose: 1000,  // Duración de 1000 ms (1 segundo)
                hideProgressBar: true,
                position: "top-center",
            });
            setTimeout(() => {
                onButtonClick();  // Cerrar el modal después de 1 segundo
            }, 1000);
        } catch (error) {
            console.error('Error al enviar el formulario:', error);
            toast.error("Fallo de envio del reporte", {
                autoClose: 1000,  // Duración de 1000 ms (1 segundo)
                hideProgressBar: true,
                position: "top-center",
            });
        }
        console.log(message);
    };

    return (
        <div>
            <ToastContainer/>
            {/* Black background */}
            <div
                className="fixed top-0 left-0 w-screen h-screen z-10 bg-black opacity-30"
            >
            </div>
            {/* Blur */}
            <div className="fixed top-0 left-0 w-screen h-screen z-10 backdrop-filter backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white p-10 rounded-lg shadow-2xl w-full max-w-2xl">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <div className="flex items-center justify-between w-full mb-9">
                                <label className="block text-gray-700 text-lg font-bold mb-2">
                                    Describe los hechos.
                                </label>
                            </div>
                       <textarea
                                className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-none"
                                id="descripcion"
                                rows="8"
                                placeholder="Escribe tu descripción aquí"
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                            ></textarea>
                        </div>
                        <div className="flex items-center justify-center space-x-4">
                            <button
          className="bg-cbookC-700 hover:bg-cbookC-600 text-white font-cbookF font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline mt-4"
                                type="submit"
                            >
                                Enviar
                            </button>
                            <button
          className="mt-4 bg-gray-200 hover:bg-gray-300 text-cbookC-700 font-cbookF font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
                                type="button"
                                onClick={onButtonClick}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                    {message && (
                        <p className={`mt-4 text-center rounded-md py-2 px-4 ${message !== "Comentario enviado con éxito" ? 'bg-red-200 text-red-800 border border-red-400' : 'bg-green-200 text-green-800 border border-green-400'}`}>
                            {message}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

