"use client";

import { useState, KeyboardEvent, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { parseBookCardMessage, encodeBookCardMessage, BookCardData } from "@/lib/utils/bookCardMessage";
import { BookOpen, X, Send, ImagePlus, Loader2 } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";
import ImageCropper from "@/components/ui/ImageCropper";

interface ChatInputProps {
    onSend: (message: string, imageUrl?: string) => void;
    disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [message, setMessage] = useState("");
    const [bookCard, setBookCard] = useState<BookCardData | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showCropper, setShowCropper] = useState(false);
    const [rawImage, setRawImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { startUpload } = useUploadThing("imageUploader");

    // Initial load from draft query param
    useEffect(() => {
        const draft = searchParams.get("draft");
        if (draft) {
            const { hasBookCard, bookCard: parsedCard, textMessage } = parseBookCardMessage(draft);
            if (hasBookCard && parsedCard) {
                setBookCard(parsedCard);
                setMessage(textMessage);
            } else {
                setMessage(draft);
            }

            // Remove draft from URL without refreshing the page
            const newSearchParams = new URLSearchParams(searchParams.toString());
            newSearchParams.delete("draft");
            const newUrl = newSearchParams.toString() ? `${pathname}?${newSearchParams.toString()}` : pathname;
            router.replace(newUrl, { scroll: false });
        }
    }, [searchParams, pathname, router]);

    const handleSend = async () => {
        if ((!message.trim() && !bookCard && !imageFile) || disabled) return;

        let uploadedImageUrl: string | undefined;

        // Upload image if present
        if (imageFile) {
            setIsUploading(true);
            try {
                const res = await startUpload([imageFile]);
                if (res?.[0]) {
                    uploadedImageUrl = res[0].ufsUrl || res[0].url;
                }
            } catch (err) {
                console.error("Error uploading image:", err);
                setIsUploading(false);
                return;
            }
            setIsUploading(false);
        }

        if (bookCard) {
            const finalMessage = encodeBookCardMessage(bookCard, message);
            onSend(finalMessage, uploadedImageUrl);
        } else {
            onSend(message.trim(), uploadedImageUrl);
        }

        setMessage("");
        setBookCard(null);
        setImageFile(null);
        setImagePreview(null);

        // Reset textarea height
        const target = document.getElementById('chat-input-textarea') as HTMLTextAreaElement;
        if (target) {
            target.style.height = "40px";
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setRawImage(reader.result as string);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
        }
        // Reset input so same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleCropComplete = (croppedBlob: Blob, previewUrl: string) => {
        const file = new File([croppedBlob], "chat-image.webp", { type: "image/webp" });
        setImageFile(file);
        setImagePreview(previewUrl);
        setShowCropper(false);
        setRawImage(null);
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    return (
        <>
            <div className="flex flex-col bg-card border-t border-card-border dark:border-card-border">
                {/* Book Card Preview */}
                {bookCard && (
                    <div className="px-4 py-3 bg-subtle border-b border-card-border flex items-center justify-between">
                        <div className="flex items-center gap-3 relative max-w-sm w-full bg-card p-2 rounded-xl border border-card-border shadow-sm">
                            <div className="w-10 h-14 bg-dim rounded overflow-hidden flex-shrink-0 relative">
                                {bookCard.imageUrl ? (
                                    <Image
                                        src={bookCard.imageUrl}
                                        alt={bookCard.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <BookOpen size={16} className="text-hint" />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col flex-1 min-w-0 pr-4">
                                <span className="text-xs font-bold text-heading truncate">{bookCard.title}</span>
                                <span className="text-[10px] text-caption truncate">{bookCard.author}</span>
                                <span className="text-[10px] text-primary mt-0.5">Adjuntado para enviar</span>
                            </div>
                            <button
                                onClick={() => setBookCard(null)}
                                className="absolute -top-2 -right-2 bg-card w-6 h-6 rounded-full flex items-center justify-center text-hint hover:text-body hover:bg-dim transition-colors shadow-sm border border-card-border"
                                title="Quitar libro"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Image Preview */}
                {imagePreview && (
                    <div className="px-4 py-3 bg-subtle border-b border-card-border">
                        <div className="relative inline-block">
                            <Image
                                src={imagePreview}
                                alt="Vista previa"
                                width={120}
                                height={120}
                                className="rounded-xl object-cover max-h-[120px] w-auto border border-card-border"
                            />
                            <button
                                onClick={handleRemoveImage}
                                className="absolute -top-2 -right-2 bg-card w-6 h-6 rounded-full flex items-center justify-center text-hint hover:text-body hover:bg-dim transition-colors shadow-sm border border-card-border"
                                title="Quitar imagen"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex items-end gap-2 p-3">
                    {/* Image attachment button */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled || isUploading}
                        className="p-2 text-hint hover:text-primary hover:bg-soft rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
                        title="Adjuntar imagen"
                    >
                        <ImagePlus size={20} />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    <textarea
                        id="chat-input-textarea"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribe un mensaje..."
                        disabled={disabled || isUploading}
                        rows={1}
                        className="flex-1 px-4 py-2 rounded-xl border border-card-border dark:border-card-border bg-subtle text-heading focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark resize-none max-h-32 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        style={{
                            minHeight: "40px",
                            maxHeight: "128px",
                        }}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = "40px";
                            target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                        }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={(!message.trim() && !bookCard && !imageFile) || disabled || isUploading}
                        className="p-2.5 bg-primary dark:bg-primary-dark text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                        {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </div>
            </div>

            {/* Image Cropper Modal */}
            {showCropper && rawImage && (
                <ImageCropper
                    imageSrc={rawImage}
                    onCropComplete={handleCropComplete}
                    onCancel={() => { setShowCropper(false); setRawImage(null); }}
                    aspectRatio={1}
                    aspectRatios={[
                        { label: "1:1", value: 1, icon: "square" },
                        { label: "4:3", value: 4 / 3, icon: "landscape" },
                        { label: "3:4", value: 3 / 4, icon: "portrait" },
                    ]}
                />
            )}
        </>
    );
}
