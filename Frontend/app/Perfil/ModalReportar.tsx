'use client'

import axios from "axios";
import { useState } from "react";

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
            setMessage('Comentario enviado con éxito');

        } catch (error) {
            console.error('Error al enviar el formulario:', error);
            setMessage('Error al enviar el formulario');
        }
        console.log(message)
    };

    return (
        <div>
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
                            <div className="flex items-center w-full mb-9">
                                <label className="block text-gray-700 text-lg font-bold mb-2 mr-4">
                                    Describe los hechos.
                                </label>
                                <button className="bg-purple-300 text-white font-bold py-2 px-4 rounded-full ml-80"
                                    onClick={onButtonClick}>
                                    X
                                </button>
                            </div>
                            <textarea
                                className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="descripcion"
                                rows="8"
                                placeholder="Escribe tu descripción aquí"
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                            ></textarea>
                        </div>
                        <div className="flex items-center justify-between">
                            <button
                                className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded focus:outline-none focus:shadow-outline"
                                type="submit"
                            >
                                Enviar
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
