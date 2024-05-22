'use client';

import { useEffect, useState } from "react";
import { UsersGrid } from "../components/UsersGrid";
import { initialData } from "../interfaces/interfaces";
import { TopMenu } from "../top-menu/TopMenu";

const products = initialData.products;

interface User {
    codigo: string;
    nombre: string;
    strikes: number;
    imagenCredencial: string;
    imagenPerfil: string;
    creadoEn: Date;
    actualizadoEn: Date;
    credenciales: Credenciales;
}

interface Credenciales {
    codigo: string;
    password: string;
    correo: string;
    habilitado: boolean;
}

export default function AdmitUser() {

    const [credenciales, setCredenciales] = useState<User[]>([]);

    useEffect(() => {
        const fetchCredenciales = async () => {
            try {
                const response = await fetch(`/api/user/noActive`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setCredenciales(data);
            } catch (error) {
                console.error('Error fetching reports:', error);
            }
        };

        fetchCredenciales();
    }, []);

    return (
        <>
            <TopMenu />
            <UsersGrid
                products={credenciales}
            />
        </>
    )
}