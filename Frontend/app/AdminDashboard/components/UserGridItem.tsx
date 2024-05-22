'use-client';

import Image from "next/image";
import { SeedProduct, UserCred } from "../interfaces/interfaces"
import { useEffect, useState } from "react";

interface Props {
    product: UserCred;
}

export const UserGridItem = ({ product }: Props) => {

    const [response1, setResponse1] = useState(null);

    useEffect(() => {
        if (response1 !== null) {
            window.location.reload();
        }
    }, [response1]);

    const handleButtonClick1 = async () => {
        try {
            const response = await fetch(`/api/credenciales/habilitarUser/${product.codigo}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ habilitar: true }),
            });
            const data = await response.json();
            setResponse1(data);
            console.log('btn 1');
        } catch (error) {
            console.error('Error fetching data from endpoint 1:', error);
        }
    };

    return (
        <div className="rounded-md overflow-hidden border border-gray-300 shadow-lg">
            <img
                src={product.imagenCredencial}
                alt={product.nombre}
                loading="lazy"
                className="min-w-64"
            />
            <div className="p-4 flex flex-col">
                <h3 className="text-lg font-semibold">{product.nombre}</h3>
                <h3 className="text-md text-gray-500">{product.codigo}</h3>
            </div>
            <div className="flex justify-center p-4">
                <div className="flex space-x-4">
                    <button
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
                        onClick={handleButtonClick1}
                    >
                        Aceptar
                    </button>
                </div>
            </div>
        </div>
    )
}


// SELECT * FROM users INNER JOIN credenciales ON users.codigo = credenciales.codigo WHERE credenciales.habilitado = false;