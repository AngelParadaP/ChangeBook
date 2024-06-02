import React from "react";
import { useRouter } from "next/navigation";

interface UserCardProps {
    codigo: string;
    nombre: string;
    imagenPerfil: string;
        isDarkMode: boolean;

}

const UserCard: React.FC<UserCardProps> = ({ codigo, nombre, imagenPerfil, isDarkMode}) => {
    const router = useRouter();

    const handleUserClick = () => {
        router.push(`/Perfil?codigoUsuario=${codigo}`);
    };

    return (

        <div className={`shadow-md rounded-md p-4 flex flex-col h-full w-full cursor-pointer ${isDarkMode ? 'bg-gray-600 text-white' : 'bg-cbookC-100'}`} onClick={handleUserClick}>
            <div className="flex items-center">
                <img
                    loading="lazy"
                    src={imagenPerfil || '/no-user.png'}
                    alt={nombre}
                    className="w-16 h-16 object-cover rounded-full"
                />
                <div className="ml-4">
                    <h2 className="text-lg font-bold font-cbookF">{nombre}</h2>
                    
                    <p           className={`text-gray-600 font-cbookF ${isDarkMode ? 'text-white' : ''}`}>{codigo}</p>
                </div>
            </div>
        </div>
    );
};

export default UserCard;

