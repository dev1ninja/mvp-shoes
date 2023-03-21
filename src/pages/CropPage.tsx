import React, { useState, useRef, useEffect } from 'react'

import ReactCrop, {
    centerCrop,
    makeAspectCrop,
    Crop,
    PixelCrop,
} from 'react-image-crop'

import { canvasPreview } from '../components/canvasPreview'
import { useDebounceEffect } from '../components/useDebounceEffect'

import 'react-image-crop/dist/ReactCrop.css'
import { HsvColorPicker } from 'react-colorful'
import cv, { Mat } from '@techstark/opencv-js'
// This is to demonstate how to make and center a % aspect crop
// which is a bit trickier so we use some helper functions.
function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number,
) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    )
}

export default function CropPage() {
    const [imgSrc, setImgSrc] = useState('')
    const previewCanvasRef = useRef<HTMLCanvasElement>(null)
    const imgRef = useRef<HTMLImageElement>(null)
    const [cropedRef, setCropedRef] = useState<HTMLCanvasElement | undefined>(undefined)
    // const hiddenAnchorRef = useRef<HTMLAnchorElement>(null)
    // const blobUrlRef = useRef('')
    const [crop, setCrop] = useState<Crop>()
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
    const [scale, setScale] = useState(1)
    const [rotate, setRotate] = useState(0)
    const [aspect, setAspect] = useState<number | undefined>(16 / 9)
    // const [color, setColor] = useState({ r: 255, g: 255, b: 255, a: 0 })
    const [HSVcolor, setHSVColor] = useState({ h: 0, s: 0, v: 0 })

    const [cropImage, setCropImage] = useState<Mat | null>(null)

    function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined) // Makes crop preview update between images.
            const reader = new FileReader()
            reader.addEventListener('load', () =>
                setImgSrc(reader.result?.toString() || ''),
            )
            reader.readAsDataURL(e.target.files[0])
        }
    }

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        if (aspect) {
            const { width, height } = e.currentTarget
            setCrop(centerAspectCrop(width, height, aspect))
        }
    }

    // function onDownloadCropClick() {
    //     if (!previewCanvasRef.current) {
    //         throw new Error('Crop canvas does not exist')
    //     }

    //     previewCanvasRef.current.toBlob((blob) => {
    //         if (!blob) {
    //             throw new Error('Failed to create blob')
    //         }
    //         if (blobUrlRef.current) {
    //             URL.revokeObjectURL(blobUrlRef.current)
    //         }
    //         blobUrlRef.current = URL.createObjectURL(blob)
    //         hiddenAnchorRef.current!.href = blobUrlRef.current
    //         hiddenAnchorRef.current!.click()
    //     })
    // }

    useDebounceEffect(
        async () => {
            if (
                completedCrop?.width &&
                completedCrop?.height &&
                imgRef.current &&
                previewCanvasRef.current
            ) {
                // We use canvasPreview as it's much faster than imgPreview.
                setCropedRef(previewCanvasRef.current)
                canvasPreview(
                    imgRef.current,
                    previewCanvasRef.current,
                    completedCrop,
                    scale,
                    rotate,
                )
            }
        },
        100,
        [completedCrop, scale, rotate],
    )

    function handleToggleAspectClick() {
        if (aspect) {
            setAspect(undefined)
        } else if (imgRef.current) {
            const { width, height } = imgRef.current
            setAspect(16 / 9)
            setCrop(centerAspectCrop(width, height, 16 / 9))
        }
    }

    useEffect(() => {
        if (cropImage && cropedRef) {
            cv.imshow(cropedRef, cropImage);
        }
    }, [cropImage]);

    useEffect(() => {
        if (imgRef.current && cropedRef) {
            // const src = cv.imread(imgRef.current)
            // const back = cv.imread(imgRef.current)
            const src = cv.imread(cropedRef)
            const hsvImg = new cv.Mat();
            cv.cvtColor(src, hsvImg, cv.COLOR_BGR2HSV);
            for (let i = 0; i < hsvImg.rows; i++) {
                for (let j = 0; j < hsvImg.cols; j++) {
                    let hsvPixel = hsvImg.ucharPtr(i, j);
                    hsvPixel[0] += HSVcolor.h;
                    hsvPixel[1] += HSVcolor.s;
                    hsvPixel[2] += HSVcolor.v;
                }
            }
            let dst = new cv.Mat();
            cv.cvtColor(hsvImg, dst, cv.COLOR_HSV2BGR);

            setCropImage(prev => {
                if (!prev?.isDeleted())
                    prev?.delete()
                return dst
            });
            
            src.delete();
            hsvImg.delete();
            // dst.delete();
        }
    }, [HSVcolor])

    return (
        <div className="App">
            <div className="Crop-Controls">
                <input type="file" accept="image/*" onChange={onSelectFile} />
                <div>
                    <label htmlFor="scale-input">Scale: </label>
                    <input
                        id="scale-input"
                        type="number"
                        step="0.1"
                        value={scale}
                        disabled={!imgSrc}
                        onChange={(e) => setScale(Number(e.target.value))}
                    />
                </div>
                <div>
                    <button onClick={handleToggleAspectClick}>
                        Toggle aspect {aspect ? 'off' : 'on'}
                    </button>
                </div>
            </div>
            {!!imgSrc && (
                <>
                    <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c: PixelCrop) => setCompletedCrop(c)}
                        aspect={aspect}
                    >
                        <img
                            ref={imgRef}
                            alt="Crop me"
                            src={imgSrc}
                            style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
                            onLoad={onImageLoad}
                        />
                    </ReactCrop>
                    <div>
                        <HsvColorPicker color={HSVcolor} onChange={setHSVColor} />
                        <div className="value">{JSON.stringify(HSVcolor)}</div>
                    </div>
                </>
            )}
            {!!completedCrop && (
                <>
                    <canvas
                        ref={previewCanvasRef}
                        style={{
                            border: '1px solid black',
                            objectFit: 'contain',
                            width: completedCrop.width,
                            height: completedCrop.height,
                        }}
                    />
                </>
            )}
        </div>
    )
}
