// server/actions/books/createBook.ts
"use server";

import { db } from "@/db";
import { books } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function createBookAction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return { success: false, error: "No autorizado" };
    }

    // Extract data from FormData
    const title = formData.get("title") as string;
    const author = formData.get("author") as string;
    const publisher = formData.get("publisher") as string;
    const yearRaw = formData.get("year") as string;
    const description = formData.get("description") as string;
    const imageFile = formData.get("image") as File;
    const genresRaw = formData.get("genres") as string;

    // Validate required fields
    if (!title || !author || !description || !imageFile) {
      return { success: false, error: "Faltan campos requeridos" };
    }

    // Validate image file
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(imageFile.type)) {
      return { 
        success: false, 
        error: "Tipo de archivo no válido. Solo se permiten JPG, PNG y WebP." 
      };
    }

    const maxSize = 4 * 1024 * 1024; // 4MB
    if (imageFile.size > maxSize) {
      return { 
        success: false, 
        error: "El archivo es demasiado grande. Tamaño máximo: 4MB." 
      };
    }

    // Process genres
    const genresArray = genresRaw
      ? genresRaw
          .split(",")
          .map((g) => g.trim())
          .filter((g) => g.length > 0)
      : [];

    const year = yearRaw ? parseInt(yearRaw, 10) : null;

    // Upload image to UploadThing
    let imageUrl: string;
    try {
      const uploadResult = await utapi.uploadFiles(imageFile);
      
      if (!uploadResult.data || uploadResult.error) {
        throw new Error(uploadResult.error?.message || "Error al subir la imagen");
      }

      imageUrl = uploadResult.data.url;
    } catch (uploadError) {
      console.error("Error uploading image:", uploadError);
      return { 
        success: false, 
        error: "Error al subir la imagen. Por favor intenta de nuevo." 
      };
    }

    // Insert into database
    try {
      await db.insert(books).values({
        id: crypto.randomUUID(),
        ownerId: user.id,
        title,
        author,
        publisher,
        year,
        description,
        imageUrl,
        genres: genresArray,
        status: "disponible",
      });

      // Revalidate cache
      revalidatePath("/");
      revalidatePath("/home");

      return { success: true };
    } catch (dbError) {
      // If database insert fails, try to delete the uploaded image
      try {
        const fileKey = imageUrl.split("/").pop();
        if (fileKey) {
          await utapi.deleteFiles(fileKey);
        }
      } catch (deleteError) {
        console.error("Failed to cleanup uploaded image:", deleteError);
      }

      console.error("Error creating book in database:", dbError);
      return {
        success: false,
        error: dbError instanceof Error ? dbError.message : "Error al crear el libro",
      };
    }
  } catch (error) {
    console.error("Error al crear libro:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear el libro",
    };
  }
}


