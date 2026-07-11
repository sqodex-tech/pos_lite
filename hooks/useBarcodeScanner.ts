import { useEffect, useRef } from 'react';

interface UseBarcodeScannerProps {
    onScan: (barcode: string) => void;
    isActive?: boolean;
    maxDelay?: number;
    minLength?: number;
}

export function useBarcodeScanner({
    onScan,
    isActive = true,
    maxDelay = 50, // Max ms between keystrokes (scanners are usually 10-30ms)
    minLength = 4   // Minimum length of a barcode
}: UseBarcodeScannerProps) {
    const buffer = useRef<string>('');
    const lastKeyTime = useRef<number>(Date.now());

    useEffect(() => {
        if (!isActive) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if a modifier key is pressed
            if (e.ctrlKey || e.altKey || e.metaKey) return;

            const currentTime = Date.now();
            
            // Reset buffer if time between keys exceeds maxDelay (human typing)
            if (currentTime - lastKeyTime.current > maxDelay) {
                buffer.current = '';
            }

            // If Enter is pressed and buffer is long enough, trigger scan
            if (e.key === 'Enter' && buffer.current.length >= minLength) {
                // If it's an input/textarea, the scanner might have typed into it.
                // We prevent default to avoid form submission or newlines.
                const activeElement = document.activeElement as HTMLElement;
                const isInput = activeElement && (
                    activeElement.tagName === 'INPUT' || 
                    activeElement.tagName === 'TEXTAREA'
                );

                if (!isInput || (activeElement.tagName === 'INPUT' && (activeElement as HTMLInputElement).type !== 'submit')) {
                    e.preventDefault();
                }
                
                onScan(buffer.current);
                buffer.current = '';
            } 
            // Append single characters to buffer
            else if (e.key.length === 1) {
                buffer.current += e.key;
            }

            lastKeyTime.current = currentTime;
        };

        // Use capture phase to intercept before React synthetic events if needed
        window.addEventListener('keydown', handleKeyDown, true);

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [isActive, maxDelay, minLength, onScan]);
}
