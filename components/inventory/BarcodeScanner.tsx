"use client";

import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: any) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onScanFailure }) => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            rememberLastUsedCamera: true,
            // You can restrict formats here if needed, but defaults support most 1D and 2D formats
        };

        scannerRef.current = new Html5QrcodeScanner("reader", config, false);

        scannerRef.current.render(
            (decodedText) => {
                // Clear scanner on success to stop scanning
                if (scannerRef.current) {
                    scannerRef.current.clear().catch(console.error);
                }
                onScanSuccess(decodedText);
            },
            (error) => {
                if (onScanFailure) {
                    onScanFailure(error);
                }
            }
        );

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        };
    }, [onScanSuccess, onScanFailure]);

    return (
        <div className="w-full h-full min-h-[300px] flex flex-col items-center">
            <div id="reader" className="w-full rounded-lg overflow-hidden bg-white dark:bg-slate-900" />
        </div>
    );
};

export default BarcodeScanner;
