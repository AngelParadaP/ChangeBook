import { useCallback, useRef } from "react";

interface UseLongPressOptions {
    onLongPress: () => void;
    onContextMenu?: boolean; // also trigger on right-click (desktop), default true
    delay?: number; // ms, default 500
}

/**
 * Hook that provides touch handlers for long-press on mobile
 * and optionally onContextMenu for desktop right-click.
 */
export function useLongPress({
    onLongPress,
    onContextMenu = true,
    delay = 500,
}: UseLongPressOptions) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPress = useRef(false);
    const touchMoved = useRef(false);

    const start = useCallback(() => {
        isLongPress.current = false;
        touchMoved.current = false;
        timerRef.current = setTimeout(() => {
            isLongPress.current = true;
            onLongPress();
        }, delay);
    }, [onLongPress, delay]);

    const clear = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const handleTouchStart = useCallback(() => {
        start();
    }, [start]);

    const handleTouchMove = useCallback(() => {
        // If finger moves, cancel the long press
        touchMoved.current = true;
        clear();
    }, [clear]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (isLongPress.current) {
            // Prevent click/tap from firing after long press
            e.preventDefault();
        }
        clear();
    }, [clear]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        if (onContextMenu) {
            e.preventDefault();
            onLongPress();
        }
    }, [onLongPress, onContextMenu]);

    return {
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
        onContextMenu: handleContextMenu,
    };
}
