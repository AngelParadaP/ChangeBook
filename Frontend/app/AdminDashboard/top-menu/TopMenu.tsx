'use client';

import { redirect } from "next/navigation";
import Link from 'next/link'
import { useEffect } from 'react';

export const TopMenu = () => {

    const handleLogout = () => {
        localStorage.removeItem("codigoUsuario");
        // Otras operaciones de limpieza, como redireccionar a la página de inicio de sesión
    };

    useEffect(() => {
        const codigoUsuario = localStorage.getItem("codigoUsuario");
        if (!codigoUsuario) {
            redirect("/InicioSesion");
        }
    }, []);

    return (
        <nav className='flex p-5 justify-between items-centered w-full mb-5 bg-gray-100'>
            <div>
                <Link href='/AdminDashboard'>
                    <span>Logo</span>
                </Link>
            </div>
            <div className='hidden sm:block'>
                <Link className='m-2 p-2 rounded-md transition-all' href='/AdminDashboard/Admit'>Aceptar usuarios</Link>
                <Link className='m-2 p-2 rounded-md transition-all' href='/AdminDashboard/AdminUsers'>Administrar Usuarios</Link>
            </div>
            <div className='felx items-center'>
                <a href='/AdminDashboard'
                    onClick={handleLogout}
                >
                    Cerrar Sesion
                </a>
            </div>
        </nav>
    )
}
