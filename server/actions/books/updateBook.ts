"use server";

import { db } from "@/db";
import { books } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface UpdateBookData {
  title?: string;
  author?: string;
  publisher?: string | null;
  year?: number | null;
  description?: string;
  genres?: string[];
  status?: "disponible" | "intercambiado";
}

export async function updateBook(bookId: string, data: UpdateBookData) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return {
        success: false,
        error: "No estás autenticado",
      };
    }

    // Verify the book exists and user is the owner
    const book = await db.query.books.findFirst({
      where: eq(books.id, bookId),
    });

    if (!book) {
      return {
        success: false,
        error: "Libro no encontrado",
      };
    }

    if (book.ownerId !== session.user.id) {
      return {
        success: false,
        error: "No tienes permisos para editar este libro",
      };
    }

    // Validate required fields
    if (data.title && data.title.trim().length === 0) {
      return {
        success: false,
        error: "El título es obligatorio",
      };
    }

    if (data.author && data.author.trim().length === 0) {
      return {
        success: false,
        error: "El autor es obligatorio",
      };
    }

    if (data.description && data.description.trim().length === 0) {
      return {
        success: false,
        error: "La descripción es obligatoria",
      };
    }

    if (data.genres && data.genres.length === 0) {
      return {
        success: false,
        error: "Debes seleccionar al menos un género",
      };
    }

    // Prepare update data
    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.author) updateData.author = data.author;
    if (data.publisher !== undefined) updateData.publisher = data.publisher;
    if (data.year !== undefined) updateData.year = data.year;
    if (data.description) updateData.description = data.description;
    if (data.genres) updateData.genres = data.genres;
    if (data.status) updateData.status = data.status;

    // Update the book
    await db.update(books).set(updateData).where(eq(books.id, bookId));

    return {
      success: true,
      message: "Libro actualizado exitosamente",
    };
  } catch (error) {
    console.error("Error updating book:", error);
    return {
      success: false,
      error: "Error al actualizar el libro. Por favor, intenta de nuevo.",
    };
  }
}
