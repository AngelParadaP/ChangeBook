'use-client';

import { useEffect, useState } from "react";
import { Report } from "../interfaces/interfaces";
import { ReportCard } from "./ReportCard";

interface Props {
    report: Report;
}

interface Responsee {
    idReporte: string;
    fecha: Date;
    descripcion: string;
    codigo_remitente: string;
    resuelto: boolean;
}

export const StrikeGridItem = ({ report }: Props) => {

    const [response1, setResponse1] = useState(null);
    const [response2, setResponse2] = useState(null);
    const [, setReloadPage] = useState(false); // Variable de estado para forzar la recarga de la página

    useEffect(() => {
        if (response1 !== null || response2 !== null) {
            window.location.reload();
        }
    }, [response1, response2]);

    const handleButtonClick1 = async () => {
        try {
            const response = await fetch(`/api/user/addStrike/${report.user.codigo}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            const data = await response.json();
            setResponse1(data);
            await handleButtonClick2();
            console.log('btn 1');
        } catch (error) {
            console.error('Error fetching data from endpoint 1:', error);
        }
    };

    const handleButtonClick2 = async () => {
        try {
            const response = await fetch(`/api/report/resolve/${report.idReporte}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            console.log(data);
            setResponse2(data);
            console.log('btn 2')
        } catch (error) {
            console.error('Error fetching data from endpoint 2:', error);
        }
    };

    return (
        <div className="rounded-md overflow-hidden border border-gray-300 shadow-lg">
            <div className=" flex px-5 justify-between items-centered w-full">
                <h1 className="text-lg font-semibold">{report.idReporte}</h1>
                <h1 className="text-md text-gray-500">{report.codigo_remitente}</h1>
            </div>
            <hr />
            <ReportCard
                user={report.user}
            />
            <div className="mx-5">
                <h1>Fecha de reporte: {new Date(report.fecha).toLocaleDateString()}</h1>
                <hr />
                <p>
                    {report.descripcion}
                </p>
            </div>
            <div className="flex justify-center p-4">
                <div className="flex space-x-4">
                    <button
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
                        onClick={handleButtonClick1}
                    >
                        Agregar Strike
                    </button>
                    <button
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
                        onClick={handleButtonClick2}
                    >
                        Eliminar Reporte
                    </button>
                </div>
            </div>
        </div>
    )
}