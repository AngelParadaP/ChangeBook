"use server";

import { db } from "@/db";
import { books, favorites, exchanges, communityBookRecommendations } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function deleteBook(bookId: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return { success: false, error: "No estás autenticado" };
    }

    const book = await db.query.books.findFirst({
      where: eq(books.id, bookId),
    });

    if (!book) {
      return { success: false, error: "Libro no encontrado" };
    }

    if (book.ownerId !== session.user.id) {
      return { success: false, error: "No tienes permisos para eliminar este libro" };
    }

    const activeExchange = await db.query.exchanges.findFirst({
      where: and(
        eq(exchanges.bookId, bookId),
        inArray(exchanges.status, ["pendiente", "aceptado", "en_curso"]),
      ),
    });

    if (activeExchange) {
      return {
        success: false,
        error: "No puedes eliminar un libro con un intercambio pendiente, aceptado o en curso",
      };
    }

    if (book.imageUrl) {
      try {
        const fileKey = book.imageUrl.split("/").pop();
        if (fileKey) {
          await utapi.deleteFiles([fileKey]);
        }
      } catch (e) {
        console.error("Error deleting image from UploadThing:", e);
      }
    }

    await db.delete(communityBookRecommendations).where(eq(communityBookRecommendations.bookId, bookId));
    await db.delete(favorites).where(eq(favorites.bookId, bookId));
    await db.delete(books).where(eq(books.id, bookId));

    return { success: true, message: "Libro eliminado exitosamente" };
  } catch (error) {
    console.error("Error deleting book:", error);
    return {
      success: false,
      error: "Error al eliminar el libro. Por favor, intenta de nuevo.",
    };
  }
}
