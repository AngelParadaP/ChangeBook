"use server";

import { db } from "@/db";
import { exchanges } from "@/db/schema";
import { eq, and, inArray, lte, gte } from "drizzle-orm";

// Obtener las fechas bloqueadas para un libro (intercambios activos)
export async function getBlockedDates(bookId: string) {
    try {
        if (!bookId) {
            return { success: false, error: "ID de libro requerido" };
        }

        const activeExchanges = await db
            .select({
                startDate: exchanges.startDate,
                endDate: exchanges.endDate,
                status: exchanges.status,
            })
            .from(exchanges)
            .where(
                and(
                    eq(exchanges.bookId, bookId),
                    inArray(exchanges.status, ["aceptado" as const, "en_curso" as const])
                )
            );

        // Generar array de rangos bloqueados
        const blockedRanges = activeExchanges.map((ex) => ({
            start: ex.startDate,
            end: ex.endDate,
            status: ex.status,
        }));

        return { success: true, blockedRanges };
    } catch (error) {
        console.error("Error fetching blocked dates:", error);
        return { success: false, error: "Error al obtener fechas bloqueadas" };
    }
}
