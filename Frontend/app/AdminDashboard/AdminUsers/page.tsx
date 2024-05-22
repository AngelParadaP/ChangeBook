'use client';

import { useEffect, useState } from "react";
import { StrikeGrid } from "../components/StrikeGrid";
import { initialReportData } from "../interfaces/interfaces";
import { TopMenu } from "../top-menu/TopMenu";

// const reports = initialReportData.reports;

// Define the Report interface
interface User {
    codigo: string;
    nombre: string;
    strikes: number;
    imagenCredencial: string;
    imagenPerfil: string;
    creadoEn: Date;
    actualizadoEn: Date;
}

interface Report {
    idReporte: string;
    fecha: Date;
    descripcion: string;
    codigo_remitente: string;
    resuelto: boolean;
    user: User;
}



export default function () {

    const [reports, setReports] = useState<Report[]>([]);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const response = await fetch(`/api/report`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setReports(data);
            } catch (error) {
                console.error('Error fetching reports:', error);
            }
        };

        fetchReports();
    }, []);

    return (
        <>
            <TopMenu />
            <StrikeGrid
                reports={reports}
            />
        </>
    );
}