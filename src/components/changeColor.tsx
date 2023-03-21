import React, { useState } from 'react';
import cv, { Mat, Scalar } from '@techstark/opencv-js';
const ColorChanger: React.FC = () => {
    const [image, setImage] = useState<Mat | null>(null);
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const src = cv.imread(img);
                const hsv = new cv.Mat();
                cv.cvtColor(src, hsv, cv.COLOR_RGB2HSV);
                const lower = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [30, 0, 0, 0]); // Change the lower and upper bounds here
                const upper = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [90, 255, 255, 255]);
                const mask = new cv.Mat();
                cv.inRange(hsv, lower, upper, mask);
                const dst = new cv.Mat();
                const color = new cv.Scalar(0, 255, 0, 255); // Change the color here
                cv.cvtColor(src, dst, cv.COLOR_RGBA2RGB);
                cv.bitwise_and(dst, dst, dst, mask);
                cv.addWeighted(src, 1, dst, 0, 0, dst);
                cv.imshow('canvas', dst);
                setImage(dst);
                src.delete();
                hsv.delete();
                lower.delete();
                upper.delete();
                mask.delete();
                dst.delete();
            };
            img.src = event.target?.result as string;
        }; reader.readAsDataURL(file as Blob);
    };
    return (
        <div>
            <input type= "file" onChange = { handleImageChange } />
            <canvas id="canvas" > </canvas>
        </div >   
    );
}; export default ColorChanger; 