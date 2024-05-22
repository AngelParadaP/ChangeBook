export interface SeedProduct {
    codigo: string;
    nombre: string;
    imagenCredencial: string;
    creadoEn: Date;
}

export interface SeedData {
    products: SeedProduct[],
}

export const initialData: SeedData = {
    products: [
        {
            codigo: "PRD001",
            nombre: "Laptop Pro 14",
            imagenCredencial: "libro_morado.png",
            // imagenCredencial: "/laptop_pro_14.jpg",
            creadoEn: new Date('2022-01-15')
        },
        {
            codigo: "PRD002",
            nombre: "Smartphone X",
            // imagenCredencial: "/smartphone_x.jpg",
            imagenCredencial: "godzilla.jpg",
            creadoEn: new Date('2022-03-20')
        },
        {
            codigo: "PRD003",
            nombre: "Tablet Y",
            // imagenCredencial: "/tablet_y.jpg",
            imagenCredencial: "godzilla.jpg",
            creadoEn: new Date('2022-05-30')
        },
        {
            codigo: "PRD004",
            nombre: "Smartwatch Z",
            // imagenCredencial: "/smartwatch_z.jpg",
            imagenCredencial: "godzilla.jpg",
            creadoEn: new Date('2022-07-10')
        },
        {
            codigo: "PRD005",
            nombre: "Auriculares Bluetooth",
            // imagenCredencial: "/auriculares_bluetooth.jpg",
            imagenCredencial: "godzilla.jpg",
            creadoEn: new Date('2022-09-05')
        },
        {
            codigo: "PRD006",
            nombre: "Monitor 4K",
            // imagenCredencial: "/monitor_4k.jpg",
            imagenCredencial: "godzilla.jpg",
            creadoEn: new Date('2022-11-22')
        },
        {
            codigo: "PRD007",
            nombre: "Teclado Mecánico",
            // imagenCredencial: "/teclado_mecanico.jpg",
            imagenCredencial: "godzilla.jpg",
            creadoEn: new Date('2023-01-17')
        },
        {
            codigo: "PRD008",
            nombre: "Ratón Inalámbrico",
            // imagenCredencial: "/raton_inalambrico.jpg",
            imagenCredencial: "godzilla.jpg",
            creadoEn: new Date('2023-03-09')
        },
        {
            codigo: "PRD009",
            nombre: "Cámara Digital",
            // imagenCredencial: "/camara_digital.jpg",
            imagenCredencial: "godzilla.jpg",
            creadoEn: new Date('2023-05-14')
        },
        {
            codigo: "PRD010",
            nombre: "Impresora Multifunción",
            // imagenCredencial: "/impresora_multifuncion.jpg",
            imagenCredencial: "godzilla.jpg",
            creadoEn: new Date('2023-07-21')
        }
    ]
}

export interface SeedReport {
    codigo: string;
    nombre: string;
    imagenCredencial: string;
    creadoEn: Date;
    report: Reports[];
}

export interface Reports {
    fecha: Date;
    descripcion: string;
    codigo: string;
}

// export interface SeedReportData {
//     reports: SeedReport[],
// }

// export const initialReportData: SeedReportData = {
//     reports: [
//         {
//             codigo: 'SR001',
//             nombre: 'Reporte de Semilla 1',
//             imagenCredencial: 'http://example.com/imagen1.jpg',
//             creadoEn: new Date('2024-01-01T10:00:00Z'),
//             report: [
//                 {
//                     fecha: new Date('2024-02-01T10:00:00Z'),
//                     descripcion: 'Descripción del reporte 1.1',
//                     codigo: 'R001'
//                 },
//                 {
//                     fecha: new Date('2024-03-01T10:00:00Z'),
//                     descripcion: 'Descripción del reporte 1.2',
//                     codigo: 'R002'
//                 }
//             ]
//         },
//         {
//             codigo: 'SR002',
//             nombre: 'Reporte de Semilla 2',
//             imagenCredencial: 'http://example.com/imagen2.jpg',
//             creadoEn: new Date('2024-02-01T11:00:00Z'),
//             report: [
//                 {
//                     fecha: new Date('2024-03-01T11:00:00Z'),
//                     descripcion: 'Descripción del reporte 2.1',
//                     codigo: 'R003'
//                 },
//                 {
//                     fecha: new Date('2024-04-01T11:00:00Z'),
//                     descripcion: 'Descripción del reporte 2.2',
//                     codigo: 'R004'
//                 }
//             ]
//         },
//         {
//             codigo: 'SR003',
//             nombre: 'Reporte de Semilla 3',
//             imagenCredencial: 'http://example.com/imagen3.jpg',
//             creadoEn: new Date('2024-03-01T12:00:00Z'),
//             report: [
//                 {
//                     fecha: new Date('2024-04-01T12:00:00Z'),
//                     descripcion: 'Descripción del reporte 3.1',
//                     codigo: 'R005'
//                 },
//                 {
//                     fecha: new Date('2024-05-01T12:00:00Z'),
//                     descripcion: 'Descripción del reporte 3.2',
//                     codigo: 'R006'
//                 }
//             ]
//         },
//         {
//             codigo: 'SR004',
//             nombre: 'Reporte de Semilla 4',
//             imagenCredencial: 'http://example.com/imagen4.jpg',
//             creadoEn: new Date('2024-04-01T13:00:00Z'),
//             report: [
//                 {
//                     fecha: new Date('2024-05-01T13:00:00Z'),
//                     descripcion: 'Descripción del reporte 4.1',
//                     codigo: 'R007'
//                 },
//                 {
//                     fecha: new Date('2024-06-01T13:00:00Z'),
//                     descripcion: 'Descripción del reporte 4.2',
//                     codigo: 'R008'
//                 }
//             ]
//         },
//         {
//             codigo: 'SR005',
//             nombre: 'Reporte de Semilla 5',
//             imagenCredencial: 'http://example.com/imagen5.jpg',
//             creadoEn: new Date('2024-05-01T14:00:00Z'),
//             report: [
//                 {
//                     fecha: new Date('2024-06-01T14:00:00Z'),
//                     descripcion: 'Descripción del reporte 5.1',
//                     codigo: 'R009'
//                 },
//                 {
//                     fecha: new Date('2024-07-01T14:00:00Z'),
//                     descripcion: 'Descripción del reporte 5.2',
//                     codigo: 'R010'
//                 }
//             ]
//         }
//     ]
// }

