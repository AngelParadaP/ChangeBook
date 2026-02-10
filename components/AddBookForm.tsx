// src/components/AddBookForm.tsx
"use client";

import { createBookAction } from "@/server/actions/books/createBook";
import { useRef } from "react";
import { useFormStatus } from "react-dom";

// Subcomponente para el botón de envío con estado
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? (
        <span className="flex items-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Publicando...
        </span>
      ) : (
        "Publicar Libro"
      )}
    </button>
  );
}

export function AddBookForm() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-100 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Intercambiar un Libro
      </h2>

      <form
        ref={formRef}
        action={async (formData) => {
          await createBookAction(formData);
          formRef.current?.reset(); // Limpiar formulario tras éxito
          alert("¡Libro publicado con éxito!");
        }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Título */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Título
            </label>
            <input
              name="title"
              required
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
          </div>

          {/* Autor */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Autor
            </label>
            <input
              name="author"
              required
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
          </div>

          {/* Año */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Año de Edición
            </label>
            <input
              name="year"
              type="number"
              min="1500"
              max={new Date().getFullYear()}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
          </div>

          {/* Editorial */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Editorial
            </label>
            <input
              name="publisher"
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
          </div>

          {/* Géneros */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Géneros{" "}
              <span className="text-gray-400 font-normal">
                (separados por coma)
              </span>
            </label>
            <input
              name="genres"
              required
              type="text"
              placeholder="Ej: Ficción, Misterio, Realismo Mágico"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
            <p className="mt-1 text-xs text-gray-500">
              Estos tags se usarán para recomendar tu libro a otros lectores.
            </p>
          </div>

          {/* URL Imagen */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              URL de Portada
            </label>
            <input
              name="imageUrl"
              required
              type="url"
              placeholder="https://..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
          </div>

          {/* Descripción */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Descripción / Sinopsis
            </label>
            <textarea
              name="description"
              required
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            ></textarea>
          </div>
        </div>

        <div className="pt-4">
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
