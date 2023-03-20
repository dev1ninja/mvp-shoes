import React, { useState } from 'react';

export default function UploadImages() {
    const [images, setImages] = useState([]);

    function onImageChange(e) {
        setImages([...e.target.files]);
    }

    return (
        <>
            <input type="file" multiple accept='image/*' onChange={onImageChange} />
        </>
    )
}