export interface User {
    codigo: string;
    nombre: string;
    strikes: number;
    imagenCredencial: string;
    imagenPerfil: string;
    creadoEn: Date;
    actualizadoEn: Date;
}

export interface Report {
    idReporte: string;
    fecha: Date;
    descripcion: string;
    codigo_remitente: string;
    resuelto: boolean;
    user: User;
}

export interface SeedReportData {
    reports: Report[];
}

export const initialReportData: SeedReportData = {
    reports: [
        {
            idReporte: "c6246967-2ab8-4748-b9d1-06f02ea13bc1",
            fecha: new Date("2024-05-18T22:22:56.199Z"),
            descripcion: "Reporte 1",
            codigo_remitente: "222790811",
            resuelto: false,
            user: {
                codigo: "222790812",
                nombre: "Ana García",
                strikes: 1,
                imagenCredencial: "",
                imagenPerfil: "notyet",
                creadoEn: new Date("2024-05-18T05:28:13.808Z"),
                actualizadoEn: new Date("2024-05-18T05:28:13.808Z")
            }
        },
        {
            idReporte: "c6246967-2ab8-4748-b9d1-06f02ea13bc2",
            fecha: new Date("2024-06-18T22:22:56.199Z"),
            descripcion: "Reporte 2",
            codigo_remitente: "222790812",
            resuelto: true,
            user: {
                codigo: "222790813",
                nombre: "Carlos Pérez",
                strikes: 0,
                imagenCredencial: "",
                imagenPerfil: "notyet",
                creadoEn: new Date("2024-06-18T05:28:13.808Z"),
                actualizadoEn: new Date("2024-06-18T05:28:13.808Z")
            }
        },
        {
            idReporte: "c6246967-2ab8-4748-b9d1-06f02ea13bc3",
            fecha: new Date("2024-07-18T22:22:56.199Z"),
            descripcion: "Reporte 3",
            codigo_remitente: "222790813",
            resuelto: false,
            user: {
                codigo: "222790814",
                nombre: "Laura Martínez",
                strikes: 2,
                imagenCredencial: "",
                imagenPerfil: "notyet",
                creadoEn: new Date("2024-07-18T05:28:13.808Z"),
                actualizadoEn: new Date("2024-07-18T05:28:13.808Z")
            }
        },
        {
            idReporte: "c6246967-2ab8-4748-b9d1-06f02ea13bc4",
            fecha: new Date("2024-08-18T22:22:56.199Z"),
            descripcion: "Reporte 4",
            codigo_remitente: "222790814",
            resuelto: true,
            user: {
                codigo: "222790815",
                nombre: "Miguel Rodríguez",
                strikes: 3,
                imagenCredencial: "",
                imagenPerfil: "notyet",
                creadoEn: new Date("2024-08-18T05:28:13.808Z"),
                actualizadoEn: new Date("2024-08-18T05:28:13.808Z")
            }
        }
    ]
}

export interface UserCred {
    codigo: string;
    nombre: string;
    strikes: number;
    imagenCredencial: string;
    imagenPerfil: string;
    creadoEn: Date;
    actualizadoEn: Date;
    credenciales: Credencial;
}

interface Credencial {
    codigo: string;
    password: string;
    correo: string;
    habilitado: boolean;
